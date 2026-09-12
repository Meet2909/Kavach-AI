import os
import torch
from datasets import load_dataset
from unsloth import FastLanguageModel
from trl import SFTTrainer
from transformers import TrainingArguments

# Configuration
# Using Llama-3.2-3B-Instruct as requested.
MODEL_NAME = "unsloth/Llama-3.2-3B-Instruct" 
DATASET_PATH = "petroleum_verification_dataset.jsonl"
MAX_SEQ_LENGTH = 2048
LORA_RANK = 16

def train():
    print(f"Loading {MODEL_NAME} with 4-bit quantization...")
    
    # Load model and tokenizer via Unsloth for maximum VRAM efficiency
    model, tokenizer = FastLanguageModel.from_pretrained(
        model_name = MODEL_NAME,
        max_seq_length = MAX_SEQ_LENGTH,
        dtype = None, # Auto-detect (usually float16/bfloat16)
        load_in_4bit = True, # Critical for 6GB VRAM
    )

    # Apply LoRA adapters
    model = FastLanguageModel.get_peft_model(
        model,
        r = LORA_RANK, # Rank for adapters
        target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                          "gate_proj", "up_proj", "down_proj",],
        lora_alpha = LORA_RANK,
        lora_dropout = 0, # Dropout = 0 is optimized for Unsloth
        bias = "none",    # Bias = "none" is optimized for Unsloth
        use_gradient_checkpointing = "unsloth", # Saves massive VRAM
        random_state = 3407,
        use_rslora = False,
        loftq_config = None,
    )

    # Load dataset
    print(f"Loading dataset from {DATASET_PATH}...")
    dataset = load_dataset("json", data_files=DATASET_PATH, split="train")

    # The dataset needs to be formatted using the chat template
    def formatting_prompts_func(examples):
        texts = []
        for messages in examples["messages"]:
            # Apply the model's built-in chat template
            text = tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=False)
            texts.append(text)
        return { "text" : texts, }

    dataset = dataset.map(formatting_prompts_func, batched = True,)

    print("Initializing Trainer...")
    trainer = SFTTrainer(
        model = model,
        tokenizer = tokenizer,
        train_dataset = dataset,
        dataset_text_field = "text",
        max_seq_length = MAX_SEQ_LENGTH,
        dataset_num_proc = 2,
        packing = False, # Can make training 5x faster for short sequences
        args = TrainingArguments(
            per_device_train_batch_size = 2,
            gradient_accumulation_steps = 4, # Effective batch size = 8
            warmup_steps = 5,
            max_steps = 60, # Increase this based on your dataset size
            learning_rate = 2e-4,
            fp16 = not torch.cuda.is_bf16_supported(),
            bf16 = torch.cuda.is_bf16_supported(),
            logging_steps = 1,
            optim = "adamw_8bit", # Critical for memory saving
            weight_decay = 0.01,
            lr_scheduler_type = "linear",
            seed = 3407,
            output_dir = "outputs",
        ),
    )

    print("Starting training...")
    trainer_stats = trainer.train()

    print("Training complete! Saving LoRA adapters...")
    # Save only the LoRA adapters (small file size, ~100MB)
    model.save_pretrained("lora_verification_model") 
    tokenizer.save_pretrained("lora_verification_model")
    print("Adapters saved to ./lora_verification_model")

    # If you want to merge it into a single model for vLLM/Ollama later:
    # model.save_pretrained_merged("merged_model", tokenizer, save_method = "merged_16bit",)

if __name__ == "__main__":
    if not os.path.exists(DATASET_PATH):
        print(f"Error: Dataset {DATASET_PATH} not found. Please run prepare_dataset.py first.")
    else:
        train()
