import urllib.request
import json
import time
import os

OLLAMA_HOST = "http://127.0.0.1:11434"
MODEL = "llama3.1" # Change to "llama3.1:8b" if that is the exact tag

def run_task(task_name, system_prompt, prompt_text):
    print(f"--- Running Task: {task_name} ---")
    payload = {
        "model": MODEL,
        "system": system_prompt,
        "prompt": prompt_text,
        "stream": False
    }
    
    start_time = time.time()
    try:
        req = urllib.request.Request(
            f"{OLLAMA_HOST}/api/generate",
            data=json.dumps(payload).encode('utf-8'),
            headers={'Content-Type': 'application/json'},
            method="POST"
        )
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            latency = time.time() - start_time
            print(f"Latency: {latency:.4f} seconds")
            print(f"Response:\n{result.get('response', '')}\n")
            return result
    except Exception as e:
        print(f"Error connecting to Ollama: {e}\n")
        return None

if __name__ == "__main__":
    import sys
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from prompts.general_model import SYSTEM_PROMPT, get_prompt_template
    
    # 1. Digital PDF summary
    run_task(
        "Digital PDF Summary",
        SYSTEM_PROMPT,
        "Evidence: The pump model P-102 requires maintenance every 6 months. It has a max flow rate of 500 GPM.\n\nUser Query: Summarize the maintenance requirements and specs for pump P-102."
    )
    
    # 2. Approval-note drafting
    run_task(
        "Approval-note drafting",
        SYSTEM_PROMPT,
        "Evidence: Inspection report for valve V-301 indicates severe corrosion. SOP requires immediate replacement for severe corrosion.\n\nUser Query: Draft a maintenance approval note for valve V-301 based on the inspection report and SOP."
    )
    
    # 3. General Q&A (Testing abstention)
    run_task(
        "General Q&A (Testing Abstention)",
        SYSTEM_PROMPT,
        "Evidence: Compressor C-200 is operating normally.\n\nUser Query: What is the operating pressure of compressor C-200?"
    )
