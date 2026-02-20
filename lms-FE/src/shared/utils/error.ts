export const getErrorMessage = (error: any, defaultMessage: string = 'An error occurred'): string => {
    if (!error) return defaultMessage;

    // Check if the error has a response object (Axios error)
    if (error.response?.data) {
        const data = error.response.data;

        // Validation errors from FastAPI often come as an array of objects under `detail`
        if (Array.isArray(data.detail)) {
            // Extract the first error message or join them
            return data.detail.map((err: any) => err.msg || 'Validation error').join(', ');
        }

        // If detail is a string, return it directly
        if (typeof data.detail === 'string') {
            return data.detail;
        }

        // Sometimes APIs return message instead of detail
        if (typeof data.message === 'string') {
            return data.message;
        }
    }

    // Fallback to error message if present and not a generic object representation
    if (error.message && typeof error.message === 'string') {
        return error.message;
    }

    return defaultMessage;
};
