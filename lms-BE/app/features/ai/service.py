import httpx
from fastapi import HTTPException
from app.core.config import settings

class AIService:
    def __init__(self):
        self.provider = getattr(settings, "AI_PROVIDER", "ollama").lower()
        self.ollama_base_url = getattr(settings, "OLLAMA_BASE_URL", "http://localhost:11434/api/generate")
        self.openai_api_key = getattr(settings, "OPENAI_API_KEY", None)

    async def generate_text(self, prompt: str) -> str:
        if self.provider == "ollama":
            return await self._generate_ollama(prompt)
        elif self.provider in ["openai", "gemini"]:
            # Placeholder for OpenAI/Gemini logic
            if not self.openai_api_key:
                raise HTTPException(status_code=500, detail=f"{self.provider.capitalize()} API key not configured")
            return await self._generate_openai_placeholder(prompt)
        else:
            raise HTTPException(status_code=500, detail=f"Unsupported AI provider: {self.provider}")

    async def _generate_ollama(self, prompt: str) -> str:
        # Default model to phi3:mini, could be made configurable in settings
        model = getattr(settings, "OLLAMA_MODEL", "phi3:mini")
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False
        }
        
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(self.ollama_base_url, json=payload)
                response.raise_for_status()
                data = response.json()
                return data.get("response", "")
        except httpx.RequestError as exc:
            raise HTTPException(status_code=503, detail=f"Error connecting to Ollama: {exc}")
        except httpx.HTTPStatusError as exc:
            raise HTTPException(status_code=exc.response.status_code, detail=f"Ollama returned an error: {exc}")

    async def _generate_openai_placeholder(self, prompt: str) -> str:
        # Implementation left for future expansion if requested
        return f"[{self.provider.capitalize()} Placeholder Response] for prompt: {prompt}"

ai_service = AIService()
