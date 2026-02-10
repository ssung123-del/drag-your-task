
import React, { useState } from 'react';
import WeekSelector from '../components/WeekSelector';
import { useMinistryStore } from '../store/useMinistryStore';
import { generateExcel } from '../lib/excel-export';
import { FileSpreadsheet, User } from 'lucide-react';
import { format, startOfWeek } from 'date-fns';

const ExportPage: React.FC = () => {
    const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
    const { entries, weeklyPlans, weeklyNotes, profile, setProfile } = useMinistryStore();

    const handleDownload = async () => {
        if (!profile.name || !profile.department) {
            alert('사역자 정보(이름, 부서)를 먼저 설정해주세요.');
            return;
        }

        const weekStr = format(currentWeekStart, 'yyyy-MM-dd');

        // Filter data for the selected week
        const weekEntries = entries.filter((entry) => {
            const entryDate = new Date(entry.date);
            const nextWeekStart = new Date(currentWeekStart);
            nextWeekStart.setDate(currentWeekStart.getDate() + 7);
            return entryDate >= currentWeekStart && entryDate < nextWeekStart;
        });

        const currentPlan = weeklyPlans.find(p => p.weekStartDate === weekStr);
        const currentNote = weeklyNotes.find(n => n.weekStartDate === weekStr);

        await generateExcel(
            currentWeekStart,
            weekEntries,
            currentPlan,
            currentNote,
            profile
        );
    };


    return (
        <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                📥 주간 보고서 내보내기
            </h2>

            {/* Week Selection */}
            <WeekSelector
                currentWeekStart={currentWeekStart}
                onWeekChange={setCurrentWeekStart}
            />

            {/* Profile Check */}
            <div className="bg-white p-6 rounded-3xl shadow-xl border border-gray-100/50">
                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <User size={18} /> 사역자 정보 확인
                </h3>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 ml-1">부서</label>
                        <input
                            type="text"
                            value={profile.department}
                            onChange={(e) => setProfile({ department: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-400"
                            placeholder="예: 교구1부"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 ml-1">이름</label>
                        <input
                            type="text"
                            value={profile.name}
                            onChange={(e) => setProfile({ name: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-400"
                            placeholder="예: 홍길동"
                        />
                    </div>
                </div>
                <p className="text-sm text-gray-400 font-medium">* 이 정보는 엑셀 파일 상단에 표시됩니다.</p>
            </div>

            {/* Download Action */}
            <div className="space-y-3 pt-2">
                <button
                    onClick={handleDownload}
                    className="w-full bg-[#34C759] hover:bg-[#2DB34E] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-green-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <FileSpreadsheet size={24} />
                    Excel 다운로드
                </button>
            </div>

            <div className="text-center text-sm text-gray-400 mt-6 font-medium leading-relaxed">
                * "교역자 주간 사역일지" 엑셀 파일로 저장됩니다.<br />
                * 저장된 파일을 PC 카카오톡 등을 통해 전송하세요.
            </div>
        </div>
    );
};

export default ExportPage;
