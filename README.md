# Sarathi: Public Scheme Guide (Decoupled Architecture)

Sarathi is an AI-powered official scheme assistant designed to help users quickly extract answers from official scheme PDF documents. It supports queries in Assamese and English, translating the user's intent to English for the underlying open-source Large Language Models (LLMs) and returning accurate, document-grounded context.

This project was migrated from a Streamlit+Gemini monolith to a modern **Next.js frontend** and **FastAPI backend** utilizing **Hugging Face open-source embeddings and LLMs**.

## System Architecture

The application is decoupled into two primary components:

*   **Frontend (Next.js + Tailwind CSS + shadcn/ui)**: A responsive and accessible UI providing chat interactions, document uploading, Hugging Face API key configuration, and a language toggle for Assamese/English. It connects only to the backend.
*   **Backend (FastAPI + LangChain + ChromaDB)**: The engine. It provides the REST API for processing file uploads (chunking and generating embeddings via HF embedding models) and handles chat interactions via RAG. It dynamically swaps in an Open Source LLM through `HuggingFaceEndpoint` (e.g., Mistral-7B).

## Directory Structure

```text
sarathi_project/
├── backend/
│   ├── main.py              # Main FastAPI application (API routes for upload/chat)
│   ├── requirements.txt     # Python dependencies
│   └── chroma_db/           # Local vector database (created upon PDF upload)
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Main Chat UI and Application Page
│   │   ├── layout.tsx       # Next.js Root Layout
│   │   └── globals.css      # Tailwind & Shadcn styling
│   ├── components/
│   │   └── ui/              # Reusable Shadcn UI components
│   ├── public/              # Static assets
│   ├── next.config.mjs      # Next.js Config
│   ├── tailwind.config.ts   # Tailwind configuration
│   └── package.json         # Node dependencies
└── README.md                # This file
```

## Prerequisites
*   Node.js (v18+)
*   Python (3.9+)
*   Hugging Face Account and Access Token (HF_TOKEN)

## Local Development Setup

### 1. Backend Setup

1.  Navigate to the backend directory:
    ```bash
    cd backend
    ```
2.  Set up a virtual environment and install dependencies:
    ```bash
    virtualenv venv # or python -m venv venv
    source venv/bin/activate # Windows: venv\\Scripts\\activate
    pip install -r requirements.txt
    ```
3.  Run the application:
    ```bash
    uvicorn main:app --reload --port 8000
    ```
    The FastAPI API will run at `http://localhost:8000`.

### 2. Frontend Setup

1.  Navigate to the frontend directory:
    ```bash
    cd frontend
    ```
2.  Install all required NPM packages:
    ```bash
    npm install
    ```
    *(Note: Shadcn UI components are pre-configured through installation)*
3.  Run the Next.js development server:
    ```bash
    npm run dev
    ```
    The Next.js app will run at `http://localhost:3000`.

## API Documentation

The FastAPI application provides two primary endpoints:

### `POST /upload`
Uploads a PDF document, processes its contents, embeds the text using `sentence-transformers/all-MiniLM-L6-v2`, and stores the chunks into Chroma.

*   **Request Body**: Form Data
    *   `file`: The PDF file (type `application/pdf`).
    *   `hf_token`: Your hugging face API token string.
*   **Response**: `200 OK`
    ```json
    {
      "message": "Document processed and stored successfully",
      "chunks": 42
    }
    ```

### `POST /chat`
Accepts a general query, applies translation if Assamese is selected, and retrieves related document chunks from ChromaDB to construct a response with Mistral via HuggingFace Hub.

*   **Request Body**: JSON
    ```json
    {
      "query": "What are the benefits of this scheme?",
      "language": "English",
      "hf_token": "hf_xxxxxxxxxxx"
    }
    ```
    *Options for `language`*: `English`, `Assamese`.
*   **Response**: `200 OK`
    ```json
    {
       "answer": "The benefits of the scheme include...",
       "sources": ["Page 2 of uploaded document", "Page 3 of uploaded document"],
       "english_ref": "Optional english reference if query was an Assamese translation"
    }
    ```
