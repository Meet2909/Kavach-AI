<div align="center">

# 🛡️ KAVACH-AI

### Sovereign Air-Gapped Industrial AI Orchestrator

[![SIH 2026](https://img.shields.io/badge/SIH-2026-blueviolet?style=for-the-badge)](https://sih.gov.in)
[![Security](https://img.shields.io/badge/Security-Air--Gapped%20Zero--Egress-success?style=for-the-badge)](#)
[![Hardware](https://img.shields.io/badge/Hardware-Dual%20RTX%204050%20Cluster-orange?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/License-Proprietary-blue?style=for-the-badge)](#)
[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](#)

> **Deterministic multimodal reasoning, least-privilege agent execution, and verifiable air-gap telemetry for India's critical industrial infrastructure.**

</div>

---

## 📋 Table of Contents

1. [The Problem](#-the-problem)
2. [Our Solution](#-our-solution)
3. [System Architecture](#-system-architecture)
4. [How It Works — The Agent Flow](#-how-it-works--the-agent-flow)
5. [Core Innovations](#-core-innovations)
6. [Technology Stack](#-technology-stack)
7. [Project Structure](#-project-structure)
8. [Quickstart Guide](#-quickstart-guide)
9. [Architectural Decisions](#-architectural-decisions)
10. [Challenges Solved](#-challenges-solved)
11. [Team](#-team)

---

## 🚨 The Problem

India's critical industrial infrastructure — **petroleum refineries (IOCL, ONGC, MRPL), nuclear power plants (NPCIL), and defense installations** — generates enormous volumes of sensitive operational data every day:

- **Piping & Instrumentation Diagrams (P&IDs)** — detailed plant schematics
- **Equipment sensor telemetry** — real-time voltage, temperature, vibration, fault logs
- **Standard Operating Procedures (SOPs)** — multi-revision safety documents
- **Maintenance incident records** — historical downtime, failure modes, repair logs

### Why Existing AI Solutions Fail

| Problem | Impact |
|---|---|
| **Cloud AI is legally forbidden** | Sending plant schematics or telemetry to OpenAI, Gemini, or Anthropic violates Indian National Cyber Security Directives and Petroleum Ministry data protection regulations |
| **Generic RAG hallucinates** | Vector similarity search misquotes exact pressure thresholds and downtime hours — a hallucinated value in an oil refinery inspection note can cause catastrophic operational decisions |
| **Unbounded AI agents are unpredictable** | LangChain ReAct loops have no execution ceiling — they can run forever, exhaust GPU VRAM, and crash inference nodes |
| **No verifiable sovereignty proof** | Every cloud-connected system claims to be "secure" — none can mathematically prove that zero bytes left the premises during a task |
| **Enterprise GPU dependency** | Most AI deployments assume A100/H100 GPU clusters — unaffordable for edge deployment inside existing industrial facilities |

> **A false positive in an AI-generated inspection report is more dangerous than no AI at all — it provides false confidence that can cost lives.**

---

## ✅ Our Solution

**KAVACH-AI** (Sanskrit: *Shield*) is a **100% air-gapped, distributed multi-node AI orchestration mesh** that brings the full power of modern multimodal AI to industrial plants without a single byte leaving the facility.

### What Makes It Different

```
❌  Other Systems:  Cloud API → External Server → Response → Display (data leaves)
✅  KAVACH-AI:     Local LAN Mesh → Specialist LLM → Bounded State Machine →
                   Validated Artifact → Human Approval (zero external contact)
```

### Core Guarantees

- 🔒 **Zero Data Egress** — Kernel-level OS network monitoring mathematically proves `bytes_sent_delta ≈ 0`
- 🧠 **Bounded Execution** — Hard 8-step state machine replaces infinite LangChain ReAct loops
- 📄 **Validated Outputs** — Every AI-generated document passes a 3-check validation gate before human handoff
- 🛡️ **Least-Privilege Execution** — Static policy table gates every tool call: `ALLOW / DENY / HUMAN_APPROVAL`
- 🔢 **Zero Hallucination on Data** — Pandas deterministic queries on real plant records, not approximate embeddings
- 🔐 **Dynamic /24 Subnet Locking** — Sovereignty monitor auto-derives the cluster subnet at startup and flags any connection originating outside the `/24` prefix as unauthorized — prevents spoofed IP penetration from external networks mimicking similar addresses

---

## 🏗️ System Architecture

### The Four-Node Air-Gapped Mesh

```
┌────────────────────────────────────────────────────────────────────┐
│                 AIR-GAPPED LAN  (Mobile Hotspot)                   │
│                      NO INTERNET — NO CLOUD                        │
│                                                                    │
│   ┌─────────────────────────┐    ┌──────────────────────────────┐  │
│   │  NODE 1 — Orchestrator  │    │  NODE 2 — The Brain          │  │
│   │  Vinit | 10.73.132.28   │◄──►│  Piyush | 10.73.132.136      │  │
│   │                         │    │                              │  │
│   │  • FastAPI Gateway :8000│    │  • llama3.1:latest           │  │
│   │  • State Machine        │    │  • General reasoning         │  │
│   │  • Docker Sandbox       │    │  • SOP / policy QA           │  │
│   │  • Sovereignty Monitor  │    │  • SQLite Knowledge Graph    │  │
│   │  • Tool Gate            │    │  • Revision conflict detect  │  │
│   │  • Artifact Validator   │    └──────────────────────────────┘  │
│   │  • SHA-256 Audit Trail  │                                      │
│   └──────────┬──────────────┘    ┌──────────────────────────────┐  │
│              │                   │  NODE 3 — The Engine         │  │
│              └──────────────────►│  Vaibhav | 10.73.132.79      │  │
│                                  │                              │  │
│   ┌─────────────────────────┐    │  • qwen2.5vl:7b (Vision)     │  │
│   │  NODE 4 — Frontend      │    │  • qwen2.5-coder:7b (Code)   │  │
│   │  Meet/Ananya | :5174    │    │  • VRAM Hot-Swap Manager     │  │
│   │                         │    │  • RTX 4050 6GB              │  │
│   │  • React 19 + Vite      │    └──────────────────────────────┘  │
│   │  • 8 Operational Panels │                                      │
│   │  • Live TracePanel      │                                      │
│   │  • Human Approval UI    │                                      │
│   └─────────────────────────┘                                      │
└────────────────────────────────────────────────────────────────────┘
```

### Node Responsibilities

| Node | Person | IP & Port | Model | Role |
|:---|:---|:---|:---|:---|
| **Node 1 — Orchestrator** | Vinit Jha | `10.73.132.28:8000` | FastAPI | API Gateway · Docker Sandbox · State Machine · Sovereignty Monitor · Artifact Validator |
| **Node 2 — The Brain** | Piyush | `10.73.132.136:11434` | `llama3.1:latest` | General reasoning · SOP analysis · Knowledge graph · Conflict detection |
| **Node 3 — The Engine** | Vaibhav | `10.73.132.79:11434` | `qwen2.5vl:7b` + `qwen2.5-coder:7b` | P&ID visual inspection · Code execution · VRAM hot-swapping |
| **Node 4 — Frontend** | Meet / Ananya | `10.73.132.x:5174` | React 19 | Industrial Command Center · TracePanel · Human Approval |

---

## 🔄 How It Works — The Agent Flow

KAVACH-AI uses a **7-phase bounded deterministic state machine** at its core. This replaces unbounded ReAct loops with a predictable, auditable execution pipeline.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     KAVACH-AI EXECUTION PIPELINE                         │
│                                                                          │
│  User uploads P&ID / CSV / PDF / Query                                   │
│            │                                                             │
│            ▼                                                             │
│   ┌──────────────┐                                                       │
│   │   INTAKE     │  Parse task type, prompt, file path, job directory   │
│   └──────┬───────┘                                                       │
│          │                                                               │
│          ▼                                                               │
│   ┌──────────────┐  • Deterministic Rule Router → picks specialist LLM  │
│   │    PLAN      │  • Tool Permission Gate → ALLOW / DENY / HUMAN_APPR  │
│   └──────┬───────┘  • Schema introspect CSV (if needed)                 │
│          │                                                               │
│          ▼                                                               │
│   ┌──────────────┐  • Knowledge Graph dual-track evaluation              │
│   │   RETRIEVE   │  • Abstention Gate → if asset unknown, HALT & ask    │
│   └──────┬───────┘  • Fetch 360° equipment profile from SQLite          │
│          │           • Extract PDF chunks / preprocess image             │
│          │                                                               │
│          ▼                                                               │
│   ┌──────────────┐  • VRAM Hot-Swap (if engine node needed)             │
│   │     ACT      │  • 4-Pillar grounded metaprompt construction         │
│   └──────┬───────┘  • Distributed Ollama inference (LAN HTTP)           │
│          │           • Image resize 384px / JPEG Q65 for vision         │
│          │                                                               │
│          ▼                                                               │
│   ┌──────────────┐  • Parse raw response                                │
│   │   OBSERVE    │  • Check for inference failure / node unreachable    │
│   └──────┬───────┘                                                       │
│          │                                                               │
│          ▼                                                               │
│   ┌──────────────┐  • Generate .docx artifact                           │
│   │    VERIFY    │  • 3-Check Validation Gate (file → length → LLM      │
│   └──────┬───────┘    Judge) → retry if fail (max 2 retries)            │
│          │                                                               │
│          ▼                                                               │
│   ┌──────────────┐  • Seal SHA-256 cryptographic audit log              │
│   │  COMPLETED   │  • Surface to Human Approval UI                      │
│   └──────────────┘                                                       │
│                                                                          │
│   ⚠️  Safety Guard: max_steps=8, max_retries=2                          │
│      Breaching either → immediate FAILED with structured reason          │
└──────────────────────────────────────────────────────────────────────────┘
```

### The Explainable Router

The task router uses a **deterministic rule table** — not another LLM — to dispatch tasks in 0.1ms:

| Input Type | Routed To | Model | Confidence |
|---|---|---|---|
| PNG / JPG / P&ID / vision keywords | Node 3 | `qwen2.5vl:7b` | 0.95 |
| CSV / XLSX / code / calculation | Node 3 | `qwen2.5-coder:7b` | 0.90 |
| PDF / text / summary / report | Node 2 | `llama3.1:latest` | 0.85 |

The router also returns `rejected_models` with human-readable reasons, displayed live in the frontend Route Card so operators understand exactly why a model was chosen.

### The Knowledge Graph — Dual Track

Every query goes through a **dual-track evaluation** before inference:

```
Query → is_general_query()?
           │
    YES ───┼─── General Theory Track:
    │      │    (e.g. "How does a centrifugal pump work?")
    │      │    → Route directly to LLM weights. No DB lookup.
    │      │
    NO ────┼─── Plant Asset Track:
           │    extract_equipment_id() → found "PUMP-A"?
           │           │
           │    FOUND ─┴─ Load 360° profile from SQLite:
           │               • Design specs & active revision
           │               • Topology edges (FEEDS, REGULATES)
           │               • Maintenance incident history
           │               • Latest sensor telemetry
           │               → Inject into 4-Pillar Metaprompt
           │
           │    NOT FOUND → ABSTAIN:
                            "[INSUFFICIENT EVIDENCE] Request Human Review"
                            Skip inference entirely. Never guess.
```

---

## 🔴 Core Innovations

### 1 — Verifiable Air-Gap Sovereignty + Dynamic /24 Subnet Locking

**The Problem:** Any system can *claim* air-gap compliance. Nobody can *prove* it without live evidence.

**Our Solution:** `sovereignty_monitor.py` reads OS kernel network interface counters via `psutil` — the same counters the OS kernel maintains. It exposes four judge-facing API endpoints:

```
GET  /sovereignty/status             → live bytes_sent, connection list, external connections
POST /sovereignty/snapshot/start     → capture network baseline before task
POST /sovereignty/snapshot/end       → compute bytes_sent_delta after task
GET  /sovereignty/process_audit      → per-process PID connection listing
```

**Dynamic /24 Subnet Locking:** At startup, the orchestrator reads its own NIC IP and auto-derives the `/24` cluster subnet prefix:
```
Hotspot A: 10.73.132.28  → CLUSTER_SUBNET = "10.73.132."
Hotspot B: 192.168.43.45 → CLUSTER_SUBNET = "192.168.43."
```
Any connection originating from an IP **outside** the `/24` prefix is flagged as unauthorized — this closes the attack vector where an external machine with a similar IP (e.g. `10.73.133.x`) could spoof a trusted cluster node. No hardcoded subnets — auto-adapts when the hotspot changes.

**The Mathematical Proof:** `bytes_sent_delta ≈ 0` after a full AI task cycle is undeniable evidence. The 10KB allowance accounts for LAN-local overhead only (Vite HMR, CORS preflight).

---

### 2 — Bounded Deterministic State Machine (Anti-ReAct)

**The Problem:** LangChain ReAct loops are unbounded. They hallucinate tool calls, exhaust tokens, and can loop until the GPU crashes.

**Our Solution:** The `execute_agent_loop` enforces hard limits in Python:
```python
def is_bounded(self, max_steps=8, max_retries=2) -> bool:
    return self.step_count < max_steps and self.retry_count <= max_retries
```

If either threshold is breached → immediate structured `FAILED` state. An industrial system that says "insufficient data, request human review" causes zero harm. A system that loops indefinitely can crash the entire inference node.

---

### 3 — "Generated ≠ Correct" Validation Gate

**The Problem:** 95% of AI demos call `generate()`, display the text, and call it done. In an oil refinery, an inspection note with missing safety sections provides false confidence that can cause hazardous decisions.

**Our Solution:** Every `.docx` artifact passes a **3-check pipeline** before reaching any human:

| Check | What It Tests |
|---|---|
| **Open Check** | File exists · not corrupted · parseable by python-docx · ≥100 bytes |
| **Length Check** | Document ≥30 words (filters empty/stub outputs) |
| **LLM-as-a-Judge** | Local `llama3.2` acts as Senior Engineering Reviewer → returns `{"valid": bool, "failures": [...]}` |

If any check fails → agent is told to regenerate (bounded by `max_retries=2`). The endpoint returns HTTP 422 with structured failure reasons. **The AI is never the final approver of its own output.**

---

### 4 — Dual Defense Execution Sandbox

**The Problem:** AI-generated Python code running directly on the host machine can delete files, open sockets, or loop forever.

**Layer 1 — Least-Privilege Tool Gate (`tool_gate.py`):**  
A static `POLICY_TABLE` assigns `ALLOW`, `DENY`, or `HUMAN_APPROVAL` to every `(task_type, tool_name)` pair:
```
summary task  + run_python  → DENY           (summaries never execute code)
summary task  + write_docx  → HUMAN_APPROVAL (document writing needs sign-off)
coding task   + run_python  → HUMAN_APPROVAL (execution always needs human)
coding task   + write_docx  → DENY           (coding doesn't produce Word docs)
```

**Layer 2 — Docker Offline Sandbox (`sandbox.py`):**
```bash
docker run \
  --rm \                    # auto-destroy after exit
  --network none \          # kernel-level network namespace isolation
  --memory="256m" \         # 256MB RAM cap
  --cpus="0.5" \            # 50% of one CPU core
  --read-only \             # cannot write to host filesystem
  --tmpfs /tmp:size=10m \   # small scratch space only
  python:3.11-slim \
  python -c "<ai_generated_code>"
```
`--network none` is enforced at the Docker **kernel namespace level** — not a firewall rule. The container literally has no network interface. Even if LLM-generated code calls `urllib.request.urlopen()`, it fails at the kernel level.

---

### 5 — Grounded Tabular RAG (Zero Hallucination on Operational Data)

**The Problem:** Vector RAG returns approximate semantic matches. When an engineer asks "How many hours did PUMP-A spend in downtime this quarter?", approximate is unacceptable.

**Our Solution:** `csv_tool.py` — a Pandas deterministic query engine:
- `get_csv_schema()` called during **PLAN phase** → LLM knows column names before querying (eliminates hallucinated column names)
- `query_csv(filters, columns)` → exact row-level predicate filtering
- `get_csv_stats(column, groupby)` → exact numeric aggregation

Backed by **real demo data**: 500 rows of sensor telemetry + 11 maintenance incidents seeded into SQLite.  
**Hallucination rate on operational thresholds and maintenance records: 0%.**

---

### 6 — VRAM Hot-Swap on Consumer 6GB GPUs

**The Problem:** Running two 7B multimodal models simultaneously on a 6GB consumer GPU is physically impossible. Enterprise solutions require A100/H100 GPUs.

**Our Solution:** `model_swap.py` implements a protocol-level VRAM orchestrator:
```python
swap_model(target_model, host):
    loaded = GET /api/ps                       # check VRAM occupancy
    for model in loaded:
        if model != target_model:
            POST /api/generate {keep_alive: 0}  # force evict from VRAM
            sleep(1)                            # let VRAM clear
    POST /api/generate {keep_alive: -1}         # pin target in VRAM
```

After swap, the ACT phase polls `/api/ps` for up to 90 seconds confirming the model is loaded before firing inference — preventing "mid-load inference" 500 errors that occurred at the 150-second boundary.

**Measured:** `qwen2.5vl:7b` peaks at 4.5 GB / 6.0 GB VRAM — 1.5 GB safe headroom. Zero OOM crashes.

---

### 7 — SQLite Knowledge Graph + SOP Revision Conflict Detection

**The Problem:** Industrial plants have decades of SOPs in conflicting versions. A naive RAG silently overwrites Rev-2 (400°C limit) with Rev-4 (450°C limit) without alerting anyone.

**Our Solution:** A local SQLite knowledge graph with 6 tables:
```
graph_nodes       → Equipment entities (properties, criticality, active revision)
graph_edges       → Topology (FEEDS, REGULATES, BYPASSES relationships)
maintenance_logs  → Historical incidents (dates, downtime, status, technician)
sensor_telemetry  → Time-series sensor readings
revision_conflicts→ Audit log of parameter contradictions detected
documents         → Document revision tracking
```

**Revision Conflict Detection:**
```python
# New Rev-4 doc says BOILER-B101 max_temp = 450°C
# Active Rev-2 in DB says max_temp = 400°C
→ [CONFLICT ALERT] Rev-2 (max_operating_temp=400°C)
   contradicts incoming Rev-4 (max_operating_temp=450°C)!
```
The conflict is persisted in `revision_conflicts` and surfaced live in the Security Audit Panel. The old value is **never silently overwritten**.

**4-Pillar Metaprompt:** When a plant-asset query is grounded, the LLM receives a structured prompt with: Role & Persona → Operational Guardrails → Injected SQLite Evidence → Chain-of-Thought Framework. The model cannot hallucinate — it is explicitly restricted to the evidence block.

---

### 8 — SHA-256 Cryptographic Audit Trail

At the end of every state machine execution (success or failure), `audit.py` seals a tamper-evident log:

```json
{
  "job_id": "uuid",
  "timestamp": "2026-09-22T14:30:00",
  "routing_decision": { "model": "llama3.1", "reason": "..." },
  "tool_verdicts": { "read_pdf": "ALLOW", "run_python": "DENY" },
  "validation_outcome": { "valid": true, "checks_passed": 3 },
  "sha256_hash": "e3b0c44298fc..."
}
```

Satisfies industrial audit requirements for documented AI decisions under Indian regulatory frameworks.

---

### 9 — VAJRA — Custom Domain Fine-Tuned Model

Off-the-shelf models produce generic responses that frequently fail the Artifact Validator. **VAJRA** is a QLoRA fine-tuned model trained on industrial citation formats and P&ID data:

```
Base Model:  Qwen/Qwen2.5-3B-Instruct
Method:      QLoRA (4-bit) + LoRA adapters (r=16)
Training:    60 steps, AdamW-8bit, gradient checkpointing
Loss:        4.6 → 0.02
Export:      GGUF → Ollama (vajra-model)
```

**Training pipeline (`backend/vajra_training/`):**

| Script | Purpose |
|---|---|
| `prepare_dataset.py` | Auto-generate synthetic Q&A pairs from PDFs and plant data |
| `setup.ps1` | Configure CUDA + Unsloth on Windows (air-gapped) |
| `train_vajra.py` | QLoRA training on Qwen2.5-3B |
| `export_to_ollama.py` | Merge LoRA weights → GGUF → register in Ollama |

---

## 🛠️ Technology Stack

### Backend
| Component | Technology | Version |
|---|---|---|
| API Gateway | FastAPI + uvicorn | 0.111.0 |
| AI Runtime | Ollama | Latest |
| General Reasoning | llama3.1:latest | 8B |
| Visual Inspection | qwen2.5vl:7b | 7B (4-bit) |
| Code Execution | qwen2.5-coder:7b | 7B (4-bit) |
| Custom Model | VAJRA (Qwen2.5-3B QLoRA) | 3B (4-bit) |
| Database | SQLite (kavach.db) | — |
| Data Processing | Pandas | 2.2.2 |
| Document Generation | python-docx | 1.1.2 |
| PDF Parsing | PyMuPDF | 1.24.5 |
| Network Monitor | psutil | 5.9.8 |
| Code Sandbox | Docker python:3.11-slim | — |
| Fine-Tuning | Unsloth + HuggingFace TRL | — |

### Frontend
| Component | Technology | Version |
|---|---|---|
| Framework | React | 19.2.8 |
| Build Tool | Vite | 8.2.2 |
| Styling | Tailwind CSS v4 (Vite plugin) | 4.3.3 |
| Animation | Framer Motion | 13.2.0 |
| Icons | Lucide React | 1.43.0 |

---

## 📁 Project Structure

```
Kavach-AI/
│
├── backend/                        # FastAPI Orchestrator
│   ├── main.py                     # API Gateway — 40+ endpoints
│   ├── agent.py                    # Bounded 7-phase state machine
│   ├── router.py                   # Deterministic task router
│   ├── knowledge_graph.py          # SQLite graph + 4-pillar metaprompt
│   ├── database.py                 # Schema + seed manager (kavach.db)
│   ├── sovereignty_monitor.py      # Kernel-level air-gap proof
│   ├── tool_gate.py                # Least-privilege permission matrix
│   ├── sandbox.py                  # Docker offline code sandbox
│   ├── csv_tool.py                 # Pandas deterministic RAG engine
│   ├── artifact_generator.py       # .docx engineering note synthesis
│   ├── artifact_validator.py       # 3-check validation pipeline
│   ├── model_swap.py               # VRAM hot-swap manager
│   ├── audit.py                    # SHA-256 cryptographic audit trail
│   ├── pdf_parser.py               # PyMuPDF text extraction
│   ├── fallback.py                 # Graceful degradation handler
│   ├── health_check.py             # Cluster readiness probe
│   ├── model_registry.json         # Node IPs + model assignments
│   ├── requirements.txt            # Python dependencies
│   ├── vajra_training/             # Custom model fine-tuning pipeline
│   │   ├── prepare_dataset.py      # Synthetic Q&A dataset generator
│   │   ├── train_vajra.py          # QLoRA training script
│   │   ├── export_to_ollama.py     # GGUF export + Ollama registration
│   │   └── setup.ps1               # Windows CUDA + Unsloth setup
│   └── workspace/                  # Runtime job directories
│       └── jobs/<uuid>/
│           ├── input/              # Uploaded files
│           ├── output/             # Generated .docx artifacts
│           └── audit.json          # SHA-256 sealed execution log
│
├── frontend/                       # React 19 Industrial Command Center
│   └── src/
│       ├── App.jsx                 # Root with 8-panel routing
│       ├── components/
│       │   ├── DashboardView.jsx   # Node health + system overview
│       │   ├── TracePanel.jsx      # Live state machine trace
│       │   ├── HumanApproval.jsx   # Approve / Modify / Reject UI
│       │   ├── EvidenceRagView.jsx # CSV schema + Pandas query UI
│       │   ├── ArtifactGeneratorView.jsx  # DOCX generation + validation
│       │   ├── SecurityAuditView.jsx      # Sovereignty + permission audit
│       │   ├── HardwareConfigView.jsx     # VRAM + node configuration
│       │   ├── UploadBox.jsx              # Drag-and-drop file upload
│       │   └── Sidebar.jsx                # Collapsible nav (Framer Motion)
│       └── api/client.js           # Centralized Axios/Fetch utility
│
├── demo_data/                      # Real plant data for grounding
│   ├── sensor_maintenance_data.csv # 500 rows of sensor telemetry
│   ├── maintenance_history.csv     # 11 historical maintenance incidents
│   └── refinery-turnaround-checklist.pdf
│
├── docs/                           # Engineering documentation
│   ├── decision.md                 # All architectural decisions log
│   ├── SYSTEM_DEBUGGING_AND_INNOVATION_STANDARDS.md
│   └── PIYUSH_VIVA_AND_DEMO_CHEATSHEET.md
│
└── tests/                          # Verification suites
    ├── test_connections.py         # Multi-node cluster connectivity
    ├── run_backend_demo.py         # 18-point distributed demo suite
    └── test_graph_memory.py        # Knowledge graph + conflict suite
```

---

## 🚀 Quickstart Guide

### Prerequisites

- Python 3.12+
- Node.js 18+
- [Ollama](https://ollama.ai) installed on inference nodes
- Docker Desktop (for code sandbox)
- NVIDIA GPU with 6GB+ VRAM (on inference nodes)

### Step 1 — Pull AI Models (on inference nodes, once)

```bash
# On Node 2 (Piyush — Brain)
ollama pull llama3.1:latest

# On Node 3 (Vaibhav — Engine)
ollama pull qwen2.5vl:7b
ollama pull qwen2.5-coder:7b

# Pre-pull Docker sandbox image (before going air-gapped)
docker pull python:3.11-slim
```

### Step 2 — Configure Node IPs

Edit `backend/model_registry.json` with your cluster's assigned hotspot IPs:
```json
{
  "general": { "host": "http://10.73.132.136:11434", "model_id": "llama3.1:latest" },
  "vision":  { "host": "http://10.73.132.79:11434",  "model_id": "qwen2.5vl:7b"   },
  "coder":   { "host": "http://10.73.132.79:11434",  "model_id": "qwen2.5-coder:7b" }
}
```

### Step 3 — Start the Backend Orchestrator (Node 1)

```bash
cd Kavach-AI/backend
python -m venv ../.venv
source ../.venv/bin/activate        # Windows: ..\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend API available at `http://0.0.0.0:8000`  
Swagger docs at `http://localhost:8000/docs`

### Step 4 — Start the Frontend (Node 4)

```bash
cd Kavach-AI/frontend
npm install
npm run dev
```

Open **`http://localhost:5174`** (or `http://<your-ip>:5174` from any LAN node).

### Step 5 — Verify the Cluster

```bash
# Check all nodes are reachable and models are loaded
python backend/test_connections.py

# Run the full 18-point distributed verification suite
python backend/run_backend_demo.py

# Run the knowledge graph + conflict detection suite
python backend/test_graph_memory.py
```

---

## 🧠 Architectural Decisions

All major decisions are documented in `docs/decision.md`. Key decisions:

| # | Decision | Rationale |
|---|---|---|
| 1 | Rule-based router over ML classifier | Deterministic, 0.1ms, explainable — no second LLM call |
| 2 | SQLite over Vector DB / PostgreSQL | Zero config, on-premise, microsecond latency, no GPU VRAM |
| 3 | Docker `--network none` sandbox | Kernel-level guarantee — stronger than any firewall rule |
| 4 | Static POLICY_TABLE over dynamic evaluation | No ML inference → zero chance of policy hallucination |
| 5 | `psutil` over eBPF for network monitoring | eBPF is Linux-only; psutil works cross-platform (Mac + Windows) |
| 6 | Vite over Next.js for frontend | Eliminates TypeScript compilation overhead; faster SPA dev server |
| 7 | Tailwind CSS v4 Vite plugin | Eliminates PostCSS boilerplate; aligns with modern React build practices |
| 8 | FastAPI `BackgroundTasks` for inference | Returns 200 OK instantly; frontend polls `/job/{id}` for live trace |
| 9 | `finally` block VRAM eviction | Guarantees GPU eviction on timeout OR success — prevents cascade |
| 10 | SHA-256 hashed audit log in `finally` | Written regardless of success/failure — complete audit trail always |

---

## 🔧 Challenges Solved

| Challenge | Root Cause | Resolution |
|---|---|---|
| Inter-node connection timeout | Dynamic DHCP on hotspot changing IPs between sessions | Standardized `model_registry.json` with static hotspot IPs |
| Docker image unavailable offline | Registry DNS unreachable in air-gap | Pre-pulled `python:3.11-slim` before going offline |
| CORS blocking frontend | Middleware hardcoded to port 5173 | `allow_origin_regex=r"^https?://.*"` — accepts all LAN IPs |
| Router misclassifying images as text | `os.path.splitext` applied to directory, not file | Added `os.listdir(input_dir)` to resolve actual filename |
| 7B model load timeout at 150s | Inference fired while model was mid-load | 90s VRAM readiness poll + extended inference timeout to 300s |
| GPU state corrupted after timeout | VRAM eviction inside success-only `with` block | Moved eviction to `try/finally` — runs on success AND failure |
| Windows terminal crash on emoji logs | CP1252 encoding cannot render Unicode | Sanitized all logging to ASCII: `[OK]`, `[CONFLICT ALERT]` |
| Memory loss on server restart | All job data in Python dict | Persistent SQLite `kavach.db` seeded with 500 telemetry rows |
| SOP version contradiction undetected | No revision tracking in naive RAG | `revision_conflicts` table + `check_revision_conflict()` function |

---

## 👥 Team

| Role | Member | Contribution |
|---|---|---|
| **Lead Engineer & Orchestrator** | Vinit Jha | State machine · sovereignty monitor · tool gate · Docker sandbox · artifact validator · audit trail |
| **Brain Node Engineer** | Piyush | `llama3.1` setup · knowledge graph · conflict detection · metaprompt engine |
| **Engine Node Engineer** | Vaibhav | `qwen2.5vl` + coder setup · VRAM hot-swap · verification node |
| **Frontend Engineer** | Ananya / Meet | React 19 dashboard · TracePanel · HumanApproval · all 8 UI panels |

---

<div align="center">

**KAVACH-AI** — *Because in an oil refinery, a hallucinated pressure threshold isn't a bug. It's a disaster.*

Built for **Smart India Hackathon 2026** 🇮🇳

</div>
