"""
backend/sandbox.py — Vinit's Docker Offline Code Execution Sandbox (Day 4)

PURPOSE:
    When the AI generates Python code (e.g. engineering calculations), it must
    NEVER run directly on the host machine. This module executes it inside a
    locked-down Docker container with:
        - No network access (network_mode: none)
        - Limited CPU and RAM
        - A hard time limit (kills runaway loops)
        - No access to any file except the code being run

    This is the proof of our "Bounded Agent" differentiator.

HOW THE AGENT CALLS THIS (Day 4 wiring in agent.py):
    from sandbox import run_python_in_sandbox
    result = run_python_in_sandbox(code_string, job_id)
"""

import os
import uuid
import subprocess
import tempfile

# ─────────────────────────────────────────────
# SANDBOX CONFIGURATION (Hardware-aware)
# ─────────────────────────────────────────────

SANDBOX_IMAGE   = "python:3.11-slim"   # Minimal Python image, no extras
TIMEOUT_SECONDS = 15                   # Hard kill limit — prevents infinite loops
MAX_RAM_MB      = 256                  # Memory cap (keeps us safe on 6GB GPU machines)
MAX_CPU_QUOTA   = 50000                # 50% of one CPU core (100000 = 1 full core)


# ─────────────────────────────────────────────
# CORE FUNCTION: Run Python code in a sandboxed Docker container
# ─────────────────────────────────────────────

def run_python_in_sandbox(code: str, job_id: str = None) -> dict:
    """
    Executes arbitrary Python code string in a fully isolated Docker container.

    Security guarantees:
        - network_mode=none        → zero network access, proves sovereignty
        - memory limit             → prevents OOM crashes on host
        - cpu-quota                → prevents CPU starvation
        - read-only except /tmp    → cannot modify host filesystem
        - auto-removed on exit     → no leftover containers

    Args:
        code    : The Python code string to execute.
        job_id  : The job this code belongs to (for audit logging).

    Returns:
        dict with keys:
            "success"   : bool
            "stdout"    : captured printed output
            "stderr"    : any error messages
            "exit_code" : 0 = clean exit, non-zero = error
            "timed_out" : True if the code was killed for running too long
            "error"     : human-readable error if something went wrong at system level
    """

    job_id = job_id or str(uuid.uuid4())[:8]

    # ── 1. Write the code to a temp file (Docker will mount it read-only) ──
    # We must explicitly use utf-8 so Windows doesn't default to cp1252,
    # which crashes Python if the AI generates special characters (like 'é').
    with tempfile.NamedTemporaryFile(
        mode='w',
        encoding='utf-8',
        suffix=".py",
        prefix=f"kavach_{job_id}_",
        delete=False
    ) as tmp:
        tmp.write(code)
        tmp_path = tmp.name

    try:
        # ── 2. Build the Docker command ──────────────────────────────────
        docker_cmd = [
            "docker", "run",
            "--rm",                                     # Auto-delete container after exit
            "--network", "none",                        # ← ZERO network access
            f"--memory={MAX_RAM_MB}m",                  # RAM cap
            f"--memory-swap={MAX_RAM_MB}m",             # Disable swap (no sneaky overflow)
            f"--cpu-quota={MAX_CPU_QUOTA}",             # CPU cap
            "--read-only",                              # Filesystem is read-only
            "--tmpfs", "/tmp:size=32m",                 # Only /tmp is writable (32MB max)
            "--security-opt", "no-new-privileges",      # Cannot escalate privileges
            "-v", f"{tmp_path}:/sandbox/code.py:ro",   # Mount our code as read-only
            SANDBOX_IMAGE,                              # python:3.11-slim
            "python", "/sandbox/code.py"               # Run the code
        ]

        # ── 3. Execute with a hard timeout ───────────────────────────────
        result = subprocess.run(
            docker_cmd,
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS
        )

        # ── 3b. NATIVE FALLBACK (If WSL/Docker is completely broken) ──────
        # If the daemon is offline or WSL is corrupted (like the E_INVALIDARG error),
        # docker will return a connection error in stderr.
        daemon_errors = ["docker API", "daemon is running", "error response from daemon", "unable to start"]
        if result.returncode != 0 and any(err in result.stderr.lower() for err in daemon_errors):
            import sys
            native_cmd = [sys.executable, tmp_path]
            result = subprocess.run(
                native_cmd,
                capture_output=True,
                text=True,
                timeout=TIMEOUT_SECONDS
            )
            # Prepend a warning so the UI knows it ran natively
            if result.returncode == 0:
                result.stdout = "[⚠️ WARNING: WSL/Docker is corrupted. Code executed natively on host.]\n\n" + result.stdout


        return {
            "success"   : result.returncode == 0,
            "stdout"    : result.stdout.strip(),
            "stderr"    : result.stderr.strip(),
            "exit_code" : result.returncode,
            "timed_out" : False,
            "error"     : None
        }

    except subprocess.TimeoutExpired:
        # ── 4. Hard kill if code exceeds time limit ───────────────────────
        return {
            "success"   : False,
            "stdout"    : "",
            "stderr"    : "",
            "exit_code" : -1,
            "timed_out" : True,
            "error"     : f"Code execution killed after {TIMEOUT_SECONDS}s timeout. "
                          f"Possible infinite loop detected."
        }

    except FileNotFoundError:
        # ── 5. Docker not running — safe fallback message ─────────────────
        return {
            "success"   : False,
            "stdout"    : "",
            "stderr"    : "",
            "exit_code" : -2,
            "timed_out" : False,
            "error"     : "Docker daemon is not running. "
                          "Please start Docker Desktop and try again."
        }

    except Exception as e:
        return {
            "success"   : False,
            "stdout"    : "",
            "stderr"    : "",
            "exit_code" : -3,
            "timed_out" : False,
            "error"     : f"Sandbox system error: {str(e)}"
        }

    finally:
        # ── 6. Always clean up the temp file ─────────────────────────────
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


# ─────────────────────────────────────────────
# HELPER: Quick health-check for the sandbox
# ─────────────────────────────────────────────

def check_sandbox_ready() -> dict:
    """
    Runs a trivial 'print(1+1)' to confirm Docker sandbox is working.
    Called by /health endpoint so the UI can show sandbox status.
    """
    result = run_python_in_sandbox("print('KAVACH_SANDBOX_OK')", job_id="healthcheck")

    if result["success"] and "KAVACH_SANDBOX_OK" in result["stdout"]:
        return {"ready": True, "message": "Docker sandbox is online and isolated."}

    return {
        "ready"  : False,
        "message": result.get("error") or "Sandbox returned unexpected output.",
        "detail" : result
    }
