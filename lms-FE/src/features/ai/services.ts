import { aiApi } from './api';

export const aiService = {
    // Teacher services
    generateCourseContent: async (context: string) => {
        const { data } = await aiApi.generateCourseContent({ context });
        return data.generated_text;
    },

    generateAssignmentInst: async (context: string) => {
        const { data } = await aiApi.generateAssignmentInstructions({ context });
        return data.generated_text;
    },

    // Student services
    summarizeNotes: async (context: string) => {
        const { data } = await aiApi.summarizeNotes({ context });
        return data.generated_text;
    },

    explainTopic: async (context: string) => {
        const { data } = await aiApi.explainTopic({ context });
        return data.generated_text;
    },

    generatePractice: async (context: string) => {
        const { data } = await aiApi.generatePracticeQuestions({ context });
        return data.generated_text;
    },

    generateRaw: async (prompt: string) => {
        const { data } = await aiApi.generateRaw(prompt);
        return data.generated_text;
    }
};
