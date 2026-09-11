"""
backend/knowledge_graph.py — KAVACH-AI Incremental Local Graph & Metaprompt Engine
==================================================================================
Implements:
1. Graph Topology Traversal (Nodes & Edges)
2. Dual-Track Query Routing (General Theory vs Proprietary Hardware)
3. Abstention on Bad Evidence (Point #5 in 18-Point Checklist)
4. Revision Conflict Detection (Point #4 in 18-Point Checklist)
5. Grounded Metaprompt Construction (Chain-of-Thought + Evidence Injection)
"""

import re
import json
import sqlite3
from typing import Dict, Any, Optional, Tuple
from database import get_db_connection

# Strict asset tag regex (requires prefix + ID, e.g. PUMP-A, VALVE-12, REACTOR-999)
ASSET_TAG_REGEX = re.compile(
    r'\b(PUMP-[A-Za-z0-9]+|VALVE-[A-Za-z0-9]+|HEX-[A-Za-z0-9]+|COMPRESSOR-[A-Za-z0-9]+|BOILER-[A-Za-z0-9]+|REACTOR-[A-Za-z0-9]+|TURBINE-[A-Za-z0-9]+|TANK-[A-Za-z0-9]+|E_\d+|S_\d+)\b',
    re.IGNORECASE
)

def extract_equipment_id(text: str) -> Optional[str]:
    """
    Extracts explicit equipment tag identifiers from natural language query.
    e.g. "Check PUMP-A status" -> "PUMP-A", "What about VALVE-12?" -> "VALVE-12",
         "REACTOR-999 maintenance" -> "REACTOR-999".
    Generic words like "a pump" or "valves" are NOT treated as specific asset IDs.
    """
    match = ASSET_TAG_REGEX.search(text)
    if match:
        return match.group(1).upper()
    return None

def is_general_query(text: str) -> bool:
    """
    Determines if the query is general engineering / math / code theory
    that should be answered by pre-trained LLM weights without requiring database grounding.
    """
    general_keywords = [
        "what is", "how does", "explain", "formula", "principle", 
        "write python", "write code", "function", "lambda", "definition",
        "difference between", "thermodynamics", "reynolds"
    ]
    lower_text = text.lower()
    return any(k in lower_text for k in general_keywords) and extract_equipment_id(text) is None

def get_entity_profile(entity_id: str) -> Optional[Dict[str, Any]]:
    """
    Traverses the SQLite Knowledge Graph to build a complete 360-degree profile:
    - Node properties & current revision
    - Inbound & outbound topological relationships (edges)
    - Recent maintenance incidents & tickets
    - Latest sensor telemetry readings
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Fetch Node
    cursor.execute("SELECT * FROM graph_nodes WHERE node_id = ?", (entity_id,))
    node = cursor.fetchone()
    if not node:
        conn.close()
        return None

    profile = {
        "entity_id": node["node_id"],
        "name": node["name"],
        "type": node["entity_type"],
        "properties": json.loads(node["properties"]) if node["properties"] else {},
        "criticality": node["criticality"],
        "active_revision": node["active_revision"],
        "source_doc": node["source_doc"],
        "connections": [],
        "maintenance_logs": [],
        "latest_telemetry": None
    }

    # 2. Fetch Connected Edges
    cursor.execute("""
    SELECT relation, target_node FROM graph_edges WHERE source_node = ?
    UNION
    SELECT ('REGULATED_BY_REVERSE' || relation), source_node FROM graph_edges WHERE target_node = ?
    """, (entity_id, entity_id))
    for row in cursor.fetchall():
        profile["connections"].append(f"{row[0]} -> {row[1]}")

    # 3. Fetch Maintenance Logs
    cursor.execute("""
    SELECT date, incident_type, description, downtime_hours, status, technician 
    FROM maintenance_logs WHERE equipment_id = ? ORDER BY date DESC
    """, (entity_id,))
    for row in cursor.fetchall():
        profile["maintenance_logs"].append({
            "date": row["date"],
            "type": row["incident_type"],
            "desc": row["description"],
            "downtime_hrs": row["downtime_hours"],
            "status": row["status"],
            "technician": row["technician"]
        })

    # 4. Fetch Latest Sensor Telemetry (if applicable)
    cursor.execute("""
    SELECT timestamp, voltage, current, temperature, power, vibration, operational_status, fault_status, failure_type
    FROM sensor_telemetry WHERE equipment_id = ? ORDER BY timestamp DESC LIMIT 1
    """, (entity_id,))
    sensor = cursor.fetchone()
    if sensor:
        profile["latest_telemetry"] = {
            "timestamp": sensor["timestamp"],
            "temperature_c": sensor["temperature"],
            "vibration_m_s2": sensor["vibration"],
            "operational_status": sensor["operational_status"],
            "fault_status": sensor["fault_status"],
            "failure_type": sensor["failure_type"]
        }

    conn.close()
    return profile

def check_revision_conflict(doc_name: str, new_revision: str, entity_id: str, parameter: str, new_value: str) -> Optional[Dict[str, Any]]:
    """
    Point #4 in Research Checklist: Revision-aware retrieval + conflict detection.
    Compares incoming document parameters against active baseline parameters.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT properties, active_revision FROM graph_nodes WHERE node_id = ?", (entity_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None

    current_props = json.loads(row["properties"]) if row["properties"] else {}
    old_value = current_props.get(parameter)
    old_revision = row["active_revision"]

    if old_value and str(old_value).strip().lower() != str(new_value).strip().lower():
        # Conflict detected!
        cursor.execute("""
        INSERT INTO revision_conflicts (entity_id, parameter, old_revision, old_value, new_revision, new_value)
        VALUES (?, ?, ?, ?, ?, ?)
        """, (entity_id, parameter, old_revision, str(old_value), new_revision, str(new_value)))
        conn.commit()
        conn.close()

        return {
            "conflict": True,
            "entity_id": entity_id,
            "parameter": parameter,
            "old_revision": old_revision,
            "old_value": old_value,
            "new_revision": new_revision,
            "new_value": new_value,
            "warning": f"[CONFLICT ALERT] {old_revision} ({parameter}={old_value}) contradicts incoming {new_revision} ({parameter}={new_value})!"
        }

    conn.close()
    return None

