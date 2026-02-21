# AI Assistance Module Integration

This document outlines the architecture, setup instructions, and design patterns used for the AI Assistance Module integrated into the LMS system (`lms-BE` and `lms-FE`).

## Overview

The AI Assistance Module provides generative AI capabilities to both Teachers and Students.
- **Teachers** can automatically generate Course Descriptions and step-by-step Assignment Instructions.
- **Students** can generate Study Summaries, Concept Explanations, and Practice Questions.

The system is designed to use **Ollama** (a local LLM runner) by default to prevent API costs and maintain data privacy during development. However, it is built with an abstraction layer that allows easy switching to external providers (like OpenAI or Gemini) securely via environment variables.

## Architecture & Design Patterns

### Backend (`lms-BE/app/features/ai`)

We followed a modular, Clean Architecture approach, placing the AI logic in a dedicated feature directory:
- `schemas.py`: Contains strict Pydantic definitions for incoming AI requests and outgoing `AIResponse` payloads.
- `prompts.py`: Defines the context-injected prompt templates. Prompt logic is separated from routing logic to make it easier to test and modify without touching API behavior.
- `service.py`: Contains the `AIService` class. It uses Python's asynchronous `httpx` client to stream or execute HTTP POST requests against the AI provider. It dynamically switches endpoint logic based on `settings.AI_PROVIDER`.
- `router.py`: Exposes REST endpoints (e.g., `/ai/course-description`, `/ai/summarize-notes`). Each endpoint enforces explicit JWT authentication and Role-Based Access Control (RBAC) dependencies.

### Frontend (`lms-FE/src/features/ai`)

On the React/TypeScript frontend, the AI implementation mimics the existing feature pattern:
- `api.ts`: An Axios abstraction for AI-specific backend routes.
- `services.ts`: A purely data-extraction layer that strips away boilerplate Axios responses to return raw generated strings.
- `hooks.ts`: Utilizes `@tanstack/react-query` to provide `useMutation` hooks. These hooks automatically integrate with the application's global `useToastStore` to provide generic Error and Success notifications without burdening the UI components.

## Setup Instructions

### 1. Download and Install Ollama
Download Ollama from [ollama.com](https://ollama.com) and install it on your host machine.

### 2. Pull the AI Model
Open a terminal and pull the Llama 3 model (or any preferred text-generation model):
```bash
ollama run llama3
```
*Note: Make sure the Ollama daemon is running in the background and listening on port `11434`.*

### 3. Environment Variables
In your `lms-BE/.env` file, ensure the following configuration defaults are set:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434/api/generate
OLLAMA_MODEL=llama3
```

*(Optional) Switching to OpenAI:*
If you decide to deploy this to production and wish to use OpenAI instead:
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-real-api-key-here
```
*(You will also need to update `service.py` to route to the official OpenAI python SDK or HTTP endpoints).*

## UI/UX Choices

- **Non-blocking Loading:** The UI utilizes `react-query`'s `isPending` state to show loading spinners inside interactive Modals. The user is not blocked from traversing the app.
- **Markdown Rendered:** All AI responses in the Student module use `react-markdown` to properly format generated lists and bolded text natively in the browser.
- **Editable Auto-Fills:** For Teachers creating courses and assignments, the exact AI generated text is injected into traditional `<textarea>` elements, allowing the Teacher to treat the AI output as an editable first draft before officially publishing the form via React Hook Form's `setValue`.
- **Global Toasts:** Connectivity errors (e.g., Ollama is not running) surface cleanly as user-facing toast notifications.
