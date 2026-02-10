
import React, { useState } from 'react';
import WeekSelector from '../components/WeekSelector';
import { useMinistryStore } from '../store/useMinistryStore';
import { format, startOfWeek } from 'date-fns';
import { PLAN_LABELS } from '../types';

const PlansPage: React.FC = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const { weeklyPlans, updateWeeklyPlan, weeklyNotes, updateWeeklyNote } = useMinistryStore();

    const currentPlan = weeklyPlans.find(
        (p) => p.weekStartDate === format(currentWeekStart, 'yyyy-MM-dd')
    ) || { weekStartDate: format(currentWeekStart, 'yyyy-MM-dd'), plans: {} };

    const currentNote = weeklyNotes.find(
        (n) => n.weekStartDate === format(currentWeekStart, 'yyyy-MM-dd')
    ) || { weekStartDate: format(currentWeekStart, 'yyyy-MM-dd'), specialNote: '', dawnPrayerDays: [] };

    const handlePlanChange = (idx: number, content: string) => {
        updateWeeklyPlan(format(currentWeekStart, 'yyyy-MM-dd'), idx, content);
    };

    const handleNoteChange = (content: string) => {
        updateWeeklyNote(
            format(currentWeekStart, 'yyyy-MM-dd'),
            content,
            currentNote.dawnPrayerDays
        );
    };

    const toggleDawnPrayer = (day: string) => {
        const existing = currentNote.dawnPrayerDays;
        const newDays = existing.includes(day)
            ? existing.filter(d => d !== day)
            : [...existing, day].sort((a, b) => {
                const order = ['월', '화', '수', '목', '금'];
                return order.indexOf(a) - order.indexOf(b);
            });

        updateWeeklyNote(
            format(currentWeekStart, 'yyyy-MM-dd'),
            currentNote.specialNote,
            newDays
        );
    };

    return (
        <div className="p-4 space-y-8 max-w-2xl mx-auto pb-24">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                📅 주간 계획 및 메모
            </h2>

            <WeekSelector
                currentWeekStart={currentWeekStart}
                onWeekChange={setCurrentWeekStart}
            />

            {/* Next Week Plans Section */}
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100/50">
                <h3 className="text-lg font-bold mb-4 text-gray-800 flex flex-col gap-1">
                    다음 주간 계획
                    <span className="text-xs font-medium text-gray-400">
                        * 보고서 우측 '다음주간계획' 컬럼 내용입니다.
                    </span>
                </h3>

                <div className="space-y-4">
                    {PLAN_LABELS.map((label, idx) => (
                        <div key={idx} className="space-y-1.5">
                            <label className="block text-sm font-semibold text-gray-700 ml-1">{label}</label>
                            <input
                                type="text"
                                value={currentPlan.plans[idx] || ''}
                                onChange={(e) => handlePlanChange(idx, e.target.value)}
                                className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-400"
                                placeholder={`${label} 계획을 입력하세요`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Special Notes & Dawn Prayer */}
            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100/50">
                <h3 className="text-lg font-bold mb-5 text-gray-800">
                    특이사항 및 새벽예배
                </h3>

                {/* Dawn Prayer */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 ml-1">새벽예배 참석 (월~금)</label>
                    <div className="flex gap-2.5">
                        {['월', '화', '수', '목', '금'].map((day) => (
                            <button
                                key={day}
                                onClick={() => toggleDawnPrayer(day)}
                                className={`flex-1 h-12 rounded-2xl font-bold text-base flex items-center justify-center transition-all active:scale-90 ${currentNote.dawnPrayerDays.includes(day)
                                    ? 'bg-[#007AFF] text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                    <div className="mt-3 flex justify-end">
                        <span className="text-sm font-bold text-[#007AFF] bg-blue-50 px-3 py-1 rounded-full">
                            총 {currentNote.dawnPrayerDays.length}회 참석
                        </span>
                    </div>
                </div>

                {/* Special Note */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 ml-1">특이사항</label>
                    <textarea
                        value={currentNote.specialNote}
                        onChange={(e) => handleNoteChange(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 font-medium h-32 focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none resize-none transition-all placeholder:text-gray-400"
                        placeholder="이번 주 특별한 사역 사항이나 메모를 입력하세요..."
                    />
                </div>
            </div>
        </div>
    );
};

export default PlansPage;
