"""
Sarathi v3.0 — LangGraph State Machine
========================================
5-node agentic graph with deterministic eligibility checking.

Flow:
  analyze_and_extract → decision_router
    ├─ missing info → ask_clarification → END
    └─ ready → retrieve_context → evaluate_eligibility → generate_verified_answer → END
"""

import json
from typing import TypedDict

from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END

from config import get_llm
from prompts import (
    ANALYZE_PROMPT,
    CLARIFICATION_PROMPT,
    ANSWER_PROMPT,
    EXTRACT_THRESHOLDS_PROMPT,
)
from tools import query_scheme_database, check_eligibility_math


# ────────────────────────────────────────────────────────────────
# State Definition
# ────────────────────────────────────────────────────────────────

class SarathiState(TypedDict):
    user_query: str
    language: str                       # "English" | "Assamese"
    user_profile: dict                  # Extracted: age, income, occupation, gender, location
    missing_info: list                  # Fields still needed
    retrieved_docs: list                # Raw doc chunks from ChromaDB
    ephemeral_context: list             # Fetched web sources from frontend
    eligibility_result: dict            # Output from check_eligibility_math
    final_response: str                 # The answer string to return
    sources: list                       # Page citations


# ────────────────────────────────────────────────────────────────
# Node A: Analyze & Extract
# ────────────────────────────────────────────────────────────────

def analyze_and_extract(state: SarathiState) -> SarathiState:
    """
    Parse the user query:
    - Detect language (but keep frontend's choice as authoritative)
    - Extract profile entities (age, income, etc.)
    - Decide if clarification is needed
    """
    llm = get_llm()
    
    # Format the current profile for the prompt
    current_profile = state.get("user_profile", {})
    profile_context = json.dumps(current_profile, ensure_ascii=False) if current_profile else "None provided."

    response = llm.invoke([
        SystemMessage(content=ANALYZE_PROMPT),
        HumanMessage(content=f"PRE-FILLED PROFILE: {profile_context}\n\nUSER MESSAGE: {state['user_query']}"),
    ])

    # Parse JSON from LLM response
    try:
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw)
    except (json.JSONDecodeError, IndexError):
        parsed = {"language": "English", "user_profile": {}, "missing_info": []}

    # Merge extracted profile with existing data
    existing_profile = state.get("user_profile", {}) or {}
    new_profile = parsed.get("user_profile", {})
    for key, val in new_profile.items():
        if val is not None:
            existing_profile[key] = val

    # If frontend provided external sources, load them directly into retrieved_docs
    ephemeral = state.get("ephemeral_context", [])
    
    ephemeral_titles = []
    if ephemeral:
        for doc in ephemeral:
            try:
                first_line = str(doc).split('\n')[0]
                if first_line.startswith("Title: "):
                    ephemeral_titles.append(first_line.replace("Title: ", "").strip())
                else:
                    ephemeral_titles.append("Web Source")
            except:
                ephemeral_titles.append("Web Source")

    return {
        **state,
        # Keep frontend's language setting — do NOT override with LLM detection
        "language": state["language"],
        "user_profile": existing_profile,
        "missing_info": parsed.get("missing_info", []) if not ephemeral else [],
        "retrieved_docs": ephemeral if ephemeral else state.get("retrieved_docs", []),
        "sources": ephemeral_titles if ephemeral else state.get("sources", []),
    }


# ────────────────────────────────────────────────────────────────
# Routing Edge
# ────────────────────────────────────────────────────────────────

def decision_router(state: SarathiState) -> str:
    """Route: ephemeral context bypasses retrieve_context. Missing info → clarify."""
    if state.get("ephemeral_context"):
        return "evaluate_eligibility"
        
    missing = state.get("missing_info", [])
    if missing and len(missing) > 0:
        return "ask_clarification"
    return "retrieve_context"


# ────────────────────────────────────────────────────────────────
# Node B: Ask Clarification
# ────────────────────────────────────────────────────────────────

def ask_clarification(state: SarathiState) -> SarathiState:
    """Generate a conversational question for missing profile data."""
    llm = get_llm()
    prompt = CLARIFICATION_PROMPT.format(
        query=state["user_query"],
        language=state["language"],
        profile=json.dumps(state.get("user_profile", {}), ensure_ascii=False),
        missing=json.dumps(state.get("missing_info", []), ensure_ascii=False),
    )

    response = llm.invoke([SystemMessage(content=prompt)])

    return {
        **state,
        "final_response": response.content.strip(),
        "sources": [],
    }


# ────────────────────────────────────────────────────────────────
# Node C: Retrieve Context
# ────────────────────────────────────────────────────────────────

def retrieve_context(state: SarathiState) -> SarathiState:
    """Query ChromaDB for relevant document chunks."""
    contents, sources = query_scheme_database(
        query=state["user_query"],
        profile_filters=state.get("user_profile", {}),
    )

    return {
        **state,
        "retrieved_docs": contents,
        "sources": sources,
    }


