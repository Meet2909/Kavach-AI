"""
backend/tool_gate.py — Vinit's Tool Permission Gate (Day 4)

PURPOSE:
    Before ANY tool (csv_query, run_python, pdf_read, docx_generate) is called
    by the agent, this gate checks whether that tool is ALLOWED for the current
    task type.

    This implements the "Least Privilege Agent" principle:
        - A coding task CANNOT call document-writing tools.
        - A summary task CANNOT execute arbitrary code.
        - High-risk tools (code execution, file write) always require HUMAN_APPROVAL.

    This is one of our 13 core research-backed differentiators.

THREE POSSIBLE VERDICTS:
    ALLOW          → Gate passes, tool runs immediately.
    DENY           → Gate blocks the call, agent logs reason and skips.
    HUMAN_APPROVAL → Gate pauses execution, UI shows [Approve][Modify][Reject].

HOW agent.py WILL CALL THIS (Day 4 wiring):
    from tool_gate import check_permission, Verdict
    verdict = check_permission(task_type="summary", tool_name="run_python")
    if verdict == Verdict.ALLOW:
        run_python_in_sandbox(code)
    elif verdict == Verdict.HUMAN_APPROVAL:
        pause_and_ask_human(...)
    elif verdict == Verdict.DENY:
        log_and_skip(...)
"""

from enum import Enum
from typing import Optional


# ─────────────────────────────────────────────
# VERDICT ENUM
# ─────────────────────────────────────────────

class Verdict(str, Enum):
    ALLOW          = "ALLOW"
    DENY           = "DENY"
    HUMAN_APPROVAL = "HUMAN_APPROVAL"


# ─────────────────────────────────────────────
# POLICY TABLE
# Maps task_type → { tool_name → Verdict }
#
# Rules of thumb used here:
#   - Tools that READ data are generally ALLOW for matching task types.
#   - Tools that WRITE or EXECUTE are HUMAN_APPROVAL (high risk).
#   - Tools that are completely unrelated to the task are DENY.
# ─────────────────────────────────────────────

POLICY_TABLE: dict[str, dict[str, Verdict]] = {

    # ── Task: Summarise a document ───────────────────────────────────────
    "summary": {
        "read_pdf"        : Verdict.ALLOW,
        "query_csv"       : Verdict.ALLOW,
        "get_csv_stats"   : Verdict.ALLOW,
        "get_csv_schema"  : Verdict.ALLOW,
        "run_python"      : Verdict.DENY,           # No code execution needed for summaries
        "write_docx"      : Verdict.HUMAN_APPROVAL, # Writing a file always needs sign-off
        "write_excel"     : Verdict.HUMAN_APPROVAL,
        "write_file"      : Verdict.HUMAN_APPROVAL,
        "vector_search"   : Verdict.ALLOW,
    },

    # ── Task: Write / generate code ──────────────────────────────────────
    "coding": {
        "read_pdf"        : Verdict.ALLOW,           # Can read specs from PDF
        "query_csv"       : Verdict.DENY,            # No tabular data needed for coding
        "get_csv_stats"   : Verdict.DENY,
        "get_csv_schema"  : Verdict.DENY,
        "run_python"      : Verdict.HUMAN_APPROVAL,  # Execution always needs human approval
        "write_docx"      : Verdict.DENY,            # Coding doesn't produce Word docs
        "write_excel"     : Verdict.DENY,
        "write_file"      : Verdict.HUMAN_APPROVAL,  # Saving code to disk needs approval
        "vector_search"   : Verdict.ALLOW,           # Can search internal code docs
    },

    # ── Task: Vision / image / OCR analysis ─────────────────────────────
    "vision": {
        "read_pdf"        : Verdict.ALLOW,
        "query_csv"       : Verdict.DENY,
        "get_csv_stats"   : Verdict.DENY,
        "get_csv_schema"  : Verdict.DENY,
        "run_python"      : Verdict.DENY,
        "write_docx"      : Verdict.HUMAN_APPROVAL,
        "write_excel"     : Verdict.DENY,
        "write_file"      : Verdict.HUMAN_APPROVAL,
        "vector_search"   : Verdict.ALLOW,
    },

    # ── Task: CSV / data analysis query ─────────────────────────────────
    "csv_query": {
        "read_pdf"        : Verdict.DENY,
        "query_csv"       : Verdict.ALLOW,
        "get_csv_stats"   : Verdict.ALLOW,
        "get_csv_schema"  : Verdict.ALLOW,
        "run_python"      : Verdict.DENY,
        "write_docx"      : Verdict.HUMAN_APPROVAL,
        "write_excel"     : Verdict.HUMAN_APPROVAL,
        "write_file"      : Verdict.DENY,
        "vector_search"   : Verdict.DENY,
    },

    # ── Task: Generate a formal approval note / report ───────────────────
    "report": {
        "read_pdf"        : Verdict.ALLOW,
        "query_csv"       : Verdict.ALLOW,
        "get_csv_stats"   : Verdict.ALLOW,
        "get_csv_schema"  : Verdict.ALLOW,
        "run_python"      : Verdict.DENY,
        "write_docx"      : Verdict.HUMAN_APPROVAL,
        "write_excel"     : Verdict.HUMAN_APPROVAL,
        "write_file"      : Verdict.HUMAN_APPROVAL,
        "vector_search"   : Verdict.ALLOW,
    },
}

