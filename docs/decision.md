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
