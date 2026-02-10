
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import WeekSelector from '../components/WeekSelector';
import { useMinistryStore } from '../store/useMinistryStore';
import { startOfWeek, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { BarChart2, Coffee, PhoneCall, TrendingUp, ChevronRight } from 'lucide-react';

const DashboardPage: React.FC = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const { entries } = useMinistryStore();

    const weekEntries = entries.filter((entry) => {
        const entryDate = new Date(entry.date);
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(currentWeekStart.getDate() + 7);
        return entryDate >= currentWeekStart && entryDate < nextWeekStart;
    });

    // Calculate Stats
    const stats = {
        visit: weekEntries.filter(e => e.subType === '방문심방').length,
        cafe: weekEntries.filter(e => e.subType === '카페심방').length,
        phone: weekEntries.filter(e => e.subType === '전화심방').length,
        total: weekEntries.length
    };

    return (
        <div className="p-4 space-y-8 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-text flex items-center gap-2">
                📊 주간 통계
            </h2>

            <WeekSelector
                currentWeekStart={currentWeekStart}
                onWeekChange={setCurrentWeekStart}
            />

            {/* Stats Cards Grid - 모바일 2칸, 태블릿/PC 4칸 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card p-5 rounded-3xl shadow-lg border border-border flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={64} className="text-blue-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <TrendingUp size={20} className="text-blue-500" />
                        </div>
                        <span className="text-sm font-semibold text-text-secondary">방문심방</span>
                    </div>
                    <span className="text-4xl font-bold tracking-tighter text-text">{stats.visit}</span>
                </div>

                <div className="bg-card p-5 rounded-3xl shadow-lg border border-border flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Coffee size={64} className="text-orange-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                            <Coffee size={20} className="text-orange-500" />
                        </div>
                        <span className="text-sm font-semibold text-text-secondary">카페심방</span>
                    </div>
                    <span className="text-4xl font-bold tracking-tighter text-text">{stats.cafe}</span>
                </div>

                <div className="bg-card p-5 rounded-3xl shadow-lg border border-border flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <PhoneCall size={64} className="text-green-500" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-xl">
                            <PhoneCall size={20} className="text-green-500" />
                        </div>
                        <span className="text-sm font-semibold text-text-secondary">전화심방</span>
                    </div>
                    <span className="text-4xl font-bold tracking-tighter text-text">{stats.phone}</span>
                </div>

                <div className="bg-[#007AFF] p-5 rounded-3xl shadow-lg shadow-blue-500/30 border border-blue-500 flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-blue-500/40 transition-all duration-300">
                    <div className="absolute top-0 right-0 p-4 opacity-20 transform scale-110">
                        <BarChart2 size={70} className="text-white" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                            <BarChart2 size={20} className="text-white" />
                        </div>
                        <span className="text-sm font-semibold text-blue-100">전체합계</span>
                    </div>
                    <span className="text-4xl font-bold tracking-tighter text-white">{stats.total}</span>
                </div>
            </div>

            {/* Recent Activity List */}
            <div>
                <div className="flex justify-between items-center mb-4 px-1">
                    <h3 className="text-xl font-bold text-text">📋 주간 기록 ({weekEntries.length})</h3>
                    <Link to="/history" className="text-sm text-[#007AFF] font-bold flex items-center hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-full transition-all">
                        전체보기 <ChevronRight size={16} strokeWidth={3} />
                    </Link>
                </div>

                <div className="space-y-4">
                    {weekEntries.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-12 text-text-secondary bg-card rounded-3xl border-2 border-dashed border-border">
                            <span className="text-4xl mb-2">📭</span>
                            <span className="font-medium text-text-secondary/80">이번 주 기록이 없습니다.</span>
                        </div>
                    ) : (
                        weekEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                            <div key={entry.id} className="bg-card p-5 rounded-3xl shadow-lg border border-border flex flex-col gap-3 transition-transform active:scale-[0.98]">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${entry.category === '심방' ? 'bg-blue-100 text-blue-700' :
                                            entry.category === '업무' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                            }`}>
                                            {entry.subType}
                                        </span>
                                    </div>
                                    <span className="text-xs text-text-secondary font-semibold bg-background px-2 py-1 rounded-lg">
                                        {format(new Date(entry.date), 'M.d(eee)', { locale: ko })} {entry.time}
                                    </span>
                                </div>
                                <p className="text-text text-base font-medium leading-relaxed pl-1">
                                    {entry.content}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
