import { useMutation } from '@tanstack/react-query';
import { aiService } from './services';
import toast from 'react-hot-toast';

export const useGenerateCourseContent = () => {
    return useMutation({
        mutationFn: (context: string) => aiService.generateCourseContent(context),
        onSuccess: () => {
            toast.success('Course content generated successfully');
        },
        onError: (error: any) => {
            console.error('AI Generation Error:', error);
            toast.error(error?.response?.data?.detail || 'Failed to generate course content');
        },
    });
};

export const useGenerateAssignmentInst = () => {
    return useMutation({
        mutationFn: (context: string) => aiService.generateAssignmentInst(context),
        onSuccess: () => {
            toast.success('Assignment instructions generated successfully');
        },
        onError: (error: any) => {
            console.error('AI Generation Error:', error);
            toast.error(error?.response?.data?.detail || 'Failed to generate assignment instructions');
        },
    });
};


// Student Hooks
export const useSummarizeNotes = () => {
    return useMutation({
        mutationFn: (context: string) => aiService.summarizeNotes(context),
        onSuccess: () => {
            toast.success('Notes summarized successfully');
        },
        onError: (error: any) => {
            console.error('AI Summary Error:', error);
            toast.error(error?.response?.data?.detail || 'Failed to summarize notes');
        },
    });
};

export const useExplainTopic = () => {
    return useMutation({
        mutationFn: (context: string) => aiService.explainTopic(context),
        onSuccess: () => {
            toast.success('Topic explained successfully');
        },
        onError: (error: any) => {
            console.error('AI Explanation Error:', error);
            toast.error(error?.response?.data?.detail || 'Failed to explain topic');
        },
    });
};

export const useGeneratePractice = () => {
    return useMutation({
        mutationFn: (context: string) => aiService.generatePractice(context),
        onSuccess: () => {
            toast.success('Practice questions generated successfully');
        },
        onError: (error: any) => {
            console.error('AI Generation Error:', error);
            toast.error(error?.response?.data?.detail || 'Failed to generate practice questions');
        },
    });
};
