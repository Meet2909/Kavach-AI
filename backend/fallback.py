import json

def handle_fallback(model_id: str, error_msg: str):
    """
    Fallback logic stub for router integration.
    Called when the local model is busy or unavailable.
    """
    return {
        "status": "error",
        "model_id": model_id,
        "message": "Model is currently busy or unavailable. Your request has been queued or please try again later.",
        "internal_error": error_msg,
        "safe_response": "The AI service is momentarily unavailable. Please retry in a few moments."
    }

if __name__ == "__main__":
    # Test fallback locally
    print("Testing Fallback Logic:")
    result = handle_fallback("local-general-01", "Connection refused on port 11434")
    print(json.dumps(result, indent=2))
