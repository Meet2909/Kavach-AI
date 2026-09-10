import json
import os
import urllib.request
import time

REGISTRY_PATH = os.path.join(os.path.dirname(__file__), 'model_registry.json')

def test_model(name, info):
    print(f"\n--- Testing {name.upper()} Model ---")
    print(f"Target: {info['host']} | Model: {info['model_id']}")
    
    payload = json.dumps({
        "model": info["model_id"],
        "prompt": "Reply with 'Connection Successful!' if you receive this.",
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
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode())
            latency = time.time() - start_time
            print(f"SUCCESS! Response: {data.get('response', '').strip()}")
            print(f"Latency: {latency:.2f} seconds")
    except Exception as e:
        print(f"FAILED! Error: {str(e)}")
        print("Tip: Check if the IP is correct, Ollama is running, and firewall allows port 11434.")

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
