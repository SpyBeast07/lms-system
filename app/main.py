from fastapi import FastAPI

app = FastAPI(title="LMS Backend") # Object of fastAPI class

@app.get("/hello_world") # decorator - A function that wraps another function and adds behavior to it.
def hello_world():
    return {"message": "Hello World"}

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "database": "not connected yet"
    }

# uv run uvicorn app.main:app --reload