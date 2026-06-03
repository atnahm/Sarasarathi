"""
Sarasarathi v3.0 — LangGraph State Machine
========================================
5-node agentic graph with deterministic eligibility checking.

Flow:
  analyze_and_extract → decision_router
    ├─ missing info → ask_clarification → END
"""

import json
from typing import TypedDict, Optional

from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END

from config import get_llm
from prompts import (
    ANALYZE_PROMPT,
    CLARIFICATION_PROMPT,
    ANSWER_PROMPT,
    EXTRACT_THRESHOLDS_PROMPT,
)
from tools import query_scheme_database


# ────────────────────────────────────────────────────────────────
# State Definition
# ────────────────────────────────────────────────────────────────

class SarasarathiState(TypedDict):
    user_query: str
    language: str                       # "English" | "Assamese"
    user_profile: dict                  # Extracted: age, income, occupation, gender, location
    missing_info: list                  # Fields still needed
    retrieved_docs: list                # Raw doc chunks from ChromaDB
    ephemeral_context: list             # Fetched web sources from frontend
    final_response: str                 # The answer string to return
    sources: list                       # Page citations

    # Model configuration
    model_name: str
    api_key: Optional[str]
    base_url: Optional[str]
    temperature: float
    max_tokens: int


# ────────────────────────────────────────────────────────────────
# Node A: Analyze & Extract
# ────────────────────────────────────────────────────────────────

def analyze_and_extract(state: SarasarathiState) -> SarasarathiState:
    """
    Parse the user query:
    - Detect language (but keep frontend's choice as authoritative)
    - Extract profile entities (age, income, etc.)
    - Decide if clarification is needed
    """
    llm = get_llm(
        model_name=state.get("model_name", "gemini/gemini-2.5-flash"),
        api_key=state.get("api_key"),
        base_url=state.get("base_url"),
        temperature=state.get("temperature", 0.1),
        max_tokens=state.get("max_tokens", 1024),
    )
    
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

def decision_router(state: SarasarathiState) -> str:
    """Route: ephemeral context bypasses retrieve_context. Missing info → clarify."""
    if state.get("ephemeral_context"):
        return "generate_verified_answer"
        
    missing = state.get("missing_info", [])
    if missing and len(missing) > 0:
        return "ask_clarification"
    return "retrieve_context"


# ────────────────────────────────────────────────────────────────
# Node B: Ask Clarification
# ────────────────────────────────────────────────────────────────

def ask_clarification(state: SarasarathiState) -> SarasarathiState:
    """Generate a conversational question for missing profile data."""
    llm = get_llm(
        model_name=state.get("model_name", "gemini/gemini-2.5-flash"),
        api_key=state.get("api_key"),
        base_url=state.get("base_url"),
        temperature=state.get("temperature", 0.1),
        max_tokens=state.get("max_tokens", 1024),
    )
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

def retrieve_context(state: SarasarathiState) -> SarasarathiState:
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
# Node D: Generate Verified Answer
# ────────────────────────────────────────────────────────────────

def generate_verified_answer(state: SarasarathiState) -> SarasarathiState:
    """
    Synthesize the final answer from retrieved docs.
    """
    llm = get_llm(
        model_name=state.get("model_name", "gemini/gemini-2.5-flash"),
        api_key=state.get("api_key"),
        base_url=state.get("base_url"),
        temperature=state.get("temperature", 0.1),
        max_tokens=state.get("max_tokens", 1024),
    )
    context = "\n\n---\n\n".join(state.get("retrieved_docs", []))

    if not context.strip():
        disclaimer = (
            "⚠️ Disclaimer: Sarasarathi provides informational guidance based on provided documents only."
        )
        return {
            **state,
            "final_response": f"No relevant information was found in the uploaded documents for your query.\n\n{disclaimer}",
        }

    prompt = ANSWER_PROMPT.format(
        context=context,
        query=state["user_query"],
        profile=json.dumps(state.get("user_profile", {}), ensure_ascii=False),
        language=state["language"],
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
    Build and compile the Sarasarathi state machine.

    Flow:
      analyze_and_extract → decision_router
        ├─ ask_clarification → END
    """
    graph = StateGraph(SarasarathiState)

    # Nodes
    graph.add_node("analyze_and_extract", analyze_and_extract)
    graph.add_node("ask_clarification", ask_clarification)
    graph.add_node("retrieve_context", retrieve_context)
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
            "generate_verified_answer": "generate_verified_answer",
        },
    )

    # Linear chain after retrieval
    graph.add_edge("ask_clarification", END)
    graph.add_edge("retrieve_context", "generate_verified_answer")
    graph.add_edge("generate_verified_answer", END)

    return graph.compile()


# Compile once at module load
sarathi_agent = build_sarathi_graph()
