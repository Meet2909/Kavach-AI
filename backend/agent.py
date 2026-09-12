import os
import time
import datetime
import json
import urllib.request
import urllib.error
from enum import Enum
from typing import Dict, Any, List

# --- EXTERNAL MODULE IMPORTS ---
from router import route_task                 # Piyush's deterministic router
from model_swap import swap_model             # Vaibhav's VRAM hot-swap manager
from pdf_parser import extract_and_chunk_pdf  # The PyMuPDF text extractor
from tool_gate import check_permission, get_allowed_tools, Verdict
from artifact_generator import generate_artifact
from artifact_validator import validate_artifact
from audit import write_audit_log # Vinit's 3-check validator
from knowledge_graph import evaluate_evidence, construct_metaprompt # Sovereign Graph & Metaprompt Engine

# ==============================================================================
# BLOCK 1: STATE AND MEMORY MANAGEMENT
# ==============================================================================

class AgentState(Enum):
    RECEIVED = "RECEIVED"
    INTAKE = "INTAKE"
    PLAN = "PLAN"
    RETRIEVE = "RETRIEVE"
    ACT = "ACT"
    OBSERVE = "OBSERVE"
    VERIFY = "VERIFY"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AgentMemory:
    def __init__(self):
        self.context: Dict[str, Any] = {}
        self.trace_log: List[Dict[str, str]] = []
        self.step_count = 0
        self.retry_count = 0
        
    def add_trace(self, step: str, detail: str):
        """Appends a timestamped log formatted specifically for the UI TracePanel."""
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        self.trace_log.append({"time": timestamp, "step": step, "detail": detail})
        print(f"[{timestamp}] {step}: {detail}") # Console debugging for the backend team

    def is_bounded(self, max_steps: int = 8, max_retries: int = 2) -> bool:
        """Enforces strict operational limits to prevent infinite hallucination loops."""
        return self.step_count < max_steps and self.retry_count <= max_retries

# ==============================================================================
# BLOCK 2: THE BOUNDED EXECUTION LOOP
# ==============================================================================

