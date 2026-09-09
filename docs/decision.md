# KAVACH-AI Architectural Decisions

This document tracks all major architectural decisions and hardware observations across the project, ensuring a clear record of why specific choices were made.

## Laptop 2 (Engine) Decisions

### Day 1: Setup and Validation
- **Role**: Host for Qwen2.5-Coder-7B and Qwen2.5-VL-7B (both 4-bit) via Ollama.
- **Hardware Profile**: Windows 11, NVIDIA RTX 4050 Laptop GPU (~6GB VRAM). IP Address: `10.12.142.163`.
- **Constraint Management**: Because 6GB VRAM cannot hold both 7B models simultaneously without severe performance degradation, we enforce a strict hot-swap protocol (load/unload) between vision and coding tasks.
- **Status**: Ollama verified. `qwen2.5-coder:7b` and `qwen2.5vl:7b` installed.

### VRAM Limit Test Results (Day 1)
- **Test Setup**: `qwen2.5vl:7b` prompted to extract equipment tags from a generated MRPL P&ID diagram.
- **Result**: PASSED. The model successfully loaded the image and returned all 21 equipment tags accurately (Furnace F-101, Reactor R-101, etc.).
- **OOM Status**: No Out-Of-Memory crash occurred. The model peaked at exactly **4.5 GB / 6.0 GB** Dedicated GPU Memory. This leaves 1.5 GB of safe headroom. No 2B-class fallback model is required for baseline operation.

### Hot-Swap Architecture (Day 2)
- **Problem**: We need to seamlessly switch between `qwen2.5-coder:7b` and `qwen2.5vl:7b` without relying on Ollama's automatic memory management, which can sometimes fail to unload models aggressively enough on constrained hardware.
- **Implementation**: `backend/model_swap.py`
- **API**: The `swap_model(target_model)` function hits `/api/ps` to check loaded models. It forces an unload via `/api/generate` with `"keep_alive": 0` for any non-target models, pausing for 1 second to let VRAM clear. It then pre-loads the target model with `"keep_alive": -1`.
- **UI State**: The script emits `STATE: 'Switching to vision model...'` or `STATE: 'Switching to coder model...'` to the console so the Orchestrator can capture this `stdout` and forward it to Ananya's Frontend Route Card.
