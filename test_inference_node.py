import json
import urllib.request
import sys
import os

# Read the registry to get the actual IPs you have set
REGISTRY_PATH = os.path.join(os.path.dirname(__file__), "backend", "model_registry.json")

try:
    with open(REGISTRY_PATH, "r") as f:
        registry = json.load(f)
except Exception as e:
    print(f"❌ Failed to read model_registry.json: {e}")
    sys.exit(1)

def test_ollama_node(role_name, node_info):
    host_url = node_info.get("host", "").rstrip("/")
    model_name = node_info.get("model_id")
    
    print(f"\n==========================================")
    print(f"🔍 TESTING NODE: {role_name.upper()} ({model_name})")
    print(f"🌐 URL: {host_url}")
    print(f"==========================================")
    
    # 1. Ping the Ollama service (Is it alive?)
    try:
        req = urllib.request.Request(f"{host_url}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.status == 200:
                print("✅ 1. Network Connection: SUCCESS (Node is reachable)")
            else:
                print(f"❌ 1. Network Connection: FAILED (Status {response.status})")
                return
    except Exception as e:
        print(f"❌ 1. Network Connection: FAILED (Cannot reach laptop)")
        print(f"   Reason: {e}")
        print("   -> Is the laptop on the same Wi-Fi?")
        print("   -> Is OLLAMA_HOST=0.0.0.0 set on that laptop?")
        print("   -> Is port 11434 allowed in Windows Firewall?")
        return

    # 2. Test actual generation (Is the model loaded and responding?)
    print("⏳ 2. Testing AI Generation (Asking 'What is 2+2?')...")
    payload = json.dumps({
        "model": model_name,
        "prompt": "What is 2+2? Reply with just the number.",
        "stream": False
    }).encode("utf-8")
    
    try:
        req = urllib.request.Request(
            f"{host_url}/api/generate", 
            data=payload, 
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode())
            reply = result.get("response", "").strip()
            print(f"✅ 2. Generation: SUCCESS!")
            print(f"   🤖 Model Reply: '{reply}'")
    except Exception as e:
        print(f"❌ 2. Generation: FAILED")
        print(f"   Reason: {e}")
        print("   -> Model might not be pulled, or GPU ran out of memory (OOM).")

if __name__ == "__main__":
    print("🚀 STARTING BACKEND ISOLATION TEST 🚀")
    for role, info in registry.items():
        test_ollama_node(role, info)
    print("\n🏁 TEST COMPLETE 🏁")
