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

---

# Vinit's Architectural Decisions (vinit-orchestrator branch)

## Decision 7: Pandas CSV Query Tool — `backend/csv_tool.py`
**Date:** 2026-09-09 | **Author:** Vinit Jha
**Decision:** Built a structured `query_csv()` tool with three functions: row filtering, numeric stats, and schema introspection.
**Reasoning:**
- The AI needs to ground answers in real historical data (e.g., "PUMP-A failed 3 times this quarter").
- Using Pandas keeps the logic entirely local — no SQL server needed, no external calls.
- The `get_csv_schema()` function is called during the PLAN phase so the AI knows column names before querying, reducing hallucinated column names.
- `max_rows=50` cap prevents the AI's context window from being flooded with thousands of rows.

## Decision 8: Docker Offline Sandbox — `backend/sandbox.py`
**Date:** 2026-09-09 | **Author:** Vinit Jha
**Decision:** All AI-generated Python code is executed inside a Docker container with `--network none`, `--memory=256m`, `--read-only`, and a 15-second `subprocess.timeout` hard kill.
**Reasoning:**
- AI-generated code must never run on the host machine directly — it could delete files, open sockets, or loop infinitely.
- `--network none` is a Docker-level guarantee (not just a policy) that no external call can be made from inside the container. This is our strongest live proof of sovereignty.
- The `read-only` filesystem with a small `/tmp` tmpfs means the container cannot persist anything to the host after exit.
- `--rm` auto-removes the container, preventing container accumulation on a long-running demo machine.
- 15-second timeout is sufficient for engineering calculation code while killing clearly runaway loops.
- `python:3.11-slim` was chosen over `alpine` for better numpy/pandas compatibility if math-heavy libraries are needed inside the sandbox in future days.

## Decision 9: Tool Permission Gate — `backend/tool_gate.py`
**Date:** 2026-09-09 | **Author:** Vinit Jha
**Decision:** Built a static POLICY_TABLE that maps every task type (`summary`, `coding`, `vision`, `csv_query`, `report`) to an `ALLOW / DENY / HUMAN_APPROVAL` verdict for every available tool.
**Reasoning:**
- A bounded agent must not be allowed to use tools outside its current task's scope. A coding session calling `write_docx` makes no sense and is a security leak.
- `HUMAN_APPROVAL` for all write/execute tools means the human is always in the loop before anything irreversible happens — directly satisfies the research-backed "human approval gate" differentiator.
- The `get_allowed_tools(task_type)` function is called during PLAN phase so the agent knows its own permission scope before it even tries to pick a tool — prevents unnecessary DENY events mid-execution.
- A static policy table was chosen over dynamic rule evaluation for hackathon reliability — deterministic, no ML inference needed, zero chance of policy hallucination.
- Exposed as `/check_permission` and `/tools/{task_type}` API endpoints so the frontend (Aniket's TracePanel) can display live permission verdicts to the judge.

## Decision 10: Artifact Validation — `backend/artifact_validator.py`
**Date:** 2026-09-09 | **Author:** Vinit Jha
**Decision:** Built a 3-check validation pipeline that runs on every generated `.docx` before it is served to the human approval screen: Open Check → Sections Check → Evidence Check.
**Reasoning:**
- "Generated ≠ Correct" is one of our 13 core research differentiators. An AI that produces a `.docx` but has missing sections or no cited evidence is worse than no AI — it gives false confidence.
- The Evidence Check specifically addresses hallucination risk: if no citation keyword is found (e.g., "As per inspection report", "Refer SOP-12"), the document is rejected. The agent must ground every finding in a real source.
- The Sections Check uses a per-task-type required-headings list so the same validator serves `report`, `summary`, `coding`, and `csv_query` outputs without code duplication.
- The Open Check catches corrupted or empty files early and avoids misleading errors downstream.
- The `/artifact/{job_id}` endpoint is now gated — if validation fails it returns HTTP 422 with structured failure reasons so the agent can log exactly what to fix and regenerate.
- `python-docx` was chosen over parsing raw XML because it handles complex DOCX formatting (tables, nested paragraphs) correctly and is battle-tested.



## Decision 11: Sovereignty Monitor — `backend/sovereignty_monitor.py`
**Date:** 2026-09-09 | **Author:** Vinit Jha
**Decision:** Built a `psutil`-based live network monitor with 4 functions: live status, per-task snapshot start/end delta, and per-process connection audit. Exposed as 4 dedicated judge-facing API endpoints.
**Reasoning:**
- The sovereignty claim must be demonstrated with live numbers, not just stated. Judges at SIH will ask for proof — this is it.
- `psutil` was chosen over `eBPF` because macOS does not support eBPF. `psutil` reads directly from the OS kernel's network counters and works on both Mac and Windows.
- The `start_snapshot()` / `end_snapshot()` delta pattern is the cleanest proof: judges call start, watch a full task run, call end — `bytes_sent_delta ≈ 0` is undeniable.
- A 10KB threshold in `end_snapshot()` accounts for LAN-local traffic (Vite HMR, CORS preflight) so no false alarms on a real LAN setup.
- `get_process_network_usage()` gives judges per-process visibility — only `uvicorn` and `browser` have connections, nothing is phoning home.
- All four functions are surfaced as `/sovereignty/*` API routes so both the frontend SovereigntyPanel AND a manual Postman call can show proof live during the demo.