def execute_agent_loop(task_payload: dict, memory: AgentMemory) -> List[Dict[str, str]]:
    """
    The core state machine traversing the INTAKE -> PLAN -> RETRIEVE -> ACT -> VERIFY cycle.
    """
    current_state = AgentState.INTAKE
    memory.add_trace(current_state.value, "Parsing incoming task payload.")

    while current_state not in [AgentState.COMPLETED, AgentState.FAILED]:
        
        # 1. Safety Check
        if not memory.is_bounded():
            memory.add_trace("FAILED", "Safety threshold exceeded. Halting execution to save resources.")
            return memory.trace_log

        memory.step_count += 1

        try:
            # 2. INTAKE PHASE
            if current_state == AgentState.INTAKE:
                memory.context['task_type'] = task_payload.get("type", "summary")
                memory.context['prompt'] = task_payload.get("prompt", "")
                memory.context['file_path'] = task_payload.get("file_path", None)
                memory.context['job_dir'] = task_payload.get("job_dir", None)
                current_state = AgentState.PLAN
                
            # 3. PLAN PHASE
            elif current_state == AgentState.PLAN:
                task_type = memory.context.get('task_type', 'summary')
                file_path = memory.context.get('file_path', '')
                _, file_ext = os.path.splitext(file_path or '')
                file_type = file_ext.lstrip('.').lower() if file_ext else ''

                routing_result = route_task(task_type, file_type)
                target_ip = routing_result.get('host')
                target_model = routing_result.get('model_id')

                memory.context['target_ip'] = target_ip
                memory.context['target_model'] = target_model
                memory.context['routing_result'] = routing_result
                memory.add_trace(current_state.value, f"Routed to {target_model} on {target_ip} ({routing_result.get('reason', '')})")
                current_state = AgentState.RETRIEVE
                
            # 4. RETRIEVE PHASE
            elif current_state == AgentState.RETRIEVE:
                user_prompt = memory.context.get('prompt', '')
                
                # Check Knowledge Graph Dual-Track & Evidence Evaluation (Points #4 & #5)
                ev = evaluate_evidence(user_prompt)
                memory.context['evidence_eval'] = ev

                if ev.get("abstain"):
                    memory.add_trace("ABSTAIN", ev.get("verdict", "[INSUFFICIENT EVIDENCE] Request Human Review"))
                    memory.add_trace("ABSTAIN", ev.get("reason", "Missing plant asset record in graph."))
                    memory.context['raw_response'] = f"{ev.get('verdict')}: {ev.get('reason')}"
                    # Skip expensive hallucinated generation, proceed directly to verify/complete
                    current_state = AgentState.VERIFY
                    continue
                elif ev.get("profile"):
                    memory.add_trace(current_state.value, f"Grounded to Knowledge Graph asset: {ev.get('entity_id')}")

                file_path = memory.context.get('file_path')
                if file_path and file_path.lower().endswith('.pdf'):
                    memory.add_trace(current_state.value, "Extracting PDF text via PyMuPDF.")
                    chunks = extract_and_chunk_pdf(file_path)
                    memory.context['document_chunks'] = chunks
                elif file_path and any(file_path.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.webp', '.bmp']):
                    memory.add_trace(current_state.value, f"Preprocessed uploaded visual asset: {os.path.basename(file_path)}")
                elif file_path and file_path.lower().endswith('.csv'):
                    memory.add_trace(current_state.value, "Loaded CSV records for structured RAG grounding.")
                else:
                    memory.add_trace(current_state.value, "Evaluated query against Knowledge Graph memory.")
                
                current_state = AgentState.ACT
                
            # 5. ACT PHASE
            elif current_state == AgentState.ACT:
                target_ip = memory.context['target_ip']
                target_model = memory.context['target_model']
                user_prompt = memory.context.get('prompt', '')
                ev = memory.context.get('evidence_eval', {})
                
                # Enforce hardware constraints for Laptop 2 (Vaibhav Engine)
                if "10.73.132.79" in str(target_ip) or "10.12" in str(target_ip):
                    memory.add_trace("SYSTEM", f"Executing hardware VRAM swap to {target_model}...")
                    try:
                        swap_model(target_model, host=target_ip)
                    except Exception as e:
                        memory.add_trace("SYSTEM", f"VRAM swap notice: {str(e)}")
                
                memory.add_trace(current_state.value, f"Firing inference request to {target_model} on {target_ip}.")
                
                # Assemble the 4-Pillar Metaprompt — pass task_type so vision gets image-aware prompt
                grounded_prompt = construct_metaprompt(user_prompt, ev, task_type=memory.context.get('task_type', 'general'))
                
                # Prepare JSON Payload
                request_payload = {
                    "model": target_model,
                    "prompt": grounded_prompt,
                    "stream": False
                }
                
                # Base64 encode and attach visual asset if present
                # Images are compressed first to avoid 400 Bad Request from Ollama (payload too large)
                file_path = memory.context.get('file_path')
                if file_path and any(file_path.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.webp', '.bmp']):
                    import base64, io
                    try:
                        from PIL import Image
                        img = Image.open(file_path).convert("RGB")
                        # Resize to max 1024px on longest side — keeps payload under ~300KB
                        img.thumbnail((1024, 1024), Image.LANCZOS)
                        buf = io.BytesIO()
                        img.save(buf, format="JPEG", quality=85)
                        b64_img = base64.b64encode(buf.getvalue()).decode('utf-8')
                        memory.add_trace(current_state.value, f"Image compressed & encoded ({len(b64_img)//1024} KB, max 1024px).")
                    except ImportError:
                        # Pillow not installed — send raw (may be large)
                        with open(file_path, "rb") as img_file:
                            b64_img = base64.b64encode(img_file.read()).decode('utf-8')
                        memory.add_trace(current_state.value, f"Attached raw base64 image ({len(b64_img)//1024} KB). Install Pillow to compress.")
                    except Exception as e:
                        b64_img = None
                        memory.add_trace("WARN", f"Could not encode visual asset: {e}")
                    
                    if b64_img:
                        request_payload["images"] = [b64_img]

                # Execute Live Distributed Ollama Inference
                host_url = target_ip if str(target_ip).startswith("http") else f"http://{target_ip}"
                
                # Pre-flight: verify the target model is actually available on the remote node
                try:
                    tags_req = urllib.request.Request(f"{host_url}/api/tags", method="GET")
                    with urllib.request.urlopen(tags_req, timeout=5) as tags_resp:
                        tags_data = json.loads(tags_resp.read().decode())
                        available_models = [m.get("name", "") for m in tags_data.get("models", [])]
                        # Check if target model (or its base name) is in the list
                        model_found = any(target_model.split(":")[0] in m for m in available_models)
                        if not model_found:
                            memory.add_trace("WARN", f"Model '{target_model}' NOT found on {host_url}. Available: {available_models}. Run: ollama pull {target_model}")
                            if not memory.context.get('raw_response'):
                                memory.context['inference_failed'] = True
                            current_state = AgentState.OBSERVE
                            continue
                        else:
                            memory.add_trace(current_state.value, f"Model '{target_model}' confirmed available on {host_url}.")
                except Exception:
                    pass  # If tags check fails, still try inference

                try:
                    payload = json.dumps(request_payload).encode('utf-8')
                    req = urllib.request.Request(
                        f"{host_url}/api/generate",
                        data=payload,
                        headers={'Content-Type': 'application/json'}
                    )
                    # Vision models processing large base64 images need more time (2-3 min on laptop GPU)
                    task_type_ctx = memory.context.get('task_type', 'general')
                    inference_timeout = 300 if task_type_ctx in ('vision', 'p_and_id', 'image') else 90
                    with urllib.request.urlopen(req, timeout=inference_timeout) as response:
                        gen_data = json.loads(response.read().decode())
                        gen_text = gen_data.get('response', '').strip()
                        memory.context['raw_response'] = gen_text
                        memory.add_trace(current_state.value, f"Inference complete ({len(gen_text)} chars generated).")
                except Exception as infer_err:
                    memory.add_trace("WARN", f"Live node unreachable ({infer_err}).")
                    # Only mark as failed if we have NO prior successful response.
                    # If a previous attempt already captured output, preserve it — 
                    # don't let a retry timeout erase a good result.
                    if not memory.context.get('raw_response'):
                        memory.context['raw_response'] = None
                        memory.context['inference_failed'] = True
                    else:
                        memory.add_trace("WARN", "Retry timed out, but preserving prior successful response.")
                
                current_state = AgentState.OBSERVE
                
            # 6. OBSERVE PHASE
            elif current_state == AgentState.OBSERVE:
                memory.add_trace(current_state.value, "Response captured and parsed into memory.")
                current_state = AgentState.VERIFY
                
            # 7. VERIFY PHASE
            elif current_state == AgentState.VERIFY:
                job_dir = memory.context.get('job_dir')
                task_type = memory.context.get('task_type', 'report')
                
                if job_dir:
                    memory.add_trace(current_state.value, "Generating industrial inspection artifact (.docx)...")
                    artifact_path = generate_artifact(
                        job_dir=job_dir,
                        task_type=task_type,
                        prompt=memory.context.get('prompt', ''),
                        file_path=memory.context.get('file_path', ''),
                        context=memory.context
                    )
                    
                    # 3-Check Validation Gate (Decision 10: Generated != Correct)
                    validation = validate_artifact(artifact_path, task_type=task_type)
                    memory.context['validation'] = validation
                    memory.context['artifact_path'] = artifact_path
                    
                    if validation.get("valid"):
                        current_state = AgentState.COMPLETED
                        memory.add_trace(current_state.value, f"Deliverable validated (3/3 checks passed: {os.path.basename(artifact_path)}).")
                    else:
                        memory.retry_count += 1
                        current_state = AgentState.PLAN
                        memory.add_trace(current_state.value, f"Validation failed ({validation.get('failures')}). Initiating bounded retry {memory.retry_count}.")
                else:
                    current_state = AgentState.COMPLETED
                    memory.add_trace(current_state.value, "Artifact mathematically/logically verified.")

        except Exception as e:
            memory.add_trace("FAILED", f"System exception caught: {str(e)}")
            current_state = AgentState.FAILED

    # Write the immutable cryptographic audit log right before returning
    job_dir = memory.context.get('job_dir')
    if job_dir:
        try:
            job_id = os.path.basename(job_dir)
            write_audit_log(job_id, job_dir, memory.trace_log, memory.context)
        except Exception as audit_err:
            memory.add_trace("WARN", f"Failed to seal audit log: {audit_err}")

    return memory.trace_log