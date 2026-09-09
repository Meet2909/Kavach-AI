import json
import os

# Load model registry
REGISTRY_PATH = os.path.join(os.path.dirname(__file__), 'model_registry.json')

def load_registry():
    with open(REGISTRY_PATH, 'r') as f:
        return json.load(f)

def route_task(task_type: str, file_type: str):
    """
    Rule-based router.
    Returns:
      {
        "selected_model": <model_key>,
        "reason": <string explaining why>,
        "rejected_models": <list of rejected models>,
        "confidence": <float>
      }
    """
    registry = load_registry()
    models = list(registry.keys())
    
    task_type = task_type.lower()
    file_type = file_type.lower()
    
    if file_type in ['png', 'jpg', 'jpeg'] or task_type in ['p&id', 'vision', 'ocr', 'scanned_pdf']:
        selected = 'vision'
        reason = "Task involves image processing or scanned documents."
        confidence = 0.95
    elif file_type == 'csv' or 'calculation' in task_type or 'code' in task_type:
        selected = 'coder'
        reason = "Task involves structured data analysis or calculation."
        confidence = 0.90
    else:
        selected = 'general'
        reason = "Task is general text reasoning or summarization."
        confidence = 0.85

    rejected = [m for m in models if m != selected]
    
    return {
        "selected_model": selected,
        "reason": reason,
        "rejected_models": rejected,
        "confidence": confidence,
        "host": registry[selected]["host"],
        "model_id": registry[selected]["model_id"]
    }

if __name__ == "__main__":
    # Test cases
    print("Testing Router Logic:")
    print(json.dumps(route_task("summary", "pdf"), indent=2))
    print(json.dumps(route_task("calculation", "csv"), indent=2))
    print(json.dumps(route_task("p&id", "png"), indent=2))