# ────────────────────────────────────────────────────────────────
# Node C-bis: Evaluate Eligibility (NEW — wires the math tool)
# ────────────────────────────────────────────────────────────────

def evaluate_eligibility(state: SarathiState) -> SarathiState:
    """
    Extract numeric thresholds from retrieved docs via LLM,
    then run deterministic check_eligibility_math against user_profile.
    The LLM NEVER does the math — it only extracts thresholds.
    """
    user_profile = state.get("user_profile", {})
    context = "\n\n---\n\n".join(state.get("retrieved_docs", []))

    # Skip if no profile data or no context
    has_numeric_profile = any(
        user_profile.get(f) is not None
        for f in ["age", "income"]
    )
    if not has_numeric_profile or not context.strip():
        return {
            **state,
            "eligibility_result": {
                "has_thresholds": False,
                "checks_run": 0,
                "all_eligible": None,
                "results": {},
                "summary": "No numeric profile data available for eligibility check.",
            },
        }

    # Step 1: Ask LLM to extract thresholds from context (NOT to do math)
    llm = get_llm()
    extraction_prompt = EXTRACT_THRESHOLDS_PROMPT.format(context=context)

    try:
        response = llm.invoke([SystemMessage(content=extraction_prompt)])
        raw = response.content.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        parsed = json.loads(raw)
        thresholds = parsed.get("thresholds", {})
    except (json.JSONDecodeError, IndexError, Exception):
        thresholds = {}

    # Step 2: Run deterministic math tool (pure Python — no LLM)
    eligibility_result = check_eligibility_math(thresholds, user_profile)

    return {
        **state,
        "eligibility_result": eligibility_result,
    }


# ────────────────────────────────────────────────────────────────
# Node D: Generate Verified Answer
# ────────────────────────────────────────────────────────────────

def generate_verified_answer(state: SarathiState) -> SarathiState:
    """
    Synthesize the final answer from retrieved docs + eligibility results.
    The LLM reports the math tool's output as fact — it does NOT recalculate.
    """
    llm = get_llm()
    context = "\n\n---\n\n".join(state.get("retrieved_docs", []))

    if not context.strip():
        disclaimer = (
            "⚠️ Disclaimer: Sarathi provides informational guidance only. "
            "It does not submit applications and offers no legal guarantees regarding eligibility."
        )
        return {
            **state,
            "final_response": f"No relevant information was found in the uploaded documents for your query.\n\n{disclaimer}",
        }

    # Build eligibility section for the prompt
    eligibility_result = state.get("eligibility_result", {})
    eligibility_section = ""
    if eligibility_result.get("has_thresholds"):
        eligibility_section = (
            f"\nELIGIBILITY CHECK RESULTS (from deterministic math tool — treat as DEFINITIVE):\n"
            f"Summary: {eligibility_result.get('summary', 'N/A')}\n"
            f"Overall eligible: {eligibility_result.get('all_eligible', 'Unknown')}\n"
            f"Details: {json.dumps(eligibility_result.get('results', {}), indent=2)}\n"
        )

    prompt = ANSWER_PROMPT.format(
        context=context,
        query=state["user_query"],
        profile=json.dumps(state.get("user_profile", {}), ensure_ascii=False),
        language=state["language"],
        eligibility_section=eligibility_section,
    )

    response = llm.invoke([SystemMessage(content=prompt)])

    return {
        **state,
        "final_response": response.content.strip(),
    }


# ────────────────────────────────────────────────────────────────
# Graph Builder
# ────────────────────────────────────────────────────────────────

def build_sarathi_graph():
    """
    Build and compile the Sarathi state machine.

    Flow:
      analyze_and_extract → decision_router
        ├─ ask_clarification → END
        └─ retrieve_context → evaluate_eligibility → generate_verified_answer → END
    """
    graph = StateGraph(SarathiState)

    # Nodes
    graph.add_node("analyze_and_extract", analyze_and_extract)
    graph.add_node("ask_clarification", ask_clarification)
    graph.add_node("retrieve_context", retrieve_context)
    graph.add_node("evaluate_eligibility", evaluate_eligibility)
    graph.add_node("generate_verified_answer", generate_verified_answer)

    # Entry
    graph.set_entry_point("analyze_and_extract")

    # Conditional routing
    graph.add_conditional_edges(
        "analyze_and_extract",
        decision_router,
        {
            "ask_clarification": "ask_clarification",
            "retrieve_context": "retrieve_context",
            "evaluate_eligibility": "evaluate_eligibility",
        },
    )

    # Linear chain after retrieval
    graph.add_edge("ask_clarification", END)
    graph.add_edge("retrieve_context", "evaluate_eligibility")
    graph.add_edge("evaluate_eligibility", "generate_verified_answer")
    graph.add_edge("generate_verified_answer", END)

    return graph.compile()


# Compile once at module load
sarathi_agent = build_sarathi_graph()
