import { materialsApi } from '../api';
import type { MaterialNote } from '../schemas';

export const uploadMaterialService = {
    uploadNoteWithFile: async (
        teacherId: string,
        file: File,
        noteData: { title: string; course_id: string }
    ): Promise<MaterialNote> => {
        try {
            // Step 1: Upload file to MinIO
            const uploadResponse = await materialsApi.uploadFile(file);

            // Step 2: Create Material Note record with the returned URL
            const noteRecord = await materialsApi.createNote(teacherId, {
                title: noteData.title,
                course_id: noteData.course_id,
                file_url: uploadResponse.file_url
            });

            return noteRecord;
        } catch (error) {
            console.error('Failed to execute full note upload flow:', error);
            throw error;
        }
    }
};
