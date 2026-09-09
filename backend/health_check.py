import urllib.request
import urllib.error
import json
import time
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

OLLAMA_HOST = "http://127.0.0.1:11434"
# Llama 3.1 8B model tag. Update to "llama3.1:latest" if that is the tag downloaded
MODEL_NAME = "llama3.1:8b" 

def check_ollama_health():
    status = {"status": "healthy", "details": []}
    
    # Check /api/tags
    start_time = time.time()
    try:
        req = urllib.request.Request(f"{OLLAMA_HOST}/api/tags", method="GET")
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            latency = time.time() - start_time
            models = [m["name"] for m in data.get("models", [])]
            # Verify if the required model is downloaded
            if MODEL_NAME in models or "llama3.1:latest" in models:
                status["details"].append(f"/api/tags OK ({latency:.4f}s)")
                logging.info(f"Model found in tags. Latency: {latency:.4f}s")
            else:
                status["status"] = "unhealthy"
                status["details"].append(f"Model {MODEL_NAME} not found in tags.")
                logging.warning(f"Model {MODEL_NAME} not found. Available: {models}")
    except Exception as e:
        status["status"] = "down"
        status["details"].append(f"/api/tags FAILED: {str(e)}")
        logging.error(f"Ollama service down or unreachable: {str(e)}")
        return status
        
    # Check /api/generate
    start_time = time.time()
    payload = json.dumps({
        "model": "llama3.1" if "llama3.1:latest" in models else MODEL_NAME,
        "prompt": "health check",
        "stream": False
    }).encode('utf-8')
    
    try:
        req = urllib.request.Request(f"{OLLAMA_HOST}/api/generate", data=payload, method="POST", headers={'Content-Type': 'application/json'})
        with urllib.request.urlopen(req, timeout=30) as response:
            data = json.loads(response.read().decode())
            latency = time.time() - start_time
            status["details"].append(f"/api/generate OK ({latency:.4f}s)")
            logging.info(f"/api/generate successful. Latency: {latency:.4f}s")
    except Exception as e:
        status["status"] = "unhealthy"
        status["details"].append(f"/api/generate FAILED: {str(e)}")
        logging.error(f"/api/generate failed: {str(e)}")
        
    return status

if __name__ == "__main__":
    result = check_ollama_health()
    print("\n--- Health Check Result ---")
    print(json.dumps(result, indent=2))
