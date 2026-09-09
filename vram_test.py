import urllib.request
import json
import base64
import sys

def test_vram_with_image(image_path):
    url = "http://127.0.0.1:11434/api/generate"
    
    print(f"Reading image: {image_path}")
    try:
        with open(image_path, "rb") as img_file:
            img_b64 = base64.b64encode(img_file.read()).decode('utf-8')
    except Exception as e:
        print(f"Error reading image: {e}")
        print("Make sure you saved the image as 'test_pid.png' in the KAVACH-AI-Laptop2 folder!")
        sys.exit(1)

    prompt = "This is an industrial P&ID diagram. List all the major equipment and their tags (like R-101) visible in the image."
    
    data = {
        "model": "qwen2.5vl:7b",
        "prompt": prompt,
        "images": [img_b64],
        "stream": False
    }
    
    print(f"Sending request to qwen2.5vl:7b...")
    print(f"*** PLEASE OPEN TASK MANAGER NOW ***")
    print(f"Go to Performance -> GPU and monitor your 'Dedicated GPU Memory'.")
    print(f"Watch if it hits the 6.0 GB limit and crashes (OOM) or successfully completes.")
    
    req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), method='POST')
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req, timeout=120) as response:
            result = json.loads(response.read().decode('utf-8'))
            print("\n--- Model Output ---")
            print(result.get('response', 'No response field'))
            print("\n✅ VRAM Test Complete! The model did not crash.")
    except Exception as e:
        print(f"\n❌ Error during inference (Possible Out Of Memory or timeout): {e}")

if __name__ == "__main__":
    image_path = sys.argv[1] if len(sys.argv) > 1 else "test_pid.png"
    test_vram_with_image(image_path)
