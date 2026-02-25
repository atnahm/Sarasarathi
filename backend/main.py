"""
Sarathi v3.0 — FastAPI Entry Point
====================================
Slim route definitions only. All logic lives in:
  - config.py   → env vars, singletons
  - prompts.py  → system prompts
  - tools.py    → deterministic tools
  - graph.py    → LangGraph state machine
"""

import os
import shutil
import tempfile
from typing import Optional, List

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma

from config import embeddings, CHROMA_PERSIST_DIR
from graph import SarathiState, sarathi_agent
from tools import web_search_opportunities


# ────────────────────────────────────────────────────────────────
# FastAPI App
# ────────────────────────────────────────────────────────────────

app = FastAPI(
    title="Sarathi API",
    description="Agentic RAG backend for Public Scheme Discovery — powered by LangGraph + Groq",
    version="3.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins for the public demo
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Sarathi API is running smoothly!"}


# ────────────────────────────────────────────────────────────────
# Pydantic Models
# ────────────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str


class SourceCandidate(BaseModel):
    id: str
    title: str
    url: str
    snippet: str
    content: str


class ChatRequest(BaseModel):
    query: str
    language: str = "English"  # "English" | "Assamese"
    selected_sources: Optional[List[str]] = None
    user_profile: Optional[dict] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    english_ref: Optional[str] = None


# ────────────────────────────────────────────────────────────────
# Routes
# ────────────────────────────────────────────────────────────────

@app.post("/upload")
async def upload_documents(files: List[UploadFile] = File(...)):
    """
    Upload one or more PDF documents. Chunks are ADDED to ChromaDB (additive).
    Each chunk is tagged with its source filename for attribution.
    Use POST /reset to clear all documents before uploading a fresh set.
    """
    results = []
    total_chunks = 0

    for file in files:
        if file.content_type != "application/pdf":
            results.append({"file": file.filename, "status": "skipped", "reason": "Not a PDF"})
            continue

        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp_path = tmp.name

        try:
            loader = PyPDFLoader(tmp_path)
            docs = loader.load()

            splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
            splits = splitter.split_documents(docs)
            splits = [s for s in splits if s.page_content.strip()]

            if not splits:
                results.append({"file": file.filename, "status": "skipped", "reason": "No extractable text"})
                continue

            doc_name = file.filename or "uploaded_document"
            for chunk in splits:
                chunk.metadata["source_document"] = doc_name

            Chroma.from_documents(
                documents=splits,
                embedding=embeddings,
                persist_directory=CHROMA_PERSIST_DIR,
            )

            total_chunks += len(splits)
            results.append({"file": doc_name, "status": "success", "chunks": len(splits)})

        except Exception as e:
            results.append({"file": file.filename, "status": "error", "reason": str(e)})
        finally:
            os.remove(tmp_path)

    return {
        "message": f"Processed {len(results)} file(s), {total_chunks} total chunks indexed.",
        "chunks": total_chunks,
        "details": results,
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Agentic chat endpoint. Invokes the LangGraph state machine.
    May return a clarification question or a verified answer with sources.
    """
    try:
        initial_state: SarathiState = {
            "user_query": request.query,
            "language": request.language,
            "user_profile": request.user_profile or {},
            "missing_info": [],
            "retrieved_docs": [],
            "ephemeral_context": request.selected_sources or [],
            "eligibility_result": {},
            "final_response": "",
            "sources": [],
        }

        result = sarathi_agent.invoke(initial_state)

        answer = result.get("final_response", "An unexpected error occurred.")
        sources = result.get("sources", [])

        return ChatResponse(
            answer=answer,
            sources=sources,
            english_ref=None,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in agent pipeline: {str(e)}")


@app.post("/reset")
async def reset_database():
    """Clear the ChromaDB vector store by deleting all collections."""
    try:
        import chromadb
        client = chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)
        for col in client.list_collections():
            client.delete_collection(col.name)
        return {"message": "Vector store cleared successfully."}
    except Exception:
        try:
            if os.path.exists(CHROMA_PERSIST_DIR):
                shutil.rmtree(CHROMA_PERSIST_DIR)
            return {"message": "Vector store cleared (force)."}
        except Exception as e2:
            raise HTTPException(status_code=500, detail=f"Error clearing database: {str(e2)}")


@app.post("/search_opportunities", response_model=List[SourceCandidate])
async def search_opportunities(request: SearchRequest):
    """
    Search the open web for opportunities.
    Returns ephemeral source candidates for the frontend curation UI.
    Does NOT save to ChromaDB.
    """
    try:
        results = web_search_opportunities(request.query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during web search: {str(e)}")


@app.post("/add_web_source")
async def add_web_source(candidate: SourceCandidate):
    """
    Takes a single web source candidate, splits its content, 
    and adds it to ChromaDB as a permanent RAG document.
    """
    try:
        from langchain_core.documents import Document
        
        doc = Document(
            page_content=candidate.content, 
            metadata={"source_document": candidate.title, "url": candidate.url}
        )
        
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        splits = splitter.split_documents([doc])
        splits = [s for s in splits if s.page_content.strip()]
        
        if not splits:
            raise HTTPException(status_code=400, detail="No extractable text from web source")

        Chroma.from_documents(
            documents=splits,
            embedding=embeddings,
            persist_directory=CHROMA_PERSIST_DIR,
        )
        
        return {
            "status": "success",
            "file": candidate.title,
            "chunks": len(splits)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
