---
title: Sarasarathi
emoji: 🚀
colorFrom: blue
colorTo: indigo
sdk: docker
pinned: false
app_port: 7860
---
# Sarasarathi: The Open Source Notebook LM Alternative

Sarasarathi is an AI-powered research assistant and open-source alternative to Notebook LM. It allows users to upload documents, connect with open-source and proprietary Large Language Models (LLMs), and chat with their knowledge base using advanced Retrieval-Augmented Generation (RAG).

With Sarasarathi, you are not locked into any single ecosystem. You can connect your own API keys for top-tier models (OpenAI, Anthropic, Gemini, Groq, HuggingFace) or connect directly to your local models (Ollama, vLLM, LM Studio) to keep your data completely private. The only limit is your API key or local GPU.

## Key Features

*   **Bring Your Own Model**: Works with any LLM using `litellm` in the backend. Support for OpenAI, Anthropic, Gemini, local models, and more.
*   **Token & Chunking Optimization**: Fine-tune the chunk sizes, overlap, max tokens, and temperature directly from the UI.
*   **Web Integration**: Blend uploaded static PDFs with ephemeral web search results.
*   **Modern Decoupled Architecture**: Fast Next.js + Tailwind CSS + shadcn/ui frontend communicating with a Python FastAPI + LangGraph backend.

## System Architecture

*   **Frontend (Next.js + Tailwind CSS)**: A responsive and accessible UI providing chat interactions, document uploading, model selection, and token optimization settings.
*   **Backend (FastAPI + LangChain + LangGraph + ChromaDB)**: The engine. It provides REST APIs for document ingestion and agentic chat, dynamically swapping inference models using `litellm`.

## Prerequisites
*   Node.js (v18+)
*   Python (3.9+)

## Local Development Setup

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Set up a virtual environment and install dependencies:
    ```bash
    python -m venv venv
    source venv/bin/activate # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    ```
3.  Run the application:
    ```bash
    uvicorn main:app --reload --port 8000
    ```

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Run the development server:
    ```bash
    npm run dev
    ```
