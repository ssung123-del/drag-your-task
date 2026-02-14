
import React, { useState } from 'react';
import WeekSelector from '../components/WeekSelector';
import { useMinistryStore } from '../store/useMinistryStore';
import { FileText, User, Info } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

const ExportPage: React.FC = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const [isGenerating, setIsGenerating] = useState(false);
    const { user, entries, weeklyPlans, weeklyNotes, profile, updateProfile } = useMinistryStore();

    const weekStr = format(currentWeekStart, 'yyyy-MM-dd');
    const weekEntries = entries.filter((entry) => {
        const entryDate = new Date(entry.date);
        const nextWeekStart = new Date(currentWeekStart);
        nextWeekStart.setDate(currentWeekStart.getDate() + 7);
        return entryDate >= currentWeekStart && entryDate < nextWeekStart;
    });

    const currentPlan = weeklyPlans.find(p => p.weekStartDate === weekStr);
    const currentNote = weeklyNotes.find(n => n.weekStartDate === weekStr);
    const activeProfile = profile || {
        name: user?.displayName || '사역자',
        department: '미지정',
        churchName: '오륜교회'
    };
    const exportReadiness = {
        profileReady: !!activeProfile.name && activeProfile.department !== '미지정',
        hasEntries: weekEntries.length > 0,
        hasPlanOrNote: !!currentPlan || !!currentNote,
    };

    const handleDownload = async () => {
        if (!exportReadiness.profileReady) {
            alert('설정 페이지에서 사역자 정보를 먼저 입력해주세요.');
            return;
        }

        try {
            setIsGenerating(true);
            const { generateHwpx } = await import('../lib/hwpx-export');
            await generateHwpx(
                currentWeekStart,
                weekEntries,
                currentPlan,
                currentNote,
                activeProfile
            );
        } catch (error) {
            console.error('HWPX export failed:', error);
            alert('HWPX 파일 생성 중 오류가 발생했습니다. (템플릿 파일이 public 폴더에 있는지 확인해주세요)');
        } finally {
            setIsGenerating(false);
        }
    };



    return (
        <div className="p-4 space-y-8 max-w-2xl mx-auto pb-24 font-sans leading-relaxed">
            <header className="space-y-2 py-4">
                <h2 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-3">
                    📤 보고서 내보내기
                </h2>
                <p className="text-text-secondary text-sm font-medium">
                    작성한 사역 기록을 오륜교회 양식인 HWPX 파일로 변환하여 다운로드합니다.
                </p>
            </header>

            <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
                <div className="p-8 space-y-8">
                    {/* 정보 안내 카드 */}
                    <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
                                <Info size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-indigo-900">내보내기 정보</h3>
                                <p className="text-sm text-indigo-700/80 leading-relaxed">
                                    설정된 사역자 성함(<span className="font-bold">{profile?.name || user?.displayName || '미지정'}</span>)으로
                                    주간 사역 보고서가 작성됩니다.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="bg-card/50 p-3 rounded-xl border border-indigo-100/30">
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">총 기록수</p>
                                <p className="text-lg font-black text-indigo-900">{entries.length}건</p>
                            </div>
                            <div className="bg-card/50 p-3 rounded-xl border border-indigo-100/30">
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">선택 주차</p>
                                <p className="text-lg font-black text-indigo-900">{format(currentWeekStart, 'M월 d일')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-background rounded-2xl border border-border p-5 space-y-3">
                        <h4 className="text-sm font-bold text-text">내보내기 준비 상태</h4>
                        <ul className="space-y-2 text-sm">
                            <li className={exportReadiness.profileReady ? 'text-emerald-600' : 'text-amber-600'}>
                                {exportReadiness.profileReady ? '✓' : '•'} 사역자 정보 입력
                            </li>
                            <li className={exportReadiness.hasEntries ? 'text-emerald-600' : 'text-amber-600'}>
                                {exportReadiness.hasEntries ? '✓' : '•'} 선택 주차 기록 {weekEntries.length}건
                            </li>
                            <li className={exportReadiness.hasPlanOrNote ? 'text-emerald-600' : 'text-text-secondary'}>
                                {exportReadiness.hasPlanOrNote ? '✓' : '•'} 계획/메모 데이터
                            </li>
                        </ul>
                    </div>

                    {/* 주차 선택기 */}
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-text-secondary ml-1">대상 주차 선택</label>
                        <WeekSelector
                            currentWeekStart={currentWeekStart}
                            onWeekChange={setCurrentWeekStart}
                        />
                    </div>

                    {/* 정보 확인 섹션 */}
                    <div className="bg-background p-6 rounded-2xl border border-border space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <User size={18} className="text-text-secondary" />
                            <span className="font-bold text-text">사역자 정보 확인</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">이름</label>
                                <input
                                    type="text"
                                    value={profile?.name || user?.displayName || ''}
                                    onChange={(e) => updateProfile({ ...(profile || { department: '', churchName: '오륜교회' }), name: e.target.value })}
                                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-text-secondary/50"
                                    placeholder="성함 입력"
                                    aria-label="사역자 이름"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">부서</label>
                                <input
                                    type="text"
                                    value={profile?.department || ''}
                                    onChange={(e) => updateProfile({ ...(profile || { name: user?.displayName || '', churchName: '오륜교회' }), department: e.target.value })}
                                    className="w-full px-4 py-3 bg-card border border-border rounded-xl text-sm text-text focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder:text-text-secondary/50"
                                    placeholder="부서 입력"
                                    aria-label="사역자 부서"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 다운로드 실행 */}
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="w-full bg-[#007AFF] hover:bg-[#0062cc] disabled:bg-blue-300 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <FileText size={24} />
                        {isGenerating ? '생성 중...' : 'HWPX 보고서 다운로드'}
                    </button>

                    <p className="text-center text-xs text-text-secondary font-medium">
                        * "교역자 주간 사역일지" 한글(HWPX) 파일로 저장됩니다.<br />
                        * 오륜교회 정식 양식에 맞춰 자동으로 데이터가 입력됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExportPage;
