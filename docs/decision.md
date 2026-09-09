# KAVACH-AI Architectural Decisions

## 1. Branching Strategy & Git Workflow
**Date:** 2026-09-09
**Decision:** We are adopting a strict branch-based workflow to avoid merge conflicts and isolated work being pushed to `main` directly.
- `main` branch is strictly for final, stable, working code.
- Each team member has a specific feature branch (`piyush-brain`, `vaibhav-engine`, etc.).
- Work must be PR-ed to `main` after verification. 
**Rationale:** Prevents accidental overwrites and establishes a clear audit trail of who built what.

## 2. Rule-Based Explainable Router
**Date:** 2026-09-09
**Decision:** The system will use a deterministic, rule-based router instead of a machine learning classifier (like RouteLLM).
- **PDF + text summaries:** Routed to Laptop 1 (`llama3.1:8b`).
- **Images / Scans / P&ID:** Routed to Laptop 2 (`qwen2.5-vl:7b`).
- **CSV / Calculations:** Routed to Laptop 2 (`qwen2.5-coder:7b`).
**Rationale:** It's more stable for a 5-day hackathon demo and ensures the correct specialist model is loaded on the 6GB GPU hardware constraint.

## 3. Hardware / Model Distribution
**Date:** 2026-09-09
**Decision:**
- **Laptop 1 (Piyush):** Dedicated host for general reasoning (`llama3.1:8b`). Local API at `127.0.0.1:11434`.
- **Laptop 2 (Vaibhav):** Dedicated engine for Vision and Coder models. Local API at `10.12.142.163:11434`. Models are hot-swapped depending on the task type.
**Rationale:** Both laptops have 6GB RTX 4050 GPUs. Loading a 7B model requires ~5.5GB of VRAM (using 4-bit GGUF). It's impossible to load both general and vision/coder models simultaneously on one machine without crashing (OOM). Distributing across two machines allows concurrent reasoning and prevents crashes.

## 4. Fallback Handling
**Date:** 2026-09-09
**Decision:** We will use a self-healing fallback mechanism. If the vision/coder model is unresponsive or OOMs, the backend will capture the error and optionally fall back to a safe state, returning a formatted error response instead of crashing the backend server.
**Rationale:** Essential for a stable live demonstration in front of judges.
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

# After pull from main decisions from Meet

## 1. Repository & Collaboration 
* **Branching Strategy:** Adopted a strict PR-based feature branching workflow (`main` acts as the stable trunk) to establish an audit trail and prevent accidental overwrites[cite: 2].
* **Monorepo & Dependency Isolation:** The Python environment (`.venv`) is strictly isolated to the `/backend`, while the Node environment relies on native `node_modules` scoping in `/frontend` to prevent cross-contamination.

## 2. Hardware & AI Routing 
* **Model Distribution:** Hardware is split across two RTX 4050 (6GB) laptops. Laptop 1 hosts the general reasoning model (`llama3.1:8b`), while Laptop 2 hosts specialist Vision/Coder models[cite: 2].
* **Rule-Based Explainable Router:** Implemented a deterministic router over a machine learning classifier to guarantee stable, predictable task delegation during the hackathon[cite: 2].
* **Hot-Swap Architecture:** To respect the 6GB VRAM limit on Laptop 2, models (`qwen2.5-vl` and `qwen2.5-coder`) are explicitly unloaded and pre-loaded via Ollama's API before executing heavy inference payloads[cite: 2].
* **Self-Healing Fallbacks:** The backend captures Out-Of-Memory (OOM) errors and utilizes a fallback mechanism to return formatted error states rather than crashing the API gateway[cite: 2].

## 3. Orchestration & State Machine
* **Bounded Agent Engine:** The `execute_agent_loop` runs on a strict state machine (`INTAKE -> PLAN -> ACT -> VERIFY`) with a hard limit of `max_steps=8` and `max_retries=2` to prevent infinite hallucination loops.
* **Module Segregation:** GPU management logic (`model_swap.py`) is explicitly decoupled from the cognitive reasoning loop (`agent.py`) to maintain single-responsibility principles.

## 4. Frontend Architecture
* **Framework Simplification:** Transitioned from Next.js/TypeScript to a Vite/React (JavaScript) stack to accelerate development velocity and eliminate compilation bottlenecks[cite: 1].
* **Centralized API Integration:** All Axios/Fetch logic is isolated in a single `api/client.js` utility, with FastAPI configured via `CORSMiddleware` to accept cross-origin requests from the local Vite server[cite: 1].
* **Styling Engine:** Adopted the Tailwind CSS v4 Vite plugin to eliminate legacy PostCSS configuration overhead[cite: 1].
* **Enterprise UX Constraints:** Enforced a collapsible sidebar layout to house the 8 mandatory operational tabs while rejecting non-functional scope creep like "About Us" pages to prioritize core AI verification criteria[cite: 1].

# Architectural Decisions Log - Storage & Concurrency

## Decision 5: Background Task Execution
* **Context:** The FastAPI gateway must trigger heavy multimodal inference without timing out the React frontend's HTTP requests.
* **Decision:** Implemented FastAPI `BackgroundTasks` in the `/task/{job_id}` endpoint.
* **Reasoning:** Shifting the `execute_agent_loop` to a background worker thread allows the API to immediately return a 200 OK status. This enables the frontend to enter a polling cycle against the `/job/{job_id}` endpoint to fetch live UI trace updates without encountering browser timeout limits.

## Decision 6: In-Memory Trace Logging
* **Context:** The system needs to track the execution steps (`AgentMemory`) of active tasks for UI rendering.
* **Decision:** Utilized a native Python dictionary (`jobs_db`) for short-term trace storage mapped to unique UUIDs.
* **Reasoning:** For a 6-day hackathon, implementing a heavy persistent database (like PostgreSQL) for transient trace logs introduces unnecessary latency and configuration overhead. An in-memory dictionary is sufficient for real-time trace polling, though trace data will be wiped if the orchestrator server restarts.
