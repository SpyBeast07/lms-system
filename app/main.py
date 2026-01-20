from fastapi import FastAPI

app = FastAPI(title="LMS Backend")

@app.get("/hello_world")
def hello_world():
    return {"message": "Hello World"}

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "database": "not connected yet"
    }

# uv run uvicorn app.main:app --reload