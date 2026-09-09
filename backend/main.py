import os
import uuid
import shutil
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="KAVACH-AI Orchestrator API")

# Allow frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base directory for job workspaces
WORKSPACE_DIR = os.path.join(os.getcwd(), "workspace", "jobs")

class TaskRequest(BaseModel):
    job_id: str
    task_description: str

@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)):
    """
    Creates a new job ID and saves uploaded files into the job's input directory.
    """
    job_id = str(uuid.uuid4())
    job_dir = os.path.join(WORKSPACE_DIR, job_id)
    input_dir = os.path.join(job_dir, "input")
    os.makedirs(input_dir, exist_ok=True)
    
    saved_files = []
    for file in files:
        file_path = os.path.join(input_dir, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved_files.append(file.filename)
        
    return {
        "job_id": job_id, 
        "saved_files": saved_files, 
        "message": "Files uploaded successfully"
    }

@app.post("/task")
async def start_task(request: TaskRequest, background_tasks: BackgroundTasks):
    """
    Accepts a task description for a given job_id and kicks off the agent workflow.
    """
    job_dir = os.path.join(WORKSPACE_DIR, request.job_id)
    if not os.path.exists(job_dir):
        raise HTTPException(status_code=404, detail="Job ID not found. Upload files first.")
        
    # TODO (Day 2): Kick off the actual agent state machine here
    # background_tasks.add_task(run_agent_workflow, request.job_id, request.task_description)
    
    return {"job_id": request.job_id, "status": "RECEIVED", "message": "Task queued"}

@app.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """Returns the current state of the job."""
    job_dir = os.path.join(WORKSPACE_DIR, job_id)
    if not os.path.exists(job_dir):
        raise HTTPException(status_code=404, detail="Job ID not found")
        
    # TODO (Day 1/2): Read real status from state tracking mechanism
    return {"job_id": job_id, "status": "PROCESSING"}

@app.get("/artifact/{job_id}")
async def get_artifact(job_id: str):
    """Returns the final generated artifact (e.g. DOCX) for the job."""
    # TODO (Day 4): Implement file return using FastAPI's FileResponse
    return {"message": f"Artifact for {job_id} would be downloaded here"}

@app.get("/audit/{job_id}")
async def get_audit_log(job_id: str):
    """Returns the audit log for a specific job."""
    audit_file = os.path.join(WORKSPACE_DIR, job_id, "audit.json")
    if not os.path.exists(audit_file):
        return {"audit_events": []}
        
    # TODO (Day 5): Read and return actual audit.json
    return {"message": f"Audit log for {job_id} would be returned here"}