def evaluate_evidence(user_query: str) -> Dict[str, Any]:
    """
    Dual-track evaluation & Abstention Gate (Point #5):
    - If General Theory -> PASS to direct LLM.
    - If Asset specified & Found in Graph -> PASS with Grounded Profile.
    - If Asset specified & NOT Found -> ABSTAIN with Request Human Review.
    """
    if is_general_query(user_query):
        return {
            "track": "GENERAL_THEORY",
            "abstain": False,
            "entity_id": None,
            "profile": None
        }

    entity_id = extract_equipment_id(user_query)
    
    if not entity_id:
        # No specific entity requested, check if it's general
        return {
            "track": "GENERAL_UNGROUNDED",
            "abstain": False,
            "entity_id": None,
            "profile": None
        }

    profile = get_entity_profile(entity_id)
    if not profile:
        # High-stakes asset queried but not present in plant database
        return {
            "track": "PLANT_ASSET",
            "abstain": True,
            "entity_id": entity_id,
            "verdict": "[INSUFFICIENT EVIDENCE] Request Human Review",
            "reason": f"Asset '{entity_id}' does not exist in verified refinery registry or blueprints. System strictly abstains from guessing safety limits."
        }

    return {
        "track": "PLANT_ASSET",
        "abstain": False,
        "entity_id": entity_id,
        "profile": profile
    }

def construct_metaprompt(user_query: str, evaluation: Dict[str, Any]) -> str:
    """
    Assembles the 4-Pillar Industrial Metaprompt:
    1. Role & Persona (Senior Reliability Engineer)
    2. Negative Guardrails (Zero hallucination, cite dates & status)
    3. Injected SQLite Evidence
    4. Chain-of-Thought (Step-by-Step)
    """
    if evaluation.get("track") == "GENERAL_THEORY" or not evaluation.get("profile"):
        return f"""
[ROLE]: You are KAVACH-AI Sovereign Industrial Assistant.
Provide a clear, technically rigorous answer to the user's engineering inquiry.

[USER QUERY]:
{user_query}
"""

    profile = evaluation["profile"]
    
    # Format maintenance history
    maint_lines = []
    for log in profile["maintenance_logs"]:
        maint_lines.append(f"- Date: {log['date']} | Type: {log['type']} | Downtime: {log['downtime_hrs']}h | Status: {log['status']} | Tech: {log['technician']} | Note: {log['desc']}")
    maint_text = "\n".join(maint_lines) if maint_lines else "No recorded incident tickets."

    # Format telemetry
    telemetry_text = "No real-time sensor streams attached."
    if profile.get("latest_telemetry"):
        t = profile["latest_telemetry"]
        telemetry_text = f"Temp: {t['temperature_c']}°C | Vibration: {t['vibration_m_s2']} m/s² | Operational: {t['operational_status']} | Fault: {t['fault_status']} ({t['failure_type']})"

    return f"""
[ROLE & PERSONA]:
You are KAVACH-AI, Senior Industrial Reliability & Safety Engineer operating on-premises in a sovereign air-gapped refinery.
Your technical assessments impact operational safety, worker lives, and plant compliance.

[OPERATIONAL GUARDRAILS]:
1. STRICT GROUNDING: Restrict all factual claims exclusively to the [VERIFIED REFINERY EVIDENCE] block below.
2. EVIDENCE CITATION: Always cite exact Equipment ID, Revision, Incident Dates, and Technician names.
3. RISK FLAGGING: If an equipment has >= 2 incident records, classify it as "CHRONIC VULNERABILITY".
4. OPEN TICKET ALERT: Explicitly highlight any unresolved ("OPEN") maintenance incidents.

[VERIFIED REFINERY EVIDENCE (SQLite Knowledge Graph)]:
- Equipment: {profile['entity_id']} ({profile['name']})
- Criticality: {profile['criticality']} | Active Revision: {profile['active_revision']}
- Design Specifications: {json.dumps(profile['properties'])}
- Topology & Interconnects: {', '.join(profile['connections']) if profile['connections'] else 'Isolated'}
- Live Telemetry Stream: {telemetry_text}
- Historical Maintenance Incidents:
{maint_text}

[OPERATOR QUERY]:
{user_query}

[CHAIN-OF-THOUGHT REASONING FRAMEWORK]:
1. Identify the target asset and verify its operational status from the evidence.
2. Analyze failure frequency, chronic patterns, and active open tickets.
3. Formulate an actionable, safety-first engineering directive.
"""

if __name__ == "__main__":
    # Self-test the knowledge graph
    print("Testing Knowledge Graph Engine:")
    ev1 = evaluate_evidence("Explain the working principle of a centrifugal pump.")
    print(f"1. General Query Track: {ev1['track']} | Abstain: {ev1['abstain']}")

    ev2 = evaluate_evidence("What is the status of PUMP-A and recommend actions?")
    print(f"2. Known Asset Query Track: {ev2['track']} | Abstain: {ev2['abstain']} | Asset: {ev2['entity_id']}")

    ev3 = evaluate_evidence("Emergency procedure for REACTOR-999?")
    print(f"3. Unknown Asset Query Track: {ev3['track']} | Abstain: {ev3['abstain']} | Reason: {ev3.get('reason')}")