# Fallback: if a tool is not listed under a task type, DENY by default
DEFAULT_VERDICT = Verdict.DENY


# ─────────────────────────────────────────────
# MAIN FUNCTION
# ─────────────────────────────────────────────

def check_permission(task_type: str, tool_name: str) -> dict:
    """
    Checks the policy table and returns the verdict for a tool call.

    Args:
        task_type : The type of the current job (e.g. "summary", "coding").
        tool_name : The name of the tool the agent wants to call.

    Returns:
        dict with:
          "verdict"     : "ALLOW" | "DENY" | "HUMAN_APPROVAL"
          "task_type"   : echoed back for logging
          "tool_name"   : echoed back for logging
          "reason"      : human-readable explanation (shown in TracePanel)
    """

    task_policy = POLICY_TABLE.get(task_type.lower())

    # Unknown task type — deny everything for safety
    if task_policy is None:
        return {
            "verdict"   : Verdict.DENY,
            "task_type" : task_type,
            "tool_name" : tool_name,
            "reason"    : f"Unknown task type '{task_type}'. All tools blocked by default."
        }

    verdict = task_policy.get(tool_name.lower(), DEFAULT_VERDICT)

    # Build human-readable reason for the TracePanel UI
    reasons = {
        Verdict.ALLOW: (
            f"Tool '{tool_name}' is permitted for task type '{task_type}'."
        ),
        Verdict.DENY: (
            f"Tool '{tool_name}' is not allowed for task type '{task_type}'. "
            f"Least-privilege policy blocked this call."
        ),
        Verdict.HUMAN_APPROVAL: (
            f"Tool '{tool_name}' is a high-risk operation. "
            f"Execution paused — waiting for human [Approve / Modify / Reject]."
        ),
    }

    return {
        "verdict"   : verdict,
        "task_type" : task_type,
        "tool_name" : tool_name,
        "reason"    : reasons[verdict]
    }


# ─────────────────────────────────────────────
# HELPER: List what tools are allowed for a given task
# ─────────────────────────────────────────────

def get_allowed_tools(task_type: str) -> dict:
    """
    Returns all tools and their verdicts for a task type.
    Called during the PLAN phase so the agent knows its own permissions upfront.
    """
    task_policy = POLICY_TABLE.get(task_type.lower())

    if task_policy is None:
        return {
            "task_type" : task_type,
            "tools"     : {},
            "error"     : f"Unknown task type '{task_type}'."
        }

    return {
        "task_type" : task_type,
        "tools"     : {tool: verdict.value for tool, verdict in task_policy.items()}
    }
