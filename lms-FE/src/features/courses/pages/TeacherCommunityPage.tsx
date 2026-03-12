import React, { useState } from 'react';
import { useTeacherCourses } from '../../teacher/hooks/useTeacherCourses';
import { DiscussionPortal } from '../components/DiscussionPortal';
import { Button } from '../../../shared/components/Button';

export const TeacherCommunityPage: React.FC = () => {
    const [page] = useState(1);
    const limit = 50; // Load enough courses for the sidebar
    const { data: coursesData, isLoading, isError } = useTeacherCourses(page, limit);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

    const courses = (coursesData as any)?.items || [];

    // Auto-select the first course if none is selected and data is available
    React.useEffect(() => {
        if (courses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(courses[0].id.toString());
        }
    }, [courses, selectedCourseId]);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Instructor Community Portal</h1>
                <p className="text-sm text-slate-500 mt-1">Engage with your students through announcements and discussions.</p>
            </div>

            <div className="flex flex-1 overflow-hidden bg-white rounded-xl border border-slate-200 shadow-sm">
                {/* Sidebar: Course List */}
                <div className="w-1/3 border-r border-slate-200 bg-slate-50 flex flex-col">
                    <div className="p-4 border-b border-slate-200 bg-white">
                        <h2 className="font-semibold text-slate-700">Your Courses</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {isLoading ? (
                            <div className="p-4 text-center text-slate-500 animate-pulse text-sm">Loading courses...</div>
                        ) : isError ? (
                            <div className="p-4 text-center text-red-500 text-sm">Failed to load courses.</div>
                        ) : courses.length === 0 ? (
                            <div className="p-4 text-center text-slate-500 text-sm italic">You don't have any configured courses yet.</div>
                        ) : (
                            courses.map((course: any) => (
                                <Button
                                    key={course.id}
                                    onClick={() => setSelectedCourseId(course.id.toString())}
                                    variant={selectedCourseId === course.id.toString() ? 'primary' : 'ghost'}
                                    className="w-full justify-start items-start flex-col h-auto py-3 px-4 text-left"
                                >
                                    <div className="truncate font-bold">{course.name}</div>
                                    <div className={`text-[10px] mt-0.5 truncate uppercase tracking-wider ${selectedCourseId === course.id.toString() ? 'text-indigo-100' : 'text-slate-400'}`}>
                                        {course.description || 'No description'}
                                    </div>
                                </Button>
                            ))
                        )}
                    </div>
                </div>

                {/* Main Content: Discussion Portal */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white p-6">
                    {selectedCourseId ? (
                        <DiscussionPortal courseId={selectedCourseId} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <div className="text-4xl mb-4">💬</div>
                            <p>Select a course from the sidebar to view its community.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
