"""
Sarathi v3.0 — Configuration & Singletons
==========================================
Loads environment variables and initializes shared resources.
"""

import os
from dotenv import load_dotenv
from fastapi import HTTPException
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq

# ────────────────────────────────────────────────────────────────
# Environment
# ────────────────────────────────────────────────────────────────
load_dotenv()

CHROMA_PERSIST_DIR: str = "./chroma_db"
EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"
GROQ_MODEL: str = "llama-3.3-70b-versatile"

# ────────────────────────────────────────────────────────────────
# Singletons — loaded once at startup
# ────────────────────────────────────────────────────────────────
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)


def get_llm() -> ChatGroq:
    """Return a ChatGroq instance. Called per-request to ensure fresh token."""
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY missing in backend .env file.",
        )
    return ChatGroq(
        model=GROQ_MODEL,
        api_key=api_key,
        temperature=0.1,
        max_tokens=1024,
    )
