import React from 'react';
import { useParams, Link } from '@tanstack/react-router';
import { useCourseQuery } from '../../courses/hooks/useCourses';
import { useCourseMaterialsQuery } from '../../materials/hooks/useMaterials';

export const AssignmentDetailPage: React.FC = () => {
    const { courseId, assignmentId } = useParams({ strict: false }) as { courseId: string, assignmentId: string };

    const { data: course, isLoading: isLoadingCourse } = useCourseQuery(courseId);
    const { data: materials, isLoading: isLoadingMaterials } = useCourseMaterialsQuery(courseId);

    if (isLoadingCourse || isLoadingMaterials) return <div className="p-8 text-slate-500 animate-pulse">Loading assignment payload...</div>;

    const assignment = materials?.find((m: any) => m.id.toString() === assignmentId);

    if (!course || !assignment) return <div className="p-8 text-red-500 font-medium bg-red-50 rounded-xl">Assignment not found logically in this matrix.</div>;

    const isOverdue = assignment.due_date ? new Date(assignment.due_date) < new Date() : false;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Link to="/student/courses/$courseId" params={{ courseId }} className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors inline-block">
                ← Back to {course.name}
            </Link>

            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start border-b border-slate-100 pb-6 mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">{assignment.title}</h1>
                        <p className="text-sm text-slate-500 mt-2 bg-slate-100 inline-block px-3 py-1 rounded-md font-medium font-mono">ID: {assignment.id}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-wide">Due Date</p>
                        <p className={`text-lg font-bold ${isOverdue ? 'text-red-600' : 'text-slate-800'}`}>
                            {assignment.due_date ? new Date(assignment.due_date).toLocaleDateString() : 'No Due Date'}
                        </p>
                        <p className="text-sm font-medium text-slate-500 mt-2">Potential Marks: <span className="text-emerald-600 font-bold">{assignment.total_marks || 100}</span></p>
                    </div>
                </div>

                <div className="prose prose-slate max-w-none">
                    <h3 className="text-lg font-bold text-slate-800 mb-3">Assignment Breakdown</h3>
                    <p className="text-slate-600 leading-relaxed">
                        Please submit your assignment via the secure upload portal below. Ensure your responses correspond cleanly to the definitions established during the lecture material.
                        {assignment.assignment_type && (
                            <span className="block mt-4 bg-indigo-50 text-indigo-700 p-3 rounded-lg border border-indigo-100 text-sm font-medium">Evaluation Format: {assignment.assignment_type}</span>
                        )}
                    </p>
                </div>
            </div>

            <div className="bg-slate-50 p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm mx-auto mb-4">📤</div>
                <h3 className="text-xl font-bold text-slate-800">Submit Your Work</h3>
                <p className="text-slate-500 mt-2 max-w-lg mx-auto mb-8">
                    Drag and drop your final PDF/Word document logically here to stage your assignment securely to the processing pipeline.
                </p>

                {/* Visual Placeholder. Backend submission endpoint not built in this Phase. */}
                <div className="max-w-md mx-auto">
                    <input type="file" className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-indigo-50 file:text-indigo-700
                        hover:file:bg-indigo-100 cursor-pointer
                    "/>
                    <button
                        type="button"
                        disabled
                        className="mt-6 w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-slate-300 cursor-not-allowed"
                    >
                        Submission Logic Coming Next Phase
                    </button>
                    <p className="mt-3 text-xs text-slate-400 font-medium">* Student submissions endpoint strictly blocked temporarily.</p>
                </div>
            </div>
        </div>
    );
};
