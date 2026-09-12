from unsloth import FastLanguageModel
import torch
from trl import SFTTrainer
from transformers import TrainingArguments
from datasets import load_dataset

# 1. Configuration for 6GB GPU (RTX 4050)
max_seq_length = 1024 # Keep small to fit in 6GB VRAM
dtype = None # Auto detection
load_in_4bit = True # Essential for 6GB GPU

# 2. Load Base Model
print("Loading base model: Qwen/Qwen2.5-3B-Instruct (or Llama-3.2-3B)...")
model, tokenizer = FastLanguageModel.from_pretrained(
    model_name = "Qwen/Qwen2.5-3B-Instruct", 
    max_seq_length = max_seq_length,
    dtype = dtype,
    load_in_4bit = load_in_4bit,
)

# 3. Apply LoRA Adapters
print("Adding LoRA adapters...")
model = FastLanguageModel.get_peft_model(
    model,
    r = 16, 
    target_modules = ["q_proj", "k_proj", "v_proj", "o_proj",
                      "gate_proj", "up_proj", "down_proj",],
    lora_alpha = 16,
    lora_dropout = 0, 
    bias = "none",
    use_gradient_checkpointing = "unsloth", # Super important for 6GB VRAM
    random_state = 3407,
)

# 4. Load Dataset
print("Loading dataset.json...")
dataset = load_dataset("json", data_files="dataset.json", split="train")

alpaca_prompt = """Below is an instruction that describes a task. Write a response that appropriately completes the request.

### Instruction:
{}

### Response:
{}"""

EOS_TOKEN = tokenizer.eos_token
def formatting_prompts_func(examples):
    instructions = examples["instruction"]
    outputs      = examples["output"]
    texts = []
    for instruction, output in zip(instructions, outputs):
        text = alpaca_prompt.format(instruction, output) + EOS_TOKEN
        texts.append(text)
    return { "text" : texts, }

dataset = dataset.map(formatting_prompts_func, batched = True,)

# 5. Training
print("Starting Training...")
trainer = SFTTrainer(
    model = model,
    tokenizer = tokenizer,
    train_dataset = dataset,
    dataset_text_field = "text",
    max_seq_length = max_seq_length,
    dataset_num_proc = 2,
    packing = False, # Can make training 5x faster for short sequences.
    args = TrainingArguments(
        per_device_train_batch_size = 2, # Small batch for 6GB VRAM
        gradient_accumulation_steps = 4,
        warmup_steps = 5,
        max_steps = 60, # Change to num_epochs for full training
        learning_rate = 2e-4,
        fp16 = not torch.cuda.is_bfloat16_supported(),
        bf16 = torch.cuda.is_bfloat16_supported(),
        logging_steps = 1,
        optim = "adamw_8bit",
        weight_decay = 0.01,
        lr_scheduler_type = "linear",
        seed = 3407,
        output_dir = "outputs",
    ),
)

trainer_stats = trainer.train()

# 6. Save Model
print("Training Complete! Saving model...")
model.save_pretrained("vajra_lora_model") # Local saving
tokenizer.save_pretrained("vajra_lora_model")

print("Run export_to_ollama.py next to convert to GGUF format!")
