"""
backend/csv_tool.py — Vinit's Pandas CSV Query Tool (Day 3)

Purpose:
    The AI agent calls query_csv() during the ACT phase to pull structured
    historical data from maintenance_history.csv. This grounds the AI's
    answers in real plant records instead of hallucinated numbers.

Usage by agent.py (Day 4 wiring):
    from csv_tool import query_csv
    result = query_csv(file_path, filters={"Equipment_ID": "PUMP-A"})
"""

import os
import pandas as pd
from typing import Optional


# ─────────────────────────────────────────────
# MAIN QUERY FUNCTION
# ─────────────────────────────────────────────

def query_csv(
    file_path: str,
    filters: Optional[dict] = None,
    columns: Optional[list] = None,
    max_rows: int = 50
) -> dict:
    """
    Loads a CSV file and applies optional filters and column selection.

    Args:
        file_path  : Absolute or relative path to the .csv file.
        filters    : A dict of column->value pairs to filter rows by.
                     Example: {"Equipment_ID": "PUMP-A", "Status": "FAILED"}
        columns    : List of column names to return. Returns all if None.
        max_rows   : Safety cap — never returns more than this many rows
                     to prevent flooding the AI's context window.

    Returns:
        A dict with:
          - "success"  : bool
          - "rows"     : list of row dicts (the actual data)
          - "count"    : how many rows matched
          - "summary"  : a plain-English summary of what was found
          - "error"    : error message if success is False
    """

    # ── 1. Validate the file exists ──────────────────────────────────────
    if not os.path.exists(file_path):
        return {
            "success": False,
            "rows": [],
            "count": 0,
            "summary": "",
            "error": f"File not found: {file_path}"
        }

    if not file_path.lower().endswith(".csv"):
        return {
            "success": False,
            "rows": [],
            "count": 0,
            "summary": "",
            "error": "Only .csv files are supported by this tool."
        }

    # ── 2. Load the CSV ───────────────────────────────────────────────────
    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        return {
            "success": False,
            "rows": [],
            "count": 0,
            "summary": "",
            "error": f"Failed to read CSV: {str(e)}"
        }

    total_rows_loaded = len(df)

    # ── 3. Apply filters ─────────────────────────────────────────────────
    if filters:
        for col, val in filters.items():
            if col not in df.columns:
                return {
                    "success": False,
                    "rows": [],
                    "count": 0,
                    "summary": "",
                    "error": f"Column '{col}' not found in CSV. "
                             f"Available columns: {list(df.columns)}"
                }
            # Case-insensitive string match, passthrough for numbers
            if df[col].dtype == object:
                df = df[df[col].str.strip().str.lower() == str(val).strip().lower()]
            else:
                df = df[df[col] == val]

    matched_rows = len(df)

    # ── 4. Select columns ────────────────────────────────────────────────
    if columns:
        missing = [c for c in columns if c not in df.columns]
        if missing:
            return {
                "success": False,
                "rows": [],
                "count": 0,
                "summary": "",
                "error": f"Requested columns not found: {missing}. "
                         f"Available: {list(df.columns)}"
            }
        df = df[columns]

    # ── 5. Cap rows to protect AI context window ──────────────────────────
    df = df.head(max_rows)

    # ── 6. Build a plain-English summary for the AI to use ───────────────
    filter_desc = ", ".join([f"{k}={v}" for k, v in (filters or {}).items()])
    summary = (
        f"Query on '{os.path.basename(file_path)}': "
        f"Loaded {total_rows_loaded} total rows. "
        f"Filters applied: [{filter_desc or 'none'}]. "
        f"{matched_rows} rows matched. "
        f"Returning top {len(df)} rows."
    )

    return {
        "success": True,
        "rows": df.to_dict(orient="records"),
        "count": len(df),
        "summary": summary,
        "error": None
    }


# ─────────────────────────────────────────────
# HELPER: Get column statistics for numeric columns
# ─────────────────────────────────────────────

def get_csv_stats(file_path: str, column: str) -> dict:
    """
    Returns min, max, mean, and count for a numeric column.
    Useful for questions like "What is the average downtime for Pump A?"

    Args:
        file_path : Path to the .csv file.
        column    : The numeric column to compute stats for.

    Returns:
        A dict with min, max, mean, count, or an error message.
    """
    if not os.path.exists(file_path):
        return {"success": False, "error": f"File not found: {file_path}"}

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        return {"success": False, "error": f"Failed to read CSV: {str(e)}"}

    if column not in df.columns:
        return {
            "success": False,
            "error": f"Column '{column}' not found. Available: {list(df.columns)}"
        }

    col_data = pd.to_numeric(df[column], errors="coerce").dropna()

    if col_data.empty:
        return {"success": False, "error": f"Column '{column}' has no numeric data."}

    return {
        "success": True,
        "column": column,
        "count": int(col_data.count()),
        "min": round(float(col_data.min()), 4),
        "max": round(float(col_data.max()), 4),
        "mean": round(float(col_data.mean()), 4),
        "sum": round(float(col_data.sum()), 4),
    }


# ─────────────────────────────────────────────
# HELPER: List columns in a CSV (for AI planning phase)
# ─────────────────────────────────────────────

def get_csv_schema(file_path: str) -> dict:
    """
    Returns the column names and data types of a CSV.
    Called during the PLAN phase so the AI knows what fields are queryable.
    """
    if not os.path.exists(file_path):
        return {"success": False, "error": f"File not found: {file_path}"}

    try:
        df = pd.read_csv(file_path, nrows=5)  # Only load 5 rows to get schema
    except Exception as e:
        return {"success": False, "error": f"Failed to read CSV: {str(e)}"}

    schema = {col: str(dtype) for col, dtype in df.dtypes.items()}
    return {
        "success": True,
        "file": os.path.basename(file_path),
        "columns": schema,
        "sample_row": df.head(1).to_dict(orient="records")
    }
