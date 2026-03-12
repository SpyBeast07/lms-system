from pydantic import BaseModel, Field

class GenerateRequest(BaseModel):
    prompt: str = Field(..., description="The direct prompt to send to the AI")

class TeacherPromptRequest(BaseModel):
    context: str = Field(..., description="The context or topic to generate content for")

class StudentPromptRequest(BaseModel):
    context: str = Field(..., description="The context, topic, or notes to process")

class AIResponse(BaseModel):
    generated_text: str = Field(..., description="The generated response from the AI")
