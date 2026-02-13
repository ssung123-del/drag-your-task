
import React, { useRef } from 'react';
import { useMinistryStore } from '../store/useMinistryStore';
import { Save, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import type { MinistryEntry, WeeklyNote, WeeklyPlan, UserProfile } from '../types';

type BackupPayload = {
    version: 1;
    createdAt: string;
    data: {
        entries: MinistryEntry[];
        weeklyPlans: WeeklyPlan[];
        weeklyNotes: WeeklyNote[];
        profile: UserProfile | null;
    };
};

const isBackupPayload = (value: unknown): value is BackupPayload => {
    if (!value || typeof value !== 'object') return false;
    const payload = value as Record<string, unknown>;
    if (payload.version !== 1) return false;
    if (!payload.data || typeof payload.data !== 'object') return false;

    const data = payload.data as Record<string, unknown>;
    return (
        Array.isArray(data.entries) &&
        Array.isArray(data.weeklyPlans) &&
        Array.isArray(data.weeklyNotes)
    );
};

const SettingsPage: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const entries = useMinistryStore(state => state.entries);
    const weeklyPlans = useMinistryStore(state => state.weeklyPlans);
    const weeklyNotes = useMinistryStore(state => state.weeklyNotes);
    const profile = useMinistryStore(state => state.profile);
    const clearData = useMinistryStore(state => state.clearData);

    const handleBackup = () => {
        const payload: BackupPayload = {
            version: 1,
            createdAt: new Date().toISOString(),
            data: {
                entries,
                weeklyPlans,
                weeklyNotes,
                profile,
            },
        };

        const data = JSON.stringify(payload, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ministry-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('복원을 진행하면 현재 기록/주간계획/메모/프로필이 백업 파일로 교체됩니다. 계속하시겠습니까?')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const raw = JSON.parse(event.target?.result as string);
                if (!isBackupPayload(raw)) {
                    throw new Error('INVALID_BACKUP_FORMAT');
                }

                useMinistryStore.setState({
                    entries: raw.data.entries,
                    weeklyPlans: raw.data.weeklyPlans,
                    weeklyNotes: raw.data.weeklyNotes,
                    profile: raw.data.profile ?? null,
                });

                alert('백업을 성공적으로 복원했습니다.');
            } catch {
                alert('올바르지 않은 백업 파일입니다.');
            } finally {
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        if (confirm('정말 초기화하시겠습니까?\n영향 범위: 기록, 주간 계획, 메모, 프로필\n이 작업은 되돌릴 수 없습니다.')) {
            clearData();
        }
    };

    return (
        <div className="p-4 space-y-8 max-w-2xl mx-auto pb-24">
            <h2 className="text-2xl font-bold mb-6 text-text flex items-center gap-2">
                ⚙️ 설정 및 관리
            </h2>

            <div className="bg-card p-6 rounded-3xl shadow-xl border border-border space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-text mb-2">백업 및 데이터 보호</h3>
                    <p className="text-sm text-text-secondary leading-relaxed font-medium">
                        기기를 변경하거나 데이터 유실을 방지하기 위해 정기적으로 백업하세요. 모든 데이터는 브라우저에 보안 저장됩니다.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleBackup}
                        className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                        aria-label="백업 파일 만들기"
                    >
                        <Save size={20} />
                        백업 파일 만들기
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-background hover:bg-border text-text-secondary py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all"
                        aria-label="백업 파일 불러오기"
                    >
                        <Upload size={20} />
                        백업 불러오기
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleRestore}
                        className="hidden"
                        accept=".json"
                    />
                </div>
            </div>

            <div className="bg-red-500/10 p-6 rounded-3xl shadow-lg border border-red-500/20 space-y-4">
                <div className="flex items-center gap-2 text-red-500 font-bold">
                    <AlertTriangle size={24} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">위험 구역</h3>
                </div>
                <p className="text-sm text-red-600 font-medium leading-relaxed">
                    주의: 앱 초기화 시 모든 기록, 주간 계획, 설정 및 프로필 정보가 영구적으로 삭제됩니다.
                </p>
                <ul className="text-xs text-red-700/80 list-disc pl-4 space-y-1">
                    <li>사역 기록 {entries.length}건</li>
                    <li>주간 계획 {weeklyPlans.length}건</li>
                    <li>주간 메모 {weeklyNotes.length}건</li>
                    <li>사역자 프로필 {profile ? '1건' : '없음'}</li>
                </ul>
                <button
                    onClick={handleReset}
                    className="w-full bg-card text-red-500 border border-red-500/20 hover:bg-red-500/10 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                    aria-label="모든 데이터 초기화"
                >
                    <RotateCcw size={20} />
                    모든 데이터 초기화
                </button>
            </div>

            <div className="text-center space-y-1 py-8">
                <p className="text-sm font-bold text-text-secondary/50 tracking-wide">DESIGNED FOR 오륜교회</p>
                <p className="text-xs font-semibold text-text-secondary/30 tracking-wider uppercase">Ministry Secretary v1.2.0 PRO MAX</p>
            </div>
        </div>
    );
};

export default SettingsPage;
