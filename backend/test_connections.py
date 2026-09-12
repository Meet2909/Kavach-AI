import json
import os
import urllib.request
import time

REGISTRY_PATH = os.path.join(os.path.dirname(__file__), 'model_registry.json')

# ── Backend-aware health check ─────────────────────────────────────────────────

def check_ollama_node(host):
    """Check an Ollama node via /api/tags"""
    try:
        req = urllib.request.Request(f"{host}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            available_models = [m.get('name') for m in data.get('models', [])]
            return True, available_models
    except Exception as e:
        return False, str(e)

def check_fastapi_node(host):
    """Check a FastAPI node via the root / or /docs endpoint (always returns 200)"""
    for path in ["/docs", "/"]:
        try:
            req = urllib.request.Request(f"{host}{path}", method="GET")
            with urllib.request.urlopen(req, timeout=5) as response:
                if response.status == 200:
                    return True, ["fastapi-server-online"]
        except Exception as e:
            last_err = str(e)
    return False, last_err

# ── Per-node test logic ────────────────────────────────────────────────────────

def test_ollama_model(name, info):
    reachable, result = check_ollama_node(info['host'])
    if not reachable:
        print(f"[FAILED] NODE UNREACHABLE: Cannot connect to {info['host']}")
        print(f"   Reason: {result}")
        print("   -> Check:")
        print("      1. IP address sahi hai na?")
        print("      2. Us laptop pe Ollama chal raha hai?")
        print("      3. Us laptop pe OLLAMA_HOST='0.0.0.0:11434' set hai?")
        print("      4. Firewall port 11434 allow hai?")
        return

    print(f"[OK] Ollama node reachable! Models on this node: {result}")

    model_id = info['model_id']
    matching = [m for m in result if model_id in m or m.startswith(model_id.split(":")[0])]
    actual_model = matching[0] if matching else model_id

    print(f"[*] Sending test prompt to '{actual_model}' (VRAM load may take ~30-40s)...")
    payload = json.dumps({
        "model": actual_model,
        "prompt": "Say hello in 3 words.",
        "stream": False
    }).encode('utf-8')

    start = time.time()
    try:
        req = urllib.request.Request(
            f"{info['host']}/api/generate",
            data=payload,
            method="POST",
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=120) as response:
            data = json.loads(response.read().decode())
            print(f"[SUCCESS] Response: {data.get('response', '').strip()}")
            print(f"[LATENCY] {time.time() - start:.2f}s")
    except Exception as e:
        print(f"[ERROR] Generation failed: {e}")


def test_fastapi_verification_node(name, info):
    """Test Vaibhav's FastAPI verification server — uses /verify POST, not /api/tags"""
    reachable, result = check_fastapi_node(info['host'])
    if not reachable:
        print(f"[FAILED] NODE UNREACHABLE: Cannot connect to {info['host']}")
        print(f"   Reason: {result}")
        print("   -> Check:")
        print("      1. Is inference_server.py running on Vaibhav's PC?")
        print("         Run: python verification_node/inference_server.py")
        print("      2. Firewall: allow port 8001 inbound on Vaibhav's PC")
        print("      3. Confirm his IP is still 10.73.132.79 (run ipconfig)")
        return

    print(f"[OK] FastAPI Verification Node reachable at {info['host']}")
    print(f"[*] Sending test payload to /verify endpoint...")

    payload = json.dumps({
        "primary_output": "Diagnosis: Fault Detected. The pump bearing shows signs of overheating. Action: Schedule immediate maintenance."
    }).encode('utf-8')

    start = time.time()
    try:
        req = urllib.request.Request(
            f"{info['host']}/verify",
            data=payload,
            method="POST",
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(req, timeout=60) as response:
            data = json.loads(response.read().decode())
            result_text = data.get('verification_result', '').strip()
            print(f"[SUCCESS] Verification Node Reply:\n{result_text}")
            print(f"[LATENCY] {time.time() - start:.2f}s")
    except Exception as e:
        print(f"[ERROR] Verification call failed: {e}")

# ── Main dispatcher ────────────────────────────────────────────────────────────

def test_model(name, info):
    print(f"\n==========================================")
    print(f"Testing [{name.upper()}] Node: {info['host']}")
    print(f"Target Model: {info['model_id']}")
    print(f"==========================================")

    backend = info.get('backend', 'ollama').lower()

    if backend == 'fastapi':
        test_fastapi_verification_node(name, info)
    else:
        test_ollama_model(name, info)

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
