"""
Sarasarathi v3.0 — Configuration & Singletons
==========================================
Loads environment variables and initializes shared resources.
"""

import os
from dotenv import load_dotenv
from fastapi import HTTPException
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.chat_models import ChatLiteLLM
from typing import Optional

# ────────────────────────────────────────────────────────────────
# Environment
# ────────────────────────────────────────────────────────────────
load_dotenv()

CHROMA_PERSIST_DIR: str = "./chroma_db"
EMBEDDING_MODEL_NAME: str = "sentence-transformers/all-MiniLM-L6-v2"

# ────────────────────────────────────────────────────────────────
# Singletons — loaded once at startup
# ────────────────────────────────────────────────────────────────
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

def get_llm(model_name: str, api_key: Optional[str] = None, base_url: Optional[str] = None, temperature: float = 0.1, max_tokens: int = 1024) -> ChatLiteLLM:
    """
    Return a ChatLiteLLM instance. Called per-request to ensure dynamic model and token configurations.
    Litellm supports OpenAI, Anthropic, Gemini, Groq, local models (Ollama), etc.
    """
    if not model_name:
        model_name = "gemini/gemini-2.5-flash"  # Fallback model

    return ChatLiteLLM(
        model=model_name,
        api_key=api_key or os.environ.get("API_KEY") or "dummy", # pass dummy for local models
        api_base=base_url if base_url else None,
        temperature=temperature,
        max_tokens=max_tokens,
    )
