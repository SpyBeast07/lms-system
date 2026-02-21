import { api } from '../../shared/api/axios';

interface AIResponse {
    generated_text: string;
}

interface PromptRequest {
    context: string;
}

export const aiApi = {
    // Teacher endpoints
    generateCourseContent: (data: PromptRequest) =>
        api.post<AIResponse>('/ai/course-content', data),

    generateAssignmentInstructions: (data: PromptRequest) =>
        api.post<AIResponse>('/ai/assignment-instructions', data),

    // Student endpoints
    summarizeNotes: (data: PromptRequest) =>
        api.post<AIResponse>('/ai/summarize-notes', data),

    explainTopic: (data: PromptRequest) =>
        api.post<AIResponse>('/ai/explain-topic', data),

    generatePracticeQuestions: (data: PromptRequest) =>
        api.post<AIResponse>('/ai/practice-questions', data),

    // General fallback
    generateRaw: (prompt: string) =>
        api.post<AIResponse>('/ai/generate', { prompt }),
};
