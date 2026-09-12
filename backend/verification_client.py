"""
backend/verification_client.py — Kavach-AI Verification Node Client

Sends the primary model's raw output to Vaibhav's GPU-hosted LoRA verification
node (inference_server.py running on 10.73.132.79:8001). The node cross-checks
the AI response for accuracy, safety and domain correctness, then returns either:
  - APPROVED  : output is factually sound — use as-is
  - MODIFIED  : output was improved  — use the node's corrected version
  - REJECTED  : output is unsafe/wrong — fallback to a safe placeholder

If the verification node is unreachable (Vaibhav's PC offline, firewall, etc.)
the function returns the original text unchanged so the pipeline never crashes.
"""

import json
import urllib.request
import urllib.error

# ── Configuration ─────────────────────────────────────────────────────────────
_VERIFICATION_HOST = "http://10.73.132.79:8001"
_VERIFY_ENDPOINT   = f"{_VERIFICATION_HOST}/verify"
_TIMEOUT_SECONDS   = 60   # LoRA inference on RTX 4050 typically takes 5-30 s


def call_verification_node(raw_output: str) -> dict:
    """
    POST the primary model's raw text to the verification node.

    Returns a dict:
      {
        "verified_text"   : str,   # polished/corrected text to use in artifact
        "decision"        : str,   # "APPROVED" | "MODIFIED" | "REJECTED" | "UNREACHABLE"
        "node_response"   : str,   # full raw reply from the verification node
        "error"           : str | None
      }
    """
    if not raw_output or not raw_output.strip():
        return {
            "verified_text": raw_output,
            "decision": "SKIPPED",
            "node_response": "",
            "error": "Empty input — skipping verification."
        }

    payload = json.dumps({"primary_output": raw_output}).encode("utf-8")
    req = urllib.request.Request(
        _VERIFY_ENDPOINT,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=_TIMEOUT_SECONDS) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            node_text: str = data.get("verification_result", "").strip()

            # Parse the DECISION keyword the verification model always appends
            decision = "APPROVED"
            if "DECISION: MODIFIED" in node_text.upper():
                decision = "MODIFIED"
            elif "DECISION: REJECTED" in node_text.upper():
                decision = "REJECTED"

            # For MODIFIED: extract the corrected content the node provides
            # For APPROVED: use original (it passed fact-check)
            # For REJECTED: keep original but flag for human review
            if decision == "MODIFIED":
                # The node rewrites the content above the DECISION line
                lines = node_text.split("\n")
                corrected_lines = [
                    l for l in lines
                    if not l.upper().startswith("DECISION:")
                ]
                verified_text = "\n".join(corrected_lines).strip() or raw_output
            elif decision == "REJECTED":
                # Keep original but prepend a safety warning into the artifact
                verified_text = (
                    "[⚠️ VERIFICATION NODE REJECTED THIS OUTPUT — HUMAN REVIEW REQUIRED]\n\n"
                    + raw_output
                )
            else:
                # APPROVED — original text is factually sound
                verified_text = raw_output

            return {
                "verified_text": verified_text,
                "decision": decision,
                "node_response": node_text,
                "error": None
            }

    except urllib.error.URLError as e:
        # Node is offline or unreachable — degrade gracefully, never crash
        return {
            "verified_text": raw_output,
            "decision": "UNREACHABLE",
            "node_response": "",
            "error": f"Verification node unreachable: {e.reason}"
        }
    except Exception as e:
        return {
            "verified_text": raw_output,
            "decision": "UNREACHABLE",
            "node_response": "",
            "error": f"Unexpected error contacting verification node: {str(e)}"
        }
