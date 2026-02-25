import os
import shutil
import tempfile
from typing import Optional, List

from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from deep_translator import GoogleTranslator

# LangChain imports
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings, HuggingFaceEndpoint
from langchain_chroma import Chroma
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents.stuff import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain

app = FastAPI(
    title="Sarathi API",
    description="Backend for Sarathi App using Hugging Face Open Source Models",
    version="1.0.0"
)

# CORS configuration to allow local frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Vector store variables
CHROMA_PERSIST_DIR = "./chroma_db"
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

# Generic embeddings instance
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

class ChatRequest(BaseModel):
    query: str
    language: str = "English"  # Options: "English", "Assamese"
    hf_token: str

class ChatResponse(BaseModel):
    answer: str
    sources: List[str]
    english_ref: Optional[str] = None

def get_vectorstore():
    return Chroma(persist_directory=CHROMA_PERSIST_DIR, embedding_function=embeddings)

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    hf_token: str = Form(...)
):
    """
    Upload a PDF document, chunk it, and save embeddings in Chroma DB.
    """
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if hf_token:
        os.environ["HUGGINGFACEHUB_API_TOKEN"] = hf_token
    else:
        raise HTTPException(status_code=400, detail="Hugging Face API token is required.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        shutil.copyfileobj(file.file, tmp)
        tmp_path = tmp.name

    try:
        # Extract text from PDF
        loader = PyPDFLoader(tmp_path)
        docs = loader.load()

        # Chunk the text
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200
        )
        splits = splitter.split_documents(docs)

        # Store in ChromaDB
        Chroma.from_documents(
            documents=splits,
            embedding=embeddings,
            persist_directory=CHROMA_PERSIST_DIR
        )

        return {"message": "Document processed and stored successfully", "chunks": len(splits)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")
    finally:
        os.remove(tmp_path)


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Answer user query using RAG with Hugging Face LLM and Google Translation
    """
    if not request.hf_token:
        raise HTTPException(status_code=400, detail="Hugging Face API token is required.")

    os.environ["HUGGINGFACEHUB_API_TOKEN"] = request.hf_token

    vectorstore = get_vectorstore()
    retriever = vectorstore.as_retriever()
    
    try:
        query_en = request.query
        is_assamese = request.language.lower() == "assamese"
        
        # 1. Translate Assamese to English if needed
        if is_assamese:
            query_en = GoogleTranslator(source='auto', target='en').translate(request.query)

        # 2. Setup LLM and Prompts
        # Using Mistral as requested via HuggingFaceEndpoint
        repo_id = "mistralai/Mistral-7B-Instruct-v0.2"
        llm = HuggingFaceEndpoint(
            repo_id=repo_id,
            temperature=0.1,
            max_new_tokens=512,
            huggingfacehub_api_token=request.hf_token
        )

        system_prompt = (
            "You are an official scheme assistant named Sarathi. "
            "You MUST answer the user's question ONLY using the provided context below. "
            "If the answer is not contained in the context or the context is empty, say exactly: "
            "'Information not found in the official document.'\n\n"
            "Context: {context}"
        )

        prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{input}")
        ])

        qa_chain = create_stuff_documents_chain(llm, prompt)
        rag_chain = create_retrieval_chain(retriever, qa_chain)

        # 3. Invoke Chain
        result = rag_chain.invoke({"input": query_en})
        english_answer = result["answer"].strip()
        source_docs = result.get("context", [])
        
        sources = list(set([
            f"Page {doc.metadata.get('page', 'Unknown')} of uploaded document" 
            for doc in source_docs
        ]))

        # 4. Translate English response back to Assamese if requested
        final_answer = english_answer
        english_ref = None
        
        if is_assamese:
            final_answer = GoogleTranslator(source='en', target='as').translate(english_answer)
            english_ref = english_answer

        return ChatResponse(
            answer=final_answer,
            sources=sources,
            english_ref=english_ref
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating response: {str(e)}")
