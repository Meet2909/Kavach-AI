import os
import uuid
import shutil
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

# Import the state machine that Meet built
from agent import execute_agent_loop, AgentMemory

# Import router and csv tools
from router import route_task
from csv_tool import query_csv, get_csv_schema

# Import Vinit's tools
from sandbox import run_python_in_sandbox, check_sandbox_ready
from tool_gate import check_permission, get_allowed_tools, Verdict
from artifact_validator import validate_artifact
from sovereignty_monitor import (
    get_sovereignty_status,
    start_snapshot,
    end_snapshot,
    get_process_network_usage
)

app = FastAPI(
    title="KAVACH-AI API Gateway",
    description="Sovereign AI Orchestrator — No external calls made."
)

# CORS Middleware — allows Vite frontend (port 5173, 5174, LAN IPs) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory job store (maps job_id -> AgentMemory for live trace polling)
jobs_db = {}

# Ensure the workspace directory exists on startup
WORKSPACE_DIR = os.path.join(os.getcwd(), "workspace", "jobs")
os.makedirs(WORKSPACE_DIR, exist_ok=True)

# ─────────────────────────────────────────────
# Request/Response models
# ─────────────────────────────────────────────

class TaskRequest(BaseModel):
    task_type: str   # e.g. "summary", "coding", "vision", "csv_query"
    prompt: str      # The human's instruction


class CsvQueryRequest(BaseModel):
    file_path: Optional[str] = None
    filters: Optional[Dict[str, Any]] = None
    columns: Optional[List[str]] = None
    max_rows: int = 50


class RouteRequest(BaseModel):
    task_type: str
    file_type: str = ""


# ─────────────────────────────────────────────
# ENDPOINT 1: Health Check
# ─────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Ping from the React frontend to verify the backend is online."""
    sandbox_status = check_sandbox_ready()
    return {
        "status": "API is live",
        "version": "1.0",
        "timestamp": datetime.now().isoformat(),
        "sandbox": sandbox_status
    }


# ─────────────────────────────────────────────
# ENDPOINT 7: Run Code in Docker Sandbox
# ─────────────────────────────────────────────

class CodeRequest(BaseModel):
    code: str     # The Python code string to execute
    job_id: str   # Ties execution to an existing job for audit trail

@app.post("/run_code")
def run_code(request: CodeRequest):
    """
    Executes AI-generated Python code inside an isolated Docker sandbox.
    Network is disabled inside the container — proves sovereignty.
    A hard 15s timeout kills any runaway loop.
    """
    result = run_python_in_sandbox(request.code, job_id=request.job_id)
    return result


# ─────────────────────────────────────────────
# ENDPOINT 8: Tool Permission Gate
# ─────────────────────────────────────────────

class PermissionRequest(BaseModel):
    task_type: str   # e.g. "summary", "coding", "vision"
    tool_name: str   # e.g. "run_python", "write_docx"

@app.post("/check_permission")
def check_tool_permission(request: PermissionRequest):
    """
    Checks whether a tool call is ALLOW / DENY / HUMAN_APPROVAL
    for the given task type. Called by the agent before every tool execution.
    This implements the 'Least Privilege Agent' principle.
    """
    return check_permission(request.task_type, request.tool_name)


@app.get("/tools/{task_type}")
def list_allowed_tools(task_type: str):
    """
    Returns all tools and their permission verdicts for a given task type.
    The agent calls this during the PLAN phase to know its own permissions.
    """
    return get_allowed_tools(task_type)


