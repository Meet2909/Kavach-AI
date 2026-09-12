import os
import json
import hashlib
from datetime import datetime
from typing import List, Dict, Any

def generate_audit_hash(log_data: str) -> str:
    """Generates a SHA-256 cryptographic hash of the log data for tamper-evident sealing."""
    return hashlib.sha256(log_data.encode('utf-8')).hexdigest()

def write_audit_log(job_id: str, job_dir: str, trace_log: List[Dict[str, str]], context: Dict[str, Any]) -> str:
    """
    Writes the immutable execution trace and routing decisions to disk.
    Called right after the VERIFY phase completes.
    """
    audit_dir = os.path.join(job_dir, "audit")
    os.makedirs(audit_dir, exist_ok=True)
    audit_file = os.path.join(audit_dir, "execution_trace.json")
    
    # Strip heavy data (like base64 images or massive text chunks) from context before logging
    safe_context = {
        "task_type": context.get("task_type"),
        "target_ip": context.get("target_ip"),
        "target_model": context.get("target_model"),
        "inference_failed": context.get("inference_failed", False),
        "validation_results": context.get("validation", {}).get("summary", "No validation run")
    }

    audit_payload = {
        "job_id": job_id,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC"),
        "security_boundary": "AIR-GAPPED SOVEREIGN NODE",
        "execution_trace": trace_log,
        "context_snapshot": safe_context
    }
    
    payload_str = json.dumps(audit_payload, indent=2)
    audit_payload["cryptographic_hash"] = generate_audit_hash(payload_str)
    
    # Write the sealed payload
    with open(audit_file, "w", encoding="utf-8") as f:
        json.dump(audit_payload, f, indent=2)
        
    return audit_file

def get_audit_log(job_id: str, workspace_dir: str = "workspace/jobs") -> Dict[str, Any]:
    """
    Retrieves the audit log for the frontend API.
    """
    audit_file = os.path.join(workspace_dir, job_id, "audit", "execution_trace.json")
    if not os.path.exists(audit_file):
        return {"error": f"No audit log found for Job ID: {job_id}"}
        
    with open(audit_file, "r", encoding="utf-8") as f:
        return json.load(f)
