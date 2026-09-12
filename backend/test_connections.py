import json
import os
import urllib.request
import time

REGISTRY_PATH = os.path.join(os.path.dirname(__file__), 'model_registry.json')

def check_host_reachable(host):
    """Pehle check karo kya host reachable hai aur Ollama respond kar raha hai"""
    try:
        req = urllib.request.Request(f"{host}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            available_models = [m.get('name') for m in data.get('models', [])]
            return True, available_models
    except Exception as e:
        return False, str(e)

def test_model(name, info):
    print(f"\n==========================================")
    print(f"Testing [{name.upper()}] Node: {info['host']}")
    print(f"Target Model: {info['model_id']}")
    print(f"==========================================")
    
    # 1. Reachability Check
    reachable, result = check_host_reachable(info['host'])
    if not reachable:
        print(f"[FAILED] NODE UNREACHABLE: Cannot connect to {info['host']}")
        print(f"   Reason: {result}")
        print("   -> Check:")
        print("      1. IP address sahi hai na?")
        print("      2. Us laptop pe Ollama chal raha hai?")
        print("      3. Us laptop pe OLLAMA_HOST='0.0.0.0:11434' set hai?")
        print("      4. Firewall port 11434 allow hai?")
        return
        
    print(f"[OK] Node Reachable! Models installed on this node: {result}")
    
    # Check if requested model exists
    model_id = info['model_id']
    matching = [m for m in result if model_id in m or m.startswith(model_id)]
    actual_model = matching[0] if matching else model_id
    
    # 2. Generation Check
    print(f"[*] Sending test prompt to '{actual_model}' (VRAM load may take ~30-40s)...")
    payload = json.dumps({
        "model": actual_model,
        "prompt": "Say hello in 3 words.",
        "stream": False
    }).encode('utf-8')
    
    start_time = time.time()
    try:
        req = urllib.request.Request(
            f"{info['host']}/api/generate", 
            data=payload, 
            method="POST", 
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=120) as response:
            data = json.loads(response.read().decode())
            latency = time.time() - start_time
            print(f"[SUCCESS] Response: {data.get('response', '').strip()}")
            print(f"[LATENCY] {latency:.2f} seconds")
    except Exception as e:
        print(f"[ERROR] Model generation error: {str(e)}")

def main():
    if not os.path.exists(REGISTRY_PATH):
        print("model_registry.json not found!")
        return
        
    with open(REGISTRY_PATH, 'r') as f:
        registry = json.load(f)
        
    for model_name, info in registry.items():
        test_model(model_name, info)

if __name__ == "__main__":
    main()
