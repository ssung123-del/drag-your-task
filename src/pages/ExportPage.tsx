
import React, { useState } from 'react';
import WeekSelector from '../components/WeekSelector';
import { useMinistryStore } from '../store/useMinistryStore';
import { generateExcel } from '../lib/excel-export';
import { FileSpreadsheet, User, Info } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

const ExportPage: React.FC = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const { user, entries, weeklyPlans, weeklyNotes, profile, updateProfile } = useMinistryStore();

    const handleDownload = async () => {
        // 프로필 정보가 없으면 기본값 설정
        const activeProfile = profile || {
            name: user?.displayName || '사역자',
            department: '미지정',
            churchName: '오륜교회'
        };

        if (!activeProfile.name || activeProfile.department === '미지정') {
            alert('설정 페이지에서 사역자 정보를 먼저 입력해주세요.');
            return;
        }

        const weekStr = format(currentWeekStart, 'yyyy-MM-dd');

        // 해당 주차의 데이터 필터링
        const weekEntries = entries.filter((entry) => {
            const entryDate = new Date(entry.date);
            const nextWeekStart = new Date(currentWeekStart);
            nextWeekStart.setDate(currentWeekStart.getDate() + 7);
            return entryDate >= currentWeekStart && entryDate < nextWeekStart;
        });

        const currentPlan = weeklyPlans.find(p => p.weekStartDate === weekStr);
        const currentNote = weeklyNotes.find(n => n.weekStartDate === weekStr);

        try {
            await generateExcel(
                currentWeekStart,
                weekEntries,
                currentPlan,
                currentNote,
                activeProfile
            );
        } catch (error) {
            console.error('Excel export failed:', error);
            alert('엑셀 파일 생성 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="p-4 space-y-8 max-w-2xl mx-auto pb-24 font-sans leading-relaxed">
            <header className="space-y-2 py-4">
                <h2 className="text-3xl font-extrabold text-text tracking-tight flex items-center gap-3">
                    📤 데이터 내보내기
                </h2>
                <p className="text-text-secondary text-sm font-medium">
                    작성한 사역 기록을 엑셀 파일로 변환하여 다운로드합니다.
                </p>
            </header>

            <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
                <div className="p-8 space-y-8">
                    {/* 정보 안내 카드 */}
                    <div className="bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/20 space-y-4">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200">
                                <Info size={20} />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-bold text-indigo-900 dark:text-indigo-400">내보내기 정보</h3>
                                <p className="text-sm text-indigo-700/80 dark:text-indigo-300/80 leading-relaxed">
                                    설정된 사역자 성함(<span className="font-bold">{profile?.name || user?.displayName || '미지정'}</span>)으로
                                    주간 사역 보고서가 작성됩니다.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="bg-card/50 p-3 rounded-xl border border-indigo-100/30">
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">총 기록수</p>
                                <p className="text-lg font-black text-indigo-900 dark:text-indigo-400">{entries.length}건</p>
                            </div>
                            <div className="bg-card/50 p-3 rounded-xl border border-indigo-100/30">
                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">선택 주차</p>
                                <p className="text-lg font-black text-indigo-900 dark:text-indigo-400">{format(currentWeekStart, 'M월 d일')}</p>
                            </div>
                        </div>
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
                                />
                            </div>
                        </div>
                    </div>

                    {/* 다운로드 실행 */}
                    <button
                        onClick={handleDownload}
                        className="w-full bg-[#34C759] hover:bg-[#2DB34E] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                    >
                        <FileSpreadsheet size={24} />
                        Excel 보고서 다운로드
                    </button>

                    <p className="text-center text-xs text-text-secondary font-medium">
                        * "교역자 주간 사역일지" 엑셀 파일로 저장됩니다.<br />
                        * 입력하신 정보는 클라우드에 자동으로 안전하게 저장됩니다.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ExportPage;
