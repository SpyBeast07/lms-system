import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableItemProps {
    id: string;
    children: React.ReactNode;
    handleClassName?: string;
    className?: string;
}

export const SortableItem: React.FC<SortableItemProps> = ({ id, children, handleClassName, className = '' }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 0,
        opacity: isDragging ? 0.5 : 1,
    };

    const DragHandle = () => (
        <div
            {...attributes}
            {...listeners}
            className={`cursor-grab active:cursor-grabbing p-2 text-slate-400 hover:text-indigo-500 transition-colors ${handleClassName}`}
            title="Drag to reorder"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
        </div>
    );

    return (
        <div ref={setNodeRef} style={style} className={`relative ${className}`}>
            <div className="flex gap-2 items-start">
                <DragHandle />
                <div className="flex-1">
                    {children}
                </div>
            </div>
        </div>
    );
};
