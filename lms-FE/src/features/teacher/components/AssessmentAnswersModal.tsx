import React from 'react';
import { Modal } from '../../../shared/components/ui/Modal';
import { useAttemptDetailsQuery } from '../../submissions/hooks/useSubmissions';
import type { AttemptAnswer } from '../../submissions/schemas';

interface AssessmentAnswersModalProps {
    attemptId: number | null;
    studentName: string;
    onClose: () => void;
}

export const AssessmentAnswersModal: React.FC<AssessmentAnswersModalProps> = ({
    attemptId,
    studentName,
    onClose
}) => {
    const { data: attemptDetails, isLoading } = useAttemptDetailsQuery(attemptId || undefined);

    return (
        <Modal
            isOpen={!!attemptId}
            onClose={onClose}
            title={`${studentName}'s Assessment Answers`}
        >
            {isLoading ? (
                <div className="py-8 flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
            ) : !attemptDetails ? (
                <div className="py-8 text-center text-slate-500">Failed to load attempt details.</div>
            ) : (
                <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <div>
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Total Score</p>
                            <p className="text-2xl font-black text-indigo-700">
                                {attemptDetails.total_score} <span className="text-sm font-medium text-indigo-400">/ {attemptDetails.total_marks ?? 100}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Attempt No.</p>
                            <p className="text-lg font-bold text-indigo-700">#{attemptDetails.attempt_number}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {attemptDetails.answers?.map((answer: AttemptAnswer, index: number) => (
                            <div key={answer.question_id} className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                <div className="flex justify-between items-start gap-4">
                                    <h4 className="font-bold text-slate-800 flex gap-2">
                                        <span className="text-slate-400">{index + 1}.</span>
                                        {answer.question?.question_text}
                                    </h4>
                                    <span className="text-xs font-bold bg-white px-2 py-1 rounded-lg border border-slate-200 text-slate-400 uppercase tracking-tight whitespace-nowrap">
                                        Score: {answer.marks_obtained || 0} / {answer.question?.marks || 0}
                                    </span>
                                </div>

                                <div className="mt-4">
                                    {answer.question?.question_type === 'MCQ' ? (
                                        <div className="space-y-2">
                                            {answer.question.options?.map(opt => {
                                                const isSelected = answer.selected_option_ids?.includes(opt.id) || false;
                                                const isCorrect = opt.is_correct;

                                                let bgColor = 'bg-white border-slate-200';
                                                let textColor = 'text-slate-600';

                                                if (isSelected && isCorrect) {
                                                    bgColor = 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-300';
                                                    textColor = 'text-emerald-800 font-medium';
                                                } else if (isSelected && !isCorrect) {
                                                    bgColor = 'bg-rose-50 border-rose-300 ring-1 ring-rose-300';
                                                    textColor = 'text-rose-800 font-medium';
                                                } else if (!isSelected && isCorrect) {
                                                    bgColor = 'bg-emerald-50/50 border-emerald-200 border-dashed';
                                                    textColor = 'text-emerald-700';
                                                }

                                                return (
                                                    <div key={opt.id} className={`p-3 rounded-lg border ${bgColor} flex items-center justify-between`}>
                                                        <span className={textColor}>{opt.option_text}</span>
                                                        <div className="flex gap-2">
                                                            {isSelected && <span className="text-xs font-bold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-100 uppercase">Selected</span>}
                                                            {isCorrect && <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded uppercase">Correct</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <div className="bg-white p-4 rounded-lg border border-slate-200">
                                            <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wider text-[10px]">Student Answer</p>
                                            <p className="text-slate-800 whitespace-pre-wrap">{answer.answer_text || <span className="text-slate-400 italic">No answer provided</span>}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-slate-100 mt-6 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
                >
                    Close Review
                </button>
            </div>
        </Modal>
    );
};
