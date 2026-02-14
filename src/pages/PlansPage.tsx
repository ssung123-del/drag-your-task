
import React, { useEffect, useMemo, useState } from 'react';
import WeekSelector from '../components/WeekSelector';
import { useMinistryStore } from '../store/useMinistryStore';
import { format, startOfWeek } from 'date-fns';
import { PLAN_LABELS, type WeeklyPlan, type WeeklyNote } from '../types';

const PlansPage: React.FC = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
    const [planDrafts, setPlanDrafts] = useState<Record<string, string>>({});
    const [noteDraft, setNoteDraft] = useState<string | null>(null);
    const { weeklyPlans, updateWeeklyPlan, weeklyNotes, updateWeeklyNote } = useMinistryStore();

    const weekStr = format(currentWeekStart, 'yyyy-MM-dd');

    const currentPlan = useMemo(
        () =>
            weeklyPlans.find((p) => p.weekStartDate === weekStr) || { weekStartDate: weekStr, plans: {} },
        [weeklyPlans, weekStr],
    );

    const currentNote = useMemo(
        () =>
            weeklyNotes.find((n) => n.weekStartDate === weekStr) || { weekStartDate: weekStr, specialNote: '', dawnPrayerDays: [] },
        [weeklyNotes, weekStr],
    );

    useEffect(() => {
        if (Object.keys(planDrafts).length === 0) return;

        const timer = window.setTimeout(() => {
            const mergedPlans = { ...currentPlan.plans, ...planDrafts };
            const isSamePlan = JSON.stringify(mergedPlans) === JSON.stringify(currentPlan.plans);
            if (isSamePlan) return;

            updateWeeklyPlan({
                weekStartDate: weekStr,
                plans: mergedPlans,
            } as WeeklyPlan);
            setLastSavedAt(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
        }, 300);

        return () => window.clearTimeout(timer);
    }, [planDrafts, currentPlan.plans, updateWeeklyPlan, weekStr]);

    useEffect(() => {
        if (noteDraft === null) return;

        const timer = window.setTimeout(() => {
            if (noteDraft === currentNote.specialNote) return;

            updateWeeklyNote({
                ...currentNote,
                weekStartDate: weekStr,
                specialNote: noteDraft,
            } as WeeklyNote);
            setLastSavedAt(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
        }, 300);

        return () => window.clearTimeout(timer);
    }, [noteDraft, currentNote, updateWeeklyNote, weekStr]);

    const handleWeekChange = (date: Date) => {
        setCurrentWeekStart(date);
        setPlanDrafts({});
        setNoteDraft(null);
    };

    const handlePlanChange = (idx: number, content: string) => {
        setPlanDrafts((prev) => ({ ...prev, [idx]: content }));
    };

    const handleNoteChange = (content: string) => {
        setNoteDraft(content);
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
        setLastSavedAt(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
    };

    return (
        <div className="p-4 space-y-8 max-w-2xl mx-auto pb-24">
            <h2 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-2 py-4">
                📅 계획 및 메모
            </h2>
            {lastSavedAt && (
                <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 inline-flex px-3 py-1 rounded-full">
                    저장됨 · {lastSavedAt}
                </p>
            )}

            <WeekSelector
                currentWeekStart={currentWeekStart}
                onWeekChange={handleWeekChange}
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
                                value={planDrafts[idx] ?? currentPlan.plans[idx] ?? ''}
                                onChange={(e) => handlePlanChange(idx, e.target.value)}
                                className="w-full px-5 py-3.5 bg-background border border-transparent rounded-2xl text-text font-medium focus:bg-card focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-all placeholder:text-text-secondary/50 shadow-sm"
                                placeholder={`계획 입력...`}
                                aria-label={`${label} 계획 입력`}
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
                <div className="mb-10 p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <div className="flex items-center justify-between mb-4">
                        <label className="text-sm font-bold text-indigo-900 ml-1">새벽예배 참석 현황 (월-금)</label>
                        <span className="text-xs font-bold text-indigo-600 bg-card px-3 py-1.5 rounded-full shadow-sm border border-indigo-100">
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
                                aria-pressed={currentNote.dawnPrayerDays.includes(day)}
                                aria-label={`${day} 새벽예배 참석 토글`}
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
                        value={noteDraft ?? currentNote.specialNote}
                        onChange={(e) => handleNoteChange(e.target.value)}
                        className="w-full px-5 py-4 bg-background border border-transparent rounded-2xl text-text font-medium h-40 focus:bg-card focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none transition-all placeholder:text-text-secondary/50 shadow-sm"
                        placeholder="이번 주의 특별한 사역 사항이나 기록할 메모를 입력하세요..."
                        aria-label="특이사항 메모"
                    />
                </div>
            </div>
        </div>
    );
};

export default PlansPage;
