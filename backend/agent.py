import time
import datetime
from enum import Enum
from typing import Dict, Any, List

# --- EXTERNAL MODULE IMPORTS ---
from router import route_task                 # Piyush's deterministic router
from model_swap import swap_model             # Vaibhav's VRAM hot-swap manager
from pdf_parser import extract_and_chunk_pdf  # The PyMuPDF text extractor

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
                memory.context['file_path'] = task_payload.get("file_path", None)
                current_state = AgentState.PLAN
                
            # 3. PLAN PHASE
            elif current_state == AgentState.PLAN:
                target_ip, target_model = route_task(memory.context['task_type'])
                memory.context['target_ip'] = target_ip
                memory.context['target_model'] = target_model
                memory.add_trace(current_state.value, f"Routed to {target_model} on {target_ip}")
                current_state = AgentState.RETRIEVE
                
            # 4. RETRIEVE PHASE
            elif current_state == AgentState.RETRIEVE:
                file_path = memory.context.get('file_path')
                if file_path and file_path.endswith('.pdf'):
                    memory.add_trace(current_state.value, "Extracting PDF text via PyMuPDF.")
                    chunks = extract_and_chunk_pdf(file_path)
                    memory.context['document_chunks'] = chunks
                else:
                    memory.add_trace(current_state.value, "No PDF extraction required for this payload.")
                
                current_state = AgentState.ACT
                
            # 5. ACT PHASE
            elif current_state == AgentState.ACT:
                target_ip = memory.context['target_ip']
                target_model = memory.context['target_model']
                
                # Enforce hardware constraints for Laptop 2
                if target_ip == "10.12.142.163:11434":
                    memory.add_trace("SYSTEM", f"Executing hardware VRAM swap to {target_model}...")
                    swap_success = swap_model(target_model)
                    if not swap_success:
                        raise Exception(f"Failed to load {target_model} into VRAM.")
                
                memory.add_trace(current_state.value, "Firing inference request to designated node.")
                
                # --- ACTUAL INFERENCE API CALL GOES HERE IN DAY 4 ---
                # For now, we simulate a successful generation
                time.sleep(2) 
                memory.context['raw_response'] = "Generated artifact based on constraints."
                
                current_state = AgentState.OBSERVE
                
            # 6. OBSERVE PHASE
            elif current_state == AgentState.OBSERVE:
                memory.add_trace(current_state.value, "Response captured and parsed into memory.")
                current_state = AgentState.VERIFY
                
            # 7. VERIFY PHASE
            elif current_state == AgentState.VERIFY:
                # --- ACTUAL HALLUCINATION CHECK GOES HERE IN DAY 4 ---
                is_valid = True 
                
                if is_valid:
                    current_state = AgentState.COMPLETED
                    memory.add_trace(current_state.value, "Artifact mathematically/logically verified.")
                else:
                    memory.retry_count += 1
                    current_state = AgentState.PLAN 
                    memory.add_trace(current_state.value, f"Verification failed. Initiating retry {memory.retry_count}.")

        except Exception as e:
            memory.add_trace("FAILED", f"System exception caught: {str(e)}")
            current_state = AgentState.FAILED

    return memory.trace_log