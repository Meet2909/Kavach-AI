from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uuid
import os

# Import your newly built state machine
from agent import execute_agent_loop, AgentMemory

app = FastAPI(title="KAVACH-AI API Gateway", description="Enterprise Task Router for MRPL")

# 1. CORS Middleware - CRITICAL for Frontend Connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory database to store active jobs and their traces
jobs_db = {}

# Ensure the upload directory exists
os.makedirs("workspace/jobs", exist_ok=True)

class TaskRequest(BaseModel):
    task_type: str
    prompt: str

@app.get("/health")
def health_check():
    """Simple ping for the React frontend to verify the backend is online."""
    return {"status": "API is live", "version": "1.0"}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Receives a document from the UI and initializes a job."""
    job_id = str(uuid.uuid4())[:8]
    
    # Create an isolated folder for this specific job
    job_dir = f"workspace/jobs/{job_id}/input"
    os.makedirs(job_dir, exist_ok=True)
    
    file_path = f"{job_dir}/{file.filename}"
    
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())
        
    return {"job_id": job_id, "status": "RECEIVED", "file_path": file_path}

@app.post("/task/{job_id}")
def start_task(job_id: str, request: TaskRequest, background_tasks: BackgroundTasks):
    """Triggers the agent loop in the background so the UI doesn't freeze."""
    if not os.path.exists(f"workspace/jobs/{job_id}"):
        raise HTTPException(status_code=404, detail="Job ID not found. Upload a file first.")
        
    # Initialize the memory and trace log for this specific job
    memory = AgentMemory()
    jobs_db[job_id] = memory
    
    # Construct the payload for the agent
    payload = {
        "type": request.task_type,
        "prompt": request.prompt,
        "file_path": f"workspace/jobs/{job_id}/input" # The agent will find the file here
    }
    
    # Fire the state machine in the background
    background_tasks.add_task(execute_agent_loop, payload, memory)
    
    return {"job_id": job_id, "status": "PROCESSING", "message": "Agent execution started."}

@app.get("/job/{job_id}")
def get_job_status(job_id: str):
    """The frontend polls this endpoint every 2 seconds to update the Trace Panel."""
    if job_id not in jobs_db:
        raise HTTPException(status_code=404, detail="Job trace not found.")
        
    memory = jobs_db[job_id]
    
    # Determine overall status based on the trace log
    status = "PROCESSING"
    if memory.trace_log:
        last_step = memory.trace_log[-1].get("step")
        if last_step in ["COMPLETED", "FAILED"]:
            status = last_step
            
    return {
        "job_id": job_id,
        "status": status,
        "trace": memory.trace_log
    }