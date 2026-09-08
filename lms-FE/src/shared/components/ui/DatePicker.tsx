import React from 'react';
import ReactDatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Calendar } from 'lucide-react';

interface DatePickerProps {
    selected: Date | null;
    onChange: (date: Date | null) => void;
    label?: string;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
    selected,
    onChange,
    label,
    placeholder = "Select date",
    required = false,
    disabled = false
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-1.5 ml-0.5">
                    {label} {required && <span className="text-rose-500">*</span>}
                </label>
            )}
            <div className="relative group">
                <div className={`absolute left-3 top-1/2 -translate-y-1/2 z-10 text-slate-400 group-focus-within:text-indigo-500 transition-colors pointer-events-none ${disabled ? 'opacity-50' : ''}`}>
                    <Calendar className="w-4 h-4" />
                </div>
                <ReactDatePicker
                    selected={selected}
                    onChange={onChange}
                    disabled={disabled}
                    placeholderText={placeholder}
                    dateFormat="MMM d, yyyy"
                    className={`w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm hover:border-slate-300 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed`}
                    wrapperClassName="w-full"
                    calendarClassName="premium-calendar"
                    popperClassName="premium-popper"
                    showPopperArrow={false}
                    portalId="root"
                />
            </div>

            <style>{`
                .premium-popper {
                    z-index: 9999 !important;
                }
                .premium-calendar {
                    border: 1px solid #e2e8f0 !important;
                    border-radius: 12px !important;
                    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1) !important;
                    font-family: inherit !important;
                    padding: 8px !important;
                }
                .react-datepicker__header {
                    background-color: white !important;
                    border-bottom: 1px solid #f1f5f9 !important;
                    padding-bottom: 12px !important;
                    padding-top: 12px !important;
                }
                .react-datepicker__current-month {
                    font-weight: 700 !important;
                    color: #1e293b !important;
                    font-size: 0.95rem !important;
                }
                .react-datepicker__day-name {
                    color: #94a3b8 !important;
                    font-weight: 600 !important;
                }
                .react-datepicker__day {
                    color: #475569 !important;
                    border-radius: 8px !important;
                    transition: all 0.2s !important;
                }
                .react-datepicker__day:hover {
                    background-color: #f1f5f9 !important;
                    color: #6366f1 !important;
                }
                .react-datepicker__day--selected {
                    background-color: #6366f1 !important;
                    color: white !important;
                    box-shadow: 0 4px 6px -1px rgb(99 102 241 / 0.4) !important;
                }
                .react-datepicker__day--keyboard-selected {
                    background-color: #e0e7ff !important;
                    color: #4338ca !important;
                }
                .react-datepicker__navigation {
                    top: 12px !important;
                }
                .react-datepicker__day--outside-month {
                    color: #cbd5e1 !important;
                }
            `}</style>
        </div>
    );
};
