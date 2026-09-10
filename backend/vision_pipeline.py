import urllib.request
import json
import base64
import sys
import traceback
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
import io
import os

# Dynamically load the IP address of Laptop 2 from the registry
REGISTRY_PATH = os.path.join(os.path.dirname(__file__), "model_registry.json")
try:
    with open(REGISTRY_PATH, "r") as f:
        registry = json.load(f)
        OLLAMA_URL = registry.get("vision", {}).get("host", "http://127.0.0.1:11434")
except Exception:
    OLLAMA_URL = "http://127.0.0.1:11434"

VISION_MODEL = "qwen2.5vl:7b"

def run_vision_inference(image_bytes, prompt, model=VISION_MODEL):
    """Sends an image and a prompt to the Ollama vision model."""
    img_b64 = base64.b64encode(image_bytes).decode('utf-8')
    
    data = {
        "model": model,
        "prompt": prompt,
        "images": [img_b64],
        "stream": False
    }
    
    req = urllib.request.Request(f"{OLLAMA_URL}/api/generate", data=json.dumps(data).encode('utf-8'), method='POST')
    req.add_header('Content-Type', 'application/json')
    
    with urllib.request.urlopen(req, timeout=120) as response:
        result = json.loads(response.read().decode('utf-8'))
        return result.get('response', '')

def process_pid(image_path, query="List all major equipment and their tags visible in this P&ID."):
    """Path for handling P&ID diagrams with the vision model."""
    print(f"[P&ID Pipeline] Processing {image_path}...")
    try:
        with open(image_path, "rb") as img_file:
            img_bytes = img_file.read()
        
        # Bounded instruction to prevent hallucinations
        bounded_prompt = f"You are an industrial vision AI. Only answer from visible evidence. {query}"
        
        response = run_vision_inference(img_bytes, bounded_prompt)
        return {"status": "success", "confidence": "high", "result": response, "method": "vision_only"}
        
    except Exception as e:
        print(f"[P&ID Pipeline] Error: {e}")
        return {"status": "error", "confidence": "none", "result": str(e)}

def process_scanned_pdf(pdf_path):
    """Selective multimodal pipeline for Scanned PDFs (OCR + Vision with Fallback)."""
    print(f"[Scanned PDF Pipeline] Processing {pdf_path}...")
    results = []
    
    try:
        # Step 1: Open PDF using PyMuPDF
        doc = fitz.open(pdf_path)
        
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            
            # Convert to PIL Image for OCR
            img = Image.open(io.BytesIO(img_bytes))
            
            print(f"  -> Page {page_num+1}: Running OCR...")
            ocr_text = pytesseract.image_to_string(img).strip()
            
            print(f"  -> Page {page_num+1}: Running Vision Extraction...")
            prompt = f"Analyze this scanned document page. The raw OCR text is: '{ocr_text[:500]}...'. Correct any OCR errors, describe any diagrams/signatures, and provide a clean summary of the page."
            
            try:
                # Step 2: Attempt Vision Inference
                vision_text = run_vision_inference(img_bytes, prompt)
                results.append({
                    "page": page_num + 1,
                    "method": "ocr_plus_vision",
                    "confidence": "high",
                    "content": vision_text
                })
            except Exception as vision_e:
                # STEP 3: SAFE FALLBACK LOOP (Diff #11 & Day 3 Requirement)
                # If Vision OOMs or fails, we catch it, fallback to OCR only, and flag reduced confidence!
                print(f"  [!] Vision model failed/OOMed on Page {page_num+1}: {vision_e}")
                print("  [!] Executing Safe Fallback -> Dropping to OCR-Only mode.")
                
                results.append({
                    "page": page_num + 1,
                    "method": "ocr_only_fallback",
                    "confidence": "low",
                    "content": ocr_text,
                    "fallback_reason": str(vision_e)
                })
                
        return {"status": "success", "pages": results}
        
    except Exception as e:
        traceback.print_exc()
        return {"status": "error", "error": str(e)}

if __name__ == "__main__":
    # Local quick test for P&ID path using the generated image
    import os
    test_img = r"C:\Users\acer\.gemini\antigravity-ide\brain\fd737451-f639-4c9e-a95c-c78eed3a1aeb\test_pid_1788959418509.jpg"
    if os.path.exists(test_img):
        print("Testing P&ID Path...")
        print(process_pid(test_img))
    else:
        print(f"To test locally, place an image at {test_img}.")
