import os
import uuid
import shutil
from datetime import datetime
from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import List

# Import the state machine that Meet built
from agent import execute_agent_loop, AgentMemory

app = FastAPI(
    title="KAVACH-AI API Gateway",
    description="Sovereign AI Orchestrator — No external calls made."
)

# CORS Middleware — allows Vite frontend (port 5173) to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
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


# ─────────────────────────────────────────────
# ENDPOINT 1: Health Check
# ─────────────────────────────────────────────

@app.get("/health")
def health_check():
    """Ping from the React frontend to verify the backend is online."""
    return {
        "status": "API is live",
        "version": "1.0",
        "timestamp": datetime.now().isoformat()
    }


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
def get_artifact(job_id: str):
    """
    Returns the final generated DOCX/XLSX artifact for download.
    Artifact validation (Day 4) will run before this is served.
    """
    output_dir = os.path.join(WORKSPACE_DIR, job_id, "output")
    if not os.path.exists(output_dir):
        raise HTTPException(status_code=404, detail="No artifact found for this job yet.")

    # Find the first file in the output directory
    files = os.listdir(output_dir)
    if not files:
        raise HTTPException(status_code=404, detail="Output directory is empty.")

    artifact_path = os.path.join(output_dir, files[0])
    return FileResponse(path=artifact_path, filename=files[0])


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
