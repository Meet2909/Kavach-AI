import urllib.request
import json
import time

OLLAMA_URL = "http://127.0.0.1:11434"

def get_loaded_models():
    """Returns a list of currently loaded models in VRAM."""
    try:
        req = urllib.request.Request(f"{OLLAMA_URL}/api/ps")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                data = json.loads(response.read().decode('utf-8'))
                return [model.get('name') for model in data.get('models', [])]
    except Exception as e:
        print(f"Error checking loaded models: {e}")
    return []

def unload_model(model_name: str):
    """Forcefully unloads a specific model from VRAM to free up the 6GB capacity."""
    print(f"Unloading model: {model_name}...")
    data = json.dumps({
        "model": model_name,
        "keep_alive": 0
    }).encode('utf-8')
    
    req = urllib.request.Request(f"{OLLAMA_URL}/api/generate", data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                print(f"✅ Successfully unloaded {model_name}.")
                return True
    except Exception as e:
        print(f"❌ Failed to unload {model_name}: {e}")
    return False

def load_model(model_name: str):
    """Pre-loads a model into VRAM."""
    print(f"Loading model: {model_name} into VRAM...")
    data = json.dumps({
        "model": model_name,
        "keep_alive": -1 # Keep alive indefinitely until manually unloaded
    }).encode('utf-8')
    
    req = urllib.request.Request(f"{OLLAMA_URL}/api/generate", data=data, method='POST')
    req.add_header('Content-Type', 'application/json')
    try:
        # Loading a model can take a few seconds
        with urllib.request.urlopen(req, timeout=60) as response:
            if response.status == 200:
                print(f"✅ Successfully loaded {model_name}.")
                return True
    except Exception as e:
        print(f"❌ Failed to load {model_name}: {e}")
    return False

def swap_model(target_model: str):
    """Ensures the target_model is the only one loaded in VRAM."""
    print(f"--- Initiating Hot-Swap to {target_model} ---")
    
    # Required by UI/Orchestrator to show user what's happening
    if "vl" in target_model.lower() or "vision" in target_model.lower():
        print("STATE: 'Switching to vision model...'")
    elif "coder" in target_model.lower():
        print("STATE: 'Switching to coder model...'")

    loaded_models = get_loaded_models()
    
    if target_model in loaded_models and len(loaded_models) == 1:
        print(f"✅ {target_model} is already the only model loaded. No swap needed.")
        return True

    # Unload any model that isn't the target model
    for current_model in loaded_models:
        if current_model != target_model:
            unload_model(current_model)
            # Give VRAM a second to clear
            time.sleep(1)

    # Load the target model if it wasn't already loaded
    if target_model not in loaded_models:
        success = load_model(target_model)
        if not success:
            return False
            
    print(f"--- Hot-Swap to {target_model} Complete ---")
    return True

if __name__ == "__main__":
    # Test the hot swap by switching to the coder model
    swap_model("qwen2.5-coder:7b")
