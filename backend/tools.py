"""
Sarasarathi v3.0 — Agentic Tools
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


