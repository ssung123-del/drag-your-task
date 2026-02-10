
import React from 'react';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface WeekSelectorProps {
    currentWeekStart: Date;
    onWeekChange: (date: Date) => void;
}

/**
 * 주간 선택기: 이전/다음 주 이동 + 오늘 주간으로 이동
 * Apple 스타일 디자인 적용
 */
const WeekSelector: React.FC<WeekSelectorProps> = ({ currentWeekStart, onWeekChange }) => {
    const handlePrev = () => onWeekChange(subWeeks(currentWeekStart, 1));
    const handleNext = () => onWeekChange(addWeeks(currentWeekStart, 1));
    const handleToday = () => onWeekChange(startOfWeek(new Date(), { weekStartsOn: 0 }));

    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });

    return (
        <div className="bg-white rounded-2xl shadow-lg shadow-gray-100 border border-gray-100/50 p-4 flex items-center justify-between">
            <button
                onClick={handlePrev}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
            >
                <ChevronLeft size={20} className="text-gray-600" />
            </button>

            <div className="flex flex-col items-center">
                <span className="font-bold text-lg text-gray-900">
                    {format(currentWeekStart, 'M월 d일', { locale: ko })} ~ {format(weekEnd, 'd일', { locale: ko })}
                </span>
                <button
                    onClick={handleToday}
                    className="text-xs text-[#007AFF] mt-1 flex items-center gap-1 font-bold hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-all"
                >
                    <Calendar size={12} />
                    이번 주로 이동
                </button>
            </div>

            <button
                onClick={handleNext}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all active:scale-90"
            >
                <ChevronRight size={20} className="text-gray-600" />
            </button>
        </div>
    );
};

export default WeekSelector;
