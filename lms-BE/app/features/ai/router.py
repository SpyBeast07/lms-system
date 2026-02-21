from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any
from app.features.auth.dependencies import get_current_user, require_role
from app.features.users.models import User
from app.features.ai.schemas import (
    GenerateRequest,
    TeacherPromptRequest,
    StudentPromptRequest,
    AIResponse
)
from app.features.ai.service import ai_service
import app.features.ai.prompts as prompts

router = APIRouter(prefix="/ai", tags=["AI Assistance"])

# --- Teacher Endpoints ---
@router.post("/course-content", response_model=AIResponse, dependencies=[Depends(require_role("teacher", "super_admin"))])
async def generate_course_content(request: TeacherPromptRequest, current_user: User = Depends(get_current_user)):
    """Generate both course description and learning objectives using AI."""
    prompt_text = prompts.generate_course_content(request.context)
    result = await ai_service.generate_text(prompt_text)
    return AIResponse(generated_text=result)

@router.post("/assignment-instructions", response_model=AIResponse, dependencies=[Depends(require_role("teacher", "super_admin"))])
async def generate_assignment_instructions(request: TeacherPromptRequest, current_user: User = Depends(get_current_user)):
    """Generate standard assignment instructions based on context using AI."""
    prompt_text = prompts.generate_assignment_instructions(request.context)
    result = await ai_service.generate_text(prompt_text)
    return AIResponse(generated_text=result)


# --- Student Endpoints ---
@router.post("/summarize-notes", response_model=AIResponse, dependencies=[Depends(require_role("student", "teacher", "super_admin"))])
async def summarize_notes(request: StudentPromptRequest, current_user: User = Depends(get_current_user)):
    """Summarize a block of notes using AI."""
    prompt_text = prompts.summarize_notes(request.context)
    result = await ai_service.generate_text(prompt_text)
    return AIResponse(generated_text=result)

@router.post("/explain-topic", response_model=AIResponse, dependencies=[Depends(require_role("student", "teacher", "super_admin"))])
async def explain_topic(request: StudentPromptRequest, current_user: User = Depends(get_current_user)):
    """Explain a topic to a student using AI."""
    prompt_text = prompts.explain_topic(request.context)
    result = await ai_service.generate_text(prompt_text)
    return AIResponse(generated_text=result)

@router.post("/practice-questions", response_model=AIResponse, dependencies=[Depends(require_role("student", "teacher", "super_admin"))])
async def generate_practice_questions(request: StudentPromptRequest, current_user: User = Depends(get_current_user)):
    """Generate practice questions based on material/context using AI."""
    prompt_text = prompts.generate_practice_questions(request.context)
    result = await ai_service.generate_text(prompt_text)
    return AIResponse(generated_text=result)

# --- General Generate Endpoint ---
@router.post("/generate", response_model=AIResponse, dependencies=[Depends(get_current_user)])
async def generate_raw(request: GenerateRequest, current_user: User = Depends(get_current_user)):
    """Base API for directly prompting the AI (Authenticated)."""
    result = await ai_service.generate_text(request.prompt)
    return AIResponse(generated_text=result)
