import os
import glob
import json
import requests
import fitz  # PyMuPDF
from pathlib import Path

# Config
OLLAMA_HOST = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "llama3.1:latest" # Using Brain to generate training data for Vajra
RAW_DATA_DIR = "./raw_data"
OUTPUT_FILE = "dataset.json"

def extract_text_from_pdf(pdf_path):
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text() + "\n"
    return text

def generate_qa_pairs(chunk_text):
    prompt = f"""You are generating training data for a refinery AI model. 
Analyze the following text and generate 3 highly specific Question & Answer pairs in JSON format.
The Q&A MUST enforce the citation format: (Source: [Doc Name], Page [X]).

Text chunk:
{chunk_text}

Output ONLY valid JSON like this:
[
  {{"instruction": "Question here", "input": "", "output": "Answer here (Source: ...)"}}
]
"""
    try:
        res = requests.post(OLLAMA_HOST, json={
            "model": OLLAMA_MODEL,
            "prompt": prompt,
            "stream": False,
            "format": "json"
        }, timeout=60)
        return json.loads(res.json()["response"])
    except Exception as e:
        print(f"Error generating Q&A for chunk: {e}")
        return []

def main():
    print(f"Scanning {RAW_DATA_DIR} for raw files...")
    all_pairs = []
    
    # 1. Process PDFs
    for pdf_file in glob.glob(f"{RAW_DATA_DIR}/*.pdf"):
        print(f"Processing {pdf_file}...")
        text = extract_text_from_pdf(pdf_file)
        # Chunk text (very basic chunking for example purposes)
        chunks = [text[i:i+2000] for i in range(0, len(text), 2000)]
        for chunk in chunks:
            pairs = generate_qa_pairs(chunk)
            all_pairs.extend(pairs)

    # 2. Add some mandatory Abstention & Conflict examples
    print("Adding synthetic abstention and conflict examples...")
    abstention_examples = [
        {
            "instruction": "What is the operating pressure of REACTOR-999?",
            "input": "",
            "output": "[INSUFFICIENT EVIDENCE] There is no information regarding REACTOR-999 in the current knowledge base. Human review required."
        },
        {
            "instruction": "Compare Boiler Rev-2 and Rev-4 specs.",
            "input": "",
            "output": "[CONFLICT ALERT] Rev-2 indicates max temperature of 400°C, while Rev-4 updates this to 450°C. Please follow Rev-4 guidelines."
        }
    ]
    all_pairs.extend(abstention_examples)

    # 3. Save dataset
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_pairs, f, indent=4)
        
    print(f"Dataset generated! Saved {len(all_pairs)} examples to {OUTPUT_FILE}")
    print("Next step: Run train_vajra.py")

if __name__ == "__main__":
    main()
