
import streamlit as st
import os
import tempfile
from deep_translator import GoogleTranslator

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import ChatPromptTemplate

from langchain.chains.combine_documents.stuff import create_stuff_documents_chain
from langchain.chains.retrieval import create_retrieval_chain

st.set_page_config(page_title="Sarathi: Public Scheme Guide", layout="centered")
st.title("🏛️ Sarathi: Scheme Assistant")
st.markdown(
    "**AI limitations:** This system only reads uploaded official documents. "
    "It does not provide legal advice or submit forms."
)

with st.sidebar:
    st.header("Admin Controls")
    api_key = st.text_input("Gemini API Key", type="password")
    uploaded_file = st.file_uploader("Upload Official Scheme (PDF)", type="pdf")

    if st.button("Secure & Process Document"):
        if uploaded_file and api_key:
            os.environ["GOOGLE_API_KEY"] = api_key

            with st.spinner("Processing document..."):
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    tmp.write(uploaded_file.getvalue())
                    tmp_path = tmp.name

                loader = PyPDFLoader(tmp_path)
                docs = loader.load()

                splitter = RecursiveCharacterTextSplitter(
                    chunk_size=1000,
                    chunk_overlap=200
                )
                splits = splitter.split_documents(docs)

                embeddings = GoogleGenerativeAIEmbeddings(
                    model="models/embedding-001"
                )

                vectorstore = Chroma.from_documents(
                    documents=splits,
                    embedding=embeddings,
                    persist_directory="./chroma_db"
                )

                st.session_state.retriever = vectorstore.as_retriever()
                st.success("Document processed successfully!")

        else:
            st.error("Provide API key and PDF.")

if "messages" not in st.session_state:
    st.session_state.messages = []

for msg in st.session_state.messages:
    with st.chat_message(msg["role"]):
        st.markdown(msg["content"])

user_input = st.chat_input("Ask in Assamese or English...")

if user_input:
    if "retriever" not in st.session_state:
        st.warning("Upload PDF and API key first.")
    else:
        with st.chat_message("user"):
            st.markdown(user_input)

        st.session_state.messages.append(
            {"role": "user", "content": user_input}
        )

        with st.chat_message("assistant"):
            with st.spinner("Searching official document..."):
                try:
                    translated = GoogleTranslator(
                        source="auto",
                        target="en"
                    ).translate(user_input)

                    llm = ChatGoogleGenerativeAI(
                        model="gemini-1.5-pro",
                        temperature=0
                    )

                    system_prompt = (
                        "You are an official scheme assistant. "
                        "Answer ONLY using the context. "
                        "If not found say: Information not found in the official document. "
                        "\n\nContext: {context}"
                    )

                    prompt = ChatPromptTemplate.from_messages([
                        ("system", system_prompt),
                        ("human", "{input}")
                    ])

                    qa_chain = create_stuff_documents_chain(llm, prompt)

                    rag_chain = create_retrieval_chain(
                        st.session_state.retriever,
                        qa_chain
                    )

                    result = rag_chain.invoke({"input": translated})
                    english_answer = result["answer"]

                    assamese = GoogleTranslator(
                        source="en",
                        target="as"
                    ).translate(english_answer)

                    output = f"**Assamese:** {assamese}\n\n---\n*English Ref:* {english_answer}"

                    st.markdown(output)

                    st.session_state.messages.append(
                        {"role": "assistant", "content": output}
                    )

                except Exception as e:
                    st.error(f"Error: {e}")
