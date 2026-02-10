
import React, { useRef } from 'react';
import { useMinistryStore } from '../store/useMinistryStore';
import { Save, Upload, RotateCcw, AlertTriangle } from 'lucide-react';

const SettingsPage: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const state = useMinistryStore();

    const handleBackup = () => {
        const data = JSON.stringify(state, null, 2);
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

        if (!confirm('현재 데이터가 모두 삭제되고 백업 파일로 덮어씌워집니다. 계속하시겠습니까?')) {
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // We need to hydrate the store manually.
                // Zustand persist middleware usually handles hydration, but manual override needs care.
                // The easiest way is to use the store's set state if exposed, or just reload page after clearing storage + setting new.

                // Hacky but reliable way for localStorage persist:
                localStorage.setItem('ministry-store', JSON.stringify({ state: json, version: 0 }));
                window.location.reload();
            } catch (err) {
                alert('올바르지 않은 백업 파일입니다.');
            }
        };
        reader.readAsText(file);
    };

    const handleReset = () => {
        if (confirm('정말 모든 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다!')) {
            localStorage.removeItem('ministry-store');
            window.location.reload();
        }
    };

    return (
        <div className="p-4 space-y-8 max-w-2xl mx-auto pb-24">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                ⚙️ 설정 및 관리
            </h2>

            <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100/50 space-y-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">백업 및 데이터 보호</h3>
                    <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        기기를 변경하거나 데이터 유실을 방지하기 위해 정기적으로 백업하세요. 모든 데이터는 브라우저에 보안 저장됩니다.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleBackup}
                        className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        <Save size={20} />
                        백업 파일 만들기
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all"
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

            <div className="bg-red-50 p-6 rounded-3xl shadow-lg shadow-red-100 border border-red-100 space-y-4">
                <div className="flex items-center gap-2 text-red-700">
                    <AlertTriangle size={24} strokeWidth={2.5} />
                    <h3 className="text-lg font-bold">위험 구역</h3>
                </div>
                <p className="text-sm text-red-600 font-medium leading-relaxed">
                    주의: 앱 초기화 시 모든 기록, 주간 계획, 설정 및 프로필 정보가 영구적으로 삭제됩니다.
                </p>
                <button
                    onClick={handleReset}
                    className="w-full bg-white text-red-600 border border-red-200 hover:bg-red-50 py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all"
                >
                    <RotateCcw size={20} />
                    모든 데이터 초기화
                </button>
            </div>

            <div className="text-center space-y-1 py-8">
                <p className="text-sm font-bold text-gray-400 tracking-wide">DESIGNED FOR 오륜교회</p>
                <p className="text-xs font-semibold text-gray-300 tracking-wider uppercase">Ministry Secretary v1.2.0 PRO MAX</p>
            </div>
        </div>
    );
};

export default SettingsPage;
