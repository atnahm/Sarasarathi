"""
Sarathi v3.0 — Agentic Tools
==============================
Pure Python tools for deterministic operations.
These are NOT LLM-guessed — they run exact logic.
"""

from typing import Any
from duckduckgo_search import DDGS
from langchain_chroma import Chroma

from config import embeddings, CHROMA_PERSIST_DIR


# ────────────────────────────────────────────────────────────────
# Tool 0: Ephemeral Web Search
# ────────────────────────────────────────────────────────────────

def web_search_opportunities(query: str, max_results: int = 5) -> list[dict[str, str]]:
    """
    Search the open web for non-government opportunities, grants, and scholarships.
    Returns ephemeral source candidates.
    """
    results = []
    try:
        with DDGS() as ddgs:
            search_results = list(ddgs.text(query, max_results=max_results))
            for i, res in enumerate(search_results):
                results.append({
                    "id": f"web_source_{i}",
                    "title": res.get("title", "Unknown Title"),
                    "url": res.get("href", ""),
                    "snippet": res.get("body", "")[:150] + "...",
                    "content": res.get("body", "")
                })
    except Exception as e:
        print(f"Error in web search: {e}")
    return results


# ────────────────────────────────────────────────────────────────
# Tool 1: Query ChromaDB
# ────────────────────────────────────────────────────────────────

def query_scheme_database(query: str, profile_filters: dict) -> tuple[list[str], list[str]]:
    """
    Semantic search against ChromaDB.
    Returns (doc_contents, source_citations).
    Profile filters are logged for future metadata filtering.
    """
    vectorstore = Chroma(
        persist_directory=CHROMA_PERSIST_DIR,
        embedding_function=embeddings,
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 6})
    docs = retriever.invoke(query)

    contents: list[str] = [doc.page_content for doc in docs]
    sources: list[str] = list(set(
        f"Page {doc.metadata.get('page', 'N/A')} — {doc.metadata.get('source_document', 'uploaded document')}"
        for doc in docs
    ))
    return contents, sources


# ────────────────────────────────────────────────────────────────
# Tool 2: Deterministic Eligibility Check
# ────────────────────────────────────────────────────────────────

def check_eligibility_math(
    scheme_thresholds: dict[str, dict[str, Any]],
    user_profile: dict[str, Any],
) -> dict[str, Any]:
    """
    Pure Python eligibility verification — no LLM guessing.

    Args:
        scheme_thresholds: {
            "age": {"operator": "<=", "value": 35},
            "income": {"operator": "<=", "value": 250000}
        }
        user_profile: {"age": 28, "income": 180000, ...}

    Returns:
        {
            "has_thresholds": True,
            "checks_run": 2,
            "all_eligible": True,
            "results": {
                "age": {"eligible": True, "user_value": 28, "required": "<= 35.0", "verdict": "PASS"},
                "income": {"eligible": True, "user_value": 180000, "required": "<= 250000.0", "verdict": "PASS"}
            },
            "summary": "Age: PASS (28 <= 35.0) | Income: PASS (180000 <= 250000.0)"
        }
    """
    if not scheme_thresholds:
        return {
            "has_thresholds": False,
            "checks_run": 0,
            "all_eligible": None,
            "results": {},
            "summary": "No numeric eligibility thresholds found in the document.",
        }

    results: dict[str, dict[str, Any]] = {}
    summary_parts: list[str] = []

    OPERATORS = {
        "<=": lambda u, l: u <= l,
        ">=": lambda u, l: u >= l,
        "<":  lambda u, l: u < l,
        ">":  lambda u, l: u > l,
        "==": lambda u, l: u == l,
    }

    for field, threshold in scheme_thresholds.items():
        user_val = user_profile.get(field)

        # User didn't provide this field
        if user_val is None:
            results[field] = {
                "eligible": None,
                "user_value": None,
                "required": f"{threshold.get('operator', '??')} {threshold.get('value', '??')}",
                "verdict": "UNKNOWN — not provided by user",
            }
            summary_parts.append(f"{field.title()}: UNKNOWN (not provided)")
            continue

        # Non-numeric value
        try:
            user_num = float(user_val)
        except (ValueError, TypeError):
            results[field] = {
                "eligible": None,
                "user_value": user_val,
                "required": f"{threshold.get('operator', '??')} {threshold.get('value', '??')}",
                "verdict": "UNKNOWN — non-numeric value",
            }
            summary_parts.append(f"{field.title()}: UNKNOWN (non-numeric)")
            continue

        op = threshold.get("operator", "<=")
        limit = float(threshold.get("value", 0))
        check_fn = OPERATORS.get(op)
        eligible = check_fn(user_num, limit) if check_fn else False
        verdict = "PASS" if eligible else "FAIL"

        results[field] = {
            "eligible": eligible,
            "user_value": user_num,
            "required": f"{op} {limit}",
            "verdict": verdict,
        }
        summary_parts.append(f"{field.title()}: {verdict} ({user_num} {op} {limit})")

    all_known = [r["eligible"] for r in results.values() if r["eligible"] is not None]

    return {
        "has_thresholds": True,
        "checks_run": len(results),
        "all_eligible": all(all_known) if all_known else None,
        "results": results,
        "summary": " | ".join(summary_parts),
    }
