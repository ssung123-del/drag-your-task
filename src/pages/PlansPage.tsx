
import React, { useState } from 'react';
import WeekSelector from '../components/WeekSelector';
import { useMinistryStore } from '../store/useMinistryStore';
import { format, startOfWeek } from 'date-fns';
import { PLAN_LABELS, type WeeklyPlan, type WeeklyNote } from '../types';

const PlansPage: React.FC = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const { weeklyPlans, updateWeeklyPlan, weeklyNotes, updateWeeklyNote } = useMinistryStore();

    const weekStr = format(currentWeekStart, 'yyyy-MM-dd');

    const currentPlan = weeklyPlans.find(
        (p) => p.weekStartDate === weekStr
    ) || { weekStartDate: weekStr, plans: {} };

    const currentNote = weeklyNotes.find(
        (n) => n.weekStartDate === weekStr
    ) || { weekStartDate: weekStr, specialNote: '', dawnPrayerDays: [] };

    const handlePlanChange = (idx: number, content: string) => {
        const newPlans = { ...currentPlan.plans, [idx]: content };
        updateWeeklyPlan({
            weekStartDate: weekStr,
            plans: newPlans
        } as WeeklyPlan);
    };

    const handleNoteChange = (content: string) => {
        updateWeeklyNote({
            ...currentNote,
            weekStartDate: weekStr,
            specialNote: content
        } as WeeklyNote);
    };

    const toggleDawnPrayer = (day: string) => {
        const existing = currentNote.dawnPrayerDays;
        const newDays = existing.includes(day)
            ? existing.filter(d => d !== day)
            : [...existing, day].sort((a, b) => {
                const order = ['월', '화', '수', '목', '금'];
                return order.indexOf(a) - order.indexOf(b);
            });

        updateWeeklyNote({
            ...currentNote,
            weekStartDate: weekStr,
            dawnPrayerDays: newDays
        } as WeeklyNote);
    };

    return (
        <div className="p-4 space-y-8 max-w-2xl mx-auto pb-24">
            <h2 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-2 py-4">
                📅 계획 및 메모
            </h2>

            <WeekSelector
                currentWeekStart={currentWeekStart}
                onWeekChange={setCurrentWeekStart}
            />

            {/* Next Week Plans Section */}
            <div className="bg-card p-8 rounded-3xl shadow-xl border border-border">
                <div className="mb-6 space-y-1">
                    <h3 className="text-xl font-bold text-text">다음 주간 계획</h3>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        REPORT | Next Week Strategy
                    </p>
                </div>

                <div className="space-y-5">
                    {PLAN_LABELS.map((label, idx) => (
                        <div key={idx} className="space-y-1.5 group">
                            <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                                {label}
                            </label>
                            <input
                                type="text"
                                value={currentPlan.plans[idx] || ''}
                                onChange={(e) => handlePlanChange(idx, e.target.value)}
                                className="w-full px-5 py-3.5 bg-background border border-transparent rounded-2xl text-text font-medium focus:bg-card focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-text-secondary/50 shadow-sm"
                                placeholder={`계획 입력...`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Special Notes & Dawn Prayer */}
            <div className="bg-card p-8 rounded-3xl shadow-xl border border-border">
                <div className="mb-8 space-y-1">
                    <h3 className="text-xl font-bold text-text">특이사항 및 새벽예배</h3>
                    <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        SPIRITUAL | Weekly Focus
                    </p>
                </div>

                {/* Dawn Prayer */}
                <div className="mb-10 p-5 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/20">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-indigo-900 dark:text-indigo-400 ml-1">새벽예배 참석 현황 (월-금)</label>
                        <span className="text-xs font-bold text-indigo-600 bg-card px-3 py-1.5 rounded-full shadow-sm border border-indigo-100 dark:border-indigo-900/40">
                            이번 주 {currentNote.dawnPrayerDays.length}회
                        </span>
                    </div>
                    <div className="flex gap-2.5">
                        {['월', '화', '수', '목', '금'].map((day) => (
                            <button
                                key={day}
                                onClick={() => toggleDawnPrayer(day)}
                                className={`flex-1 h-14 rounded-2xl font-black text-base flex items-center justify-center transition-all active:scale-90 ${currentNote.dawnPrayerDays.includes(day)
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                                    : 'bg-card text-text-secondary hover:bg-background border border-border shadow-sm'
                                    }`}
                            >
                                {day}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Special Note */}
                <div className="space-y-2 group">
                    <label className="block text-[11px] font-bold text-text-secondary uppercase tracking-widest ml-1 transition-colors group-focus-within:text-indigo-600">
                        주의사항 / 기도제목 / 비고
                    </label>
                    <textarea
                        value={currentNote.specialNote}
                        onChange={(e) => handleNoteChange(e.target.value)}
                        className="w-full px-5 py-4 bg-background border border-transparent rounded-2xl text-text font-medium h-40 focus:bg-card focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none transition-all placeholder:text-text-secondary/50 shadow-sm"
                        placeholder="이번 주의 특별한 사역 사항이나 기록할 메모를 입력하세요..."
                    />
                </div>
            </div>
        </div>
    );
};

export default PlansPage;
