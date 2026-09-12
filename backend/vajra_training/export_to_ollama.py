from unsloth import FastLanguageModel

# Load the fine-tuned LoRA model
print("Loading fine-tuned Vajra model...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "vajra_lora_model", # Path to our saved LoRA weights
    max_seq_length = 1024,
    dtype = None,
    load_in_4bit = True,
)

# Export to GGUF format for Ollama
print("Exporting model to GGUF format for Ollama (this will take a few minutes)...")
# We use q4_k_m for a good balance of speed, 6GB VRAM safety, and accuracy
model.save_pretrained_gguf("vajra_model", tokenizer, quantization_method = "q4_k_m")

print("\nModel successfully exported to GGUF!")
print("Next steps:")
print("1. Create a file named 'Modelfile' with the following content:")
print("   FROM ./vajra_model-unsloth.Q4_K_M.gguf")
print("   SYSTEM \"You are Vajra, an expert AI assistant for Kavach-AI. Enforce citations strictly.\"")
print("2. Run the command: ollama create vajra -f Modelfile")
print("3. Test it: ollama run vajra")