# ─────────────────────────────────────────────
# ENDPOINT 2: Upload File(s)
# ─────────────────────────────────────────────

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Receives one or more documents from the UI and initialises a job.
    Creates an isolated folder workspace/jobs/<job_id>/input/ for this job.
    """
    job_id = str(uuid.uuid4())[:8]
    input_dir = os.path.join(WORKSPACE_DIR, job_id, "input")
    os.makedirs(input_dir, exist_ok=True)

    saved = []
    for file in files:
        dest = os.path.join(input_dir, file.filename)
        with open(dest, "wb") as buf:
            shutil.copyfileobj(file.file, buf)
        saved.append(file.filename)

    return {
        "job_id": job_id,
        "status": "RECEIVED",
        "saved_files": saved,
        "message": f"{len(saved)} file(s) uploaded. Send a /task/{job_id} request to begin."
    }


# ─────────────────────────────────────────────
# ENDPOINT 3: Start Task
# ─────────────────────────────────────────────

@app.post("/task/{job_id}")
def start_task(job_id: str, request: TaskRequest, background_tasks: BackgroundTasks):
    """
    Triggers the bounded agent loop in the background.
    Returns immediately so the UI doesn't freeze — frontend polls /job/{job_id} for progress.
    """
    job_dir = os.path.join(WORKSPACE_DIR, job_id)
    if not os.path.exists(job_dir):
        raise HTTPException(
            status_code=404,
            detail="Job ID not found. Please upload files first via /upload."
        )

    memory = AgentMemory()
    jobs_db[job_id] = memory

    payload = {
        "type": request.task_type,
        "prompt": request.prompt,
        "file_path": os.path.join(job_dir, "input")
    }

    # Fire the agent state machine in a background thread
    background_tasks.add_task(execute_agent_loop, payload, memory)

    return {
        "job_id": job_id,
        "status": "PROCESSING",
        "message": "Agent loop started. Poll /job/{job_id} for live trace updates."
    }


# ─────────────────────────────────────────────
# ENDPOINT 4: Poll Job Status
# ─────────────────────────────────────────────

@app.get("/job/{job_id}")
def get_job_status(job_id: str):
    """
    The frontend polls this every 2 seconds to update the TracePanel.
    Returns the full agent trace log and overall status.
    """
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job trace not found.")

    memory = jobs_db[job_id]
    status = "PROCESSING"
    if memory.trace_log:
        last_step = memory.trace_log[-1].get("step", "")
        if last_step in ["COMPLETED", "FAILED"]:
            status = last_step

    return {
        "job_id": job_id,
        "status": status,
        "trace": memory.trace_log
    }


# ─────────────────────────────────────────────
# ENDPOINT 5: Download Final Artifact
# ─────────────────────────────────────────────

@app.get("/artifact/{job_id}")
def get_artifact(job_id: str, task_type: str = "report"):
    """
    Returns the final generated DOCX artifact for download.
    Runs artifact validation BEFORE serving — if validation fails,
    returns the failure reasons instead of the file so the agent can regenerate.
    """
    output_dir = os.path.join(WORKSPACE_DIR, job_id, "output")
    if not os.path.exists(output_dir):
        raise HTTPException(status_code=404, detail="No artifact found for this job yet.")

    files = [f for f in os.listdir(output_dir) if f.endswith(".docx")]
    if not files:
        raise HTTPException(status_code=404, detail="No .docx artifact found in output directory.")

    artifact_path = os.path.join(output_dir, files[0])

    # Run validation gate before handing to human
    validation = validate_artifact(artifact_path, task_type=task_type)
    if not validation["valid"]:
        raise HTTPException(
            status_code=422,
            detail={
                "message": "Artifact failed validation. Regeneration required.",
                "validation": validation
            }
        )

    return FileResponse(path=artifact_path, filename=files[0])


# ─────────────────────────────────────────────
# ENDPOINT 9: Validate Artifact Manually
# ─────────────────────────────────────────────

class ValidateRequest(BaseModel):
    job_id: str
    task_type: str = "report"   # defaults to report if not specified

@app.post("/validate_artifact")
def validate_artifact_endpoint(request: ValidateRequest):
    """
    Manually trigger artifact validation for a job.
    Returns pass/fail for all 3 checks:
        1. Open Check  — can the file be opened?
        2. Sections    — are all required headings present?
        3. Evidence    — are findings cited with sources?
    """
    output_dir = os.path.join(WORKSPACE_DIR, request.job_id, "output")
    if not os.path.exists(output_dir):
        raise HTTPException(status_code=404, detail="No output directory for this job.")

    files = [f for f in os.listdir(output_dir) if f.endswith(".docx")]
    if not files:
        raise HTTPException(status_code=404, detail="No .docx file found to validate.")

    artifact_path = os.path.join(output_dir, files[0])
    return validate_artifact(artifact_path, task_type=request.task_type)


# ─────────────────────────────────────────────
# ENDPOINT 6: Audit Log
# ─────────────────────────────────────────────

@app.get("/audit/{job_id}")
def get_audit_log(job_id: str):
    """
    Returns the full audit trail for a job (used by the Audit tab in the UI).
    Populated by the sovereignty monitor and tool permission gate (Day 5).
    """
    audit_file = os.path.join(WORKSPACE_DIR, job_id, "audit.json")
    if not os.path.exists(audit_file):
        return {"job_id": job_id, "audit_events": []}

    import json
    with open(audit_file, "r") as f:
        events = json.load(f)
    return {"job_id": job_id, "audit_events": events}


# ─────────────────────────────────────────────
# ENDPOINTS 10-13: Sovereignty Monitor (Day 5)
# These are the LIVE PROOF endpoints shown to judges
# ─────────────────────────────────────────────

@app.get("/sovereignty/status")
def sovereignty_status():
    """
    JUDGE ENDPOINT: Returns live network status.
    Shows bytes sent, active connections, external connections, and air-gap verdict.
    Polled every 3s by the frontend SovereigntyPanel for the live badge.
    """
    return get_sovereignty_status()


@app.post("/sovereignty/snapshot/start")
def sovereignty_snapshot_start():
    """
    JUDGE ENDPOINT: Records network baseline BEFORE a task starts.
    Call this first, then run the AI task, then call /snapshot/end to get the delta proof.
    """
    return start_snapshot()


@app.post("/sovereignty/snapshot/end")
def sovereignty_snapshot_end():
    """
    JUDGE ENDPOINT: Records network counters AFTER a task and returns the delta.
    bytes_sent_delta ≈ 0 → proves nothing left the machine during the task.
    """
    return end_snapshot()


@app.get("/sovereignty/processes")
def sovereignty_processes():
    """
    JUDGE ENDPOINT: Shows which processes have active network connections.
    Judges can verify only uvicorn + browser are active — nothing is phoning home.
    """
    return get_process_network_usage()


# ─────────────────────────────────────────────
# ENDPOINT 15: List Jobs
# ─────────────────────────────────────────────

@app.get("/jobs")
def list_all_jobs():
    """Returns a list of all active or completed jobs."""
    results = []
    for jid, memory in jobs_db.items():
        results.append({
            "job_id": jid,
            "status": getattr(memory, "status", "unknown"),
            "current_step": getattr(memory, "current_step", "init"),
            "tool_calls_count": len(getattr(memory, "tool_calls", [])),
            "trace_count": len(getattr(memory, "trace_log", [])),
        })
    return {"jobs": results}


# ─────────────────────────────────────────────
# ENDPOINT 16 & 17: CSV Evidence RAG
# ─────────────────────────────────────────────

DEFAULT_CSV_PATH = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "demo_data", "maintenance_history.csv")
)

@app.get("/csv_schema")
def get_csv_schema_endpoint(file_path: Optional[str] = None):
    target_path = file_path or DEFAULT_CSV_PATH
    res = get_csv_schema(target_path)
    if res.get("success"):
        cols = list(res.get("columns", {}).keys()) if isinstance(res.get("columns"), dict) else res.get("columns", [])
        import pandas as pd
        try:
            df = pd.read_csv(target_path)
            total_rows = len(df)
        except Exception:
            total_rows = 0
        return {
            "success": True,
            "file": os.path.basename(target_path),
            "columns": cols,
            "column_types": res.get("columns"),
            "total_rows": total_rows,
            "sample_row": res.get("sample_row", [])
        }
    return res


@app.post("/query_csv")
def query_csv_endpoint(req: CsvQueryRequest):
    target_path = req.file_path or DEFAULT_CSV_PATH
    return query_csv(
        file_path=target_path,
        filters=req.filters,
        columns=req.columns,
        max_rows=req.max_rows
    )


# ─────────────────────────────────────────────
# ENDPOINT 18: Router Simulation Test
# ─────────────────────────────────────────────

@app.post("/route")
def route_task_endpoint(req: RouteRequest):
    return route_task(req.task_type, req.file_type)

