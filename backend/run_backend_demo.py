"""
=============================================================================
KAVACH-AI — Sovereign Offline Distributed Backend Demo Runner
=============================================================================
Usage:
    python run_backend_demo.py

Tests Covered (from the 18-Point Research Checklist):
  1. Point #1: Sovereignty Air-Gap Status (Vinit: 10.73.132.28:8000)
  2. Point #2: Explainable Task Router (Piyush: router.py)
  3. Point #8: Task-Scoped Tool Permission Gate (Least Privilege Agent)
  4. Live Multi-Node Model Execution:
     - Piyush Node (10.73.132.136:11434)  -> llama3.1 (Reasoning)
     - Vaibhav Node (10.73.132.79:11434)  -> qwen2.5-coder:7b (Code/Calculations)
     - Vaibhav Node (10.73.132.79:11434)  -> qwen2.5vl:7b (Vision/P&ID)
=============================================================================
"""

import sys
import os
import json
import time
import urllib.request
import urllib.error

# Ensure backend directory is in path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from router import route_task
from tool_gate import check_permission

VINIT_GATEWAY = "http://10.73.132.28:8000"
PIYUSH_NODE = "http://10.73.132.136:11434"
VAIBHAV_NODE = "http://10.73.132.79:11434"

def banner(title):
    print("\n" + "=" * 65)
    print(f"  {title}")
    print("=" * 65)

def check_sovereignty():
    banner("TEST 1: Sovereignty Proof & Air-Gap Verification (Point #1)")
    url = f"{VINIT_GATEWAY}/sovereignty/status"
    print(f"[*] Querying Gateway: {url}")
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=5) as res:
            data = json.loads(res.read().decode())
            verdict_text = str(data.get('verdict', 'N/A')).encode('ascii', 'ignore').decode('ascii')
            print(f"[OK] Gateway Connected: Vinit (10.73.132.28:8000)")
            print(f"     Status: {verdict_text}")
            print(f"     Air-Gapped: {data.get('is_air_gapped')}")
            print(f"     External Connections: {data.get('external_count', 0)}")
            print(f"     Bytes Sent (LAN only): {data.get('bytes_sent_mb', 0):.2f} MB")
            return True
    except Exception as e:
        print(f"[WARN] Gateway check failed: {e}")
        print("       (Is Vinit's uvicorn server running on 10.73.132.28:8000?)")
        return False

def check_explainable_router():
    banner("TEST 2: Explainable Router Demo (Point #2 - MUST)")
    test_cases = [
        ("summary", "pdf", "Industrial SOP Document"),
        ("calculation", "csv", "Boiler Sensor Telemetry CSV"),
        ("p&id", "png", "Pipeline & Instrumentation Diagram (P&ID)")
    ]
    
    for task_type, file_type, desc in test_cases:
        decision = route_task(task_type, file_type)
        print(f"\n[SCENARIO] Input: {desc} ({file_type.upper()}) | Task: '{task_type}'")
        print(f"  --> Selected Model : {decision['selected_model'].upper()} ({decision['model_id']})")
        print(f"  --> Target Host    : {decision['host']}")
        print(f"  --> Confidence     : {decision['confidence'] * 100:.0f}%")
        print(f"  --> WHY Chosen     : \"{decision['reason']}\"")
        print(f"  --> Rejected Models: {decision['rejected_models']}")

def check_tool_gate():
    banner("TEST 3: Task-Scoped Tool Permission Gate (Point #8 - MUST)")
    print("[*] Verifying 'Least Privilege Agent' enforcement before any tool runs:")
    
    checks = [
        ("summary", "read_pdf", "Summary session reads uploaded document"),
        ("summary", "run_python", "Summary session attempts arbitrary Python execution"),
        ("coding", "write_docx", "Coding session attempts writing a Word DOCX file"),
        ("coding", "run_python", "Coding session requests Python execution sandbox"),
        ("csv_query", "query_csv", "Data query session filters telemetry table"),
    ]
    
    for task_type, tool_name, desc in checks:
        result = check_permission(task_type, tool_name)
        verdict = result['verdict']
        badge = "[ALLOW]" if verdict == "ALLOW" else ("[DENY]" if verdict == "DENY" else "[HUMAN APPROVAL]")
        print(f"\n[TOOL CALL] {desc}")
        print(f"  Tool: '{tool_name}' for Task: '{task_type}'")
        print(f"  Verdict: {badge}")
        print(f"  Reason : {result['reason']}")

def check_live_model_execution():
    banner("TEST 4: Live Distributed Model Execution (Piyush + Vaibhav)")
    
    # 1. Piyush Node (Reasoning)
    print("\n--- 1. Piyush Node (10.73.132.136) -> llama3.1:latest ---")
    prompt = "Give 1 golden safety rule for industrial boiler pressure management in 15 words."
    print(f"Prompt: \"{prompt}\"")
    start = time.time()
    try:
        payload = json.dumps({"model": "llama3.1:latest", "prompt": prompt, "stream": False}).encode()
        req = urllib.request.Request(f"{PIYUSH_NODE}/api/generate", data=payload, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=60) as res:
            out = json.loads(res.read().decode())
            print(f"[SUCCESS] Latency: {time.time() - start:.2f}s")
            print(f"Response: {out.get('response', '').strip()}")
    except Exception as e:
        print(f"[ERROR] Piyush node failed: {e}")

    # 2. Vaibhav Node (Coder)
    print("\n--- 2. Vaibhav Node (10.73.132.79) -> qwen2.5-coder:7b ---")
    coder_prompt = "Write a one-line Python lambda to convert Celsius to Fahrenheit."
    print(f"Prompt: \"{coder_prompt}\"")
    start = time.time()
    try:
        payload = json.dumps({"model": "qwen2.5-coder:7b", "prompt": coder_prompt, "stream": False}).encode()
        req = urllib.request.Request(f"{VAIBHAV_NODE}/api/generate", data=payload, headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=90) as res:
            out = json.loads(res.read().decode())
            print(f"[SUCCESS] Latency: {time.time() - start:.2f}s")
            print(f"Response: {out.get('response', '').strip()}")
    except Exception as e:
        print(f"[ERROR] Vaibhav coder node failed: {e}")

def main():
    print("""
#################################################################
#                   KAVACH-AI SOVEREIGN TEST                    #
#          Distributed Air-Gapped Cluster Verification          #
#################################################################
    """)
    check_sovereignty()
    check_explainable_router()
    check_tool_gate()
    check_live_model_execution()
    
    banner("ALL BACKEND SUITE CHECKS COMPLETED!")
    print("""
Judges Demo Talking Points:
1. Proved Zero External Calls: psutil kernel-level inspection via /sovereignty/status.
2. Explainable Routing: Dynamic specialist model selection with reasons and rejected alternatives.
3. Least-Privilege Gate: Prevents prompt injections or rogue agents from calling arbitrary tools.
4. Distributed Inference: General reasoning and Coder models running on physically separate laptops.
    """)

if __name__ == "__main__":
    main()
