# Sarathi Backend Startup Script
# Run this from the backend/ directory

# Activate virtual environment (PowerShell syntax)
. .\venv\Scripts\Activate.ps1

# Start the FastAPI server
uvicorn main:app --reload --port 8000
