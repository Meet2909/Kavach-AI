try:
    import fitz  # PyMuPDF library
except ImportError:
    fitz = None

def extract_and_chunk_pdf(file_path: str, chunk_size: int = 500) -> list[str]:
    """
    Opens a PDF, extracts raw text maintaining reading order, 
    and splits it into manageable chunks for the Vector DB.
    """
    if not fitz:
        # Fallback if fitz is not installed
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                full_text = f.read()
            return [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
        except Exception:
            return []
    try:
        # Open the document
        doc = fitz.open(file_path)
        full_text = ""
        
        # Iterate through pages and extract text
        for page_num in range(len(doc)):
            page = doc.load_page(page_num)
            full_text += page.get_text("text") + "\n"
            
        doc.close()
        
        # Basic chunking logic (splitting by character count for now)
        chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]
        return chunks
        
    except Exception as e:
        print(f"Extraction failed: {e}")
        return []