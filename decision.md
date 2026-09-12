# Architectural Decisions Log - Audit & Fail-Safes

## Decision 1: Immutable Cryptographic Audit Trails
* **Context:** The SIH problem statement mandates verifiable proof of sovereign execution without external API calls.
* **Decision:** Implemented `backend/audit.py` to generate SHA-256 hashed JSON execution logs at the completion of every state machine cycle.
* **Reasoning:** By stripping heavy binary data (base64 images) and hashing the pure operational trace, the system provides mathematical proof to auditors that the routing logic, VRAM swaps, and artifact validations occurred deterministically on-premises without subsequent tampering.

## Decision 2: Graceful Degradation of Artifact Generation
* **Context:** The frontend Trace Panel revealed rapid bypass of the `ACT` phase, resulting in generic `.docx` generation.
* **Decision:** Retained the fail-safe injection in `artifact_generator.py` which explicitly stamps "INFERENCE UNAVAILABLE" into the formal document if `agent.py` catches a network or model-loading exception.
* **Reasoning:** In an industrial plant, a false positive is catastrophic. If the Qwen vision node goes offline, generating an explicitly flagged fallback document is strictly safer than allowing the state machine to hang indefinitely or fabricate observations.
