import React, { useState, useMemo } from 'react';
import { useMinistryStore } from '../store/useMinistryStore';
import { type Sheep } from '../types';
import { 
    Plus, Search, Phone, Heart, 
    Trash2, Edit2, X, Clock, 
    MessageSquare, ChevronRight
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

const ShepherdingPage: React.FC = () => {
    const { sheep, entries, addSheep, updateSheep, deleteSheep } = useMinistryStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSheep, setSelectedSheep] = useState<Sheep | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [department, setDepartment] = useState('');
    const [prayerRequest, setPrayerRequest] = useState('');

    // 검색 및 정렬된 성도 리스트
    const filteredSheep = useMemo(() => {
        let result = [...sheep];
        if (searchTerm.trim()) {
            const query = searchTerm.toLowerCase();
            result = result.filter(s => 
                s.name.toLowerCase().includes(query) || 
                (s.department && s.department.toLowerCase().includes(query)) ||
                (s.phone && s.phone.includes(query))
            );
        }

        // 최종 심방 정보 추가 계산을 위해 데코레이팅
        return result.map(s => {
            const related = entries.filter(e => 
                (e.taggedSheepIds?.includes(s.id)) || 
                (e.content.includes(s.name) && (e.category === '심방'))
            );
            const lastDate = related.length > 0 
                ? new Date(Math.max(...related.map(e => new Date(e.date).getTime())))
                : null;
            return {
                ...s,
                lastCareDate: lastDate ? format(lastDate, 'yyyy-MM-dd') : null,
                careCount: related.length
            };
        });
    }, [sheep, entries, searchTerm]);

    // 선택된 성도의 상세 심방 기록 타임라인
    const selectedSheepHistory = useMemo(() => {
        if (!selectedSheep) return [];
        return entries
            .filter(e => 
                (e.taggedSheepIds?.includes(selectedSheep.id)) || 
                (e.content.includes(selectedSheep.name) && e.category === '심방')
            )
            .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
    }, [selectedSheep, entries]);

    const handleAddSheep = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        await addSheep({
            name,
            phone: phone || undefined,
            department: department || undefined,
            prayerRequest: prayerRequest || undefined
        });

        // Reset
        setName('');
        setPhone('');
        setDepartment('');
        setPrayerRequest('');
        setIsAddModalOpen(false);
    };

    const handleEditSheep = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSheep || !name.trim()) return;

        await updateSheep(selectedSheep.id, {
            name,
            phone: phone || undefined,
            department: department || undefined,
            prayerRequest: prayerRequest || undefined
        });

        setSelectedSheep({
            ...selectedSheep,
            name,
            phone: phone || undefined,
            department: department || undefined,
            prayerRequest: prayerRequest || undefined
        });

        setIsEditModalOpen(false);
    };

    const handleDeleteSheep = async (id: string) => {
        if (confirm("정말 이 성도 정보를 삭제하시겠습니까? 관련 태깅 이력은 유지되지만 수첩 목록에서 사라집니다.")) {
            await deleteSheep(id);
            setSelectedSheep(null);
        }
    };

    const openEditModal = (s: Sheep) => {
        setName(s.name);
        setPhone(s.phone || '');
        setDepartment(s.department || '');
        setPrayerRequest(s.prayerRequest || '');
        setIsEditModalOpen(true);
    };

    const getCareStatus = (lastDateStr: string | null) => {
        if (!lastDateStr) return { label: '심방 기록 없음', color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', isAlert: true };
        const days = differenceInDays(new Date(), new Date(lastDateStr));
        if (days > 30) {
            return { label: `심방 공백 ${days}일째`, color: 'text-red-500 bg-red-500/10 border-red-500/20', isAlert: true };
        }
        return { label: `최근 케어 (${days}일 전)`, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', isAlert: false };
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* === 성도 목록 영역 (좌측) === */}
            <div className="flex-1 bg-card border border-border rounded-3xl p-5 flex flex-col h-full overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-black text-text flex items-center gap-2">
                            🐑 목양 수첩
                            <span className="text-xs font-bold px-2 py-0.5 bg-indigo-500/10 text-indigo-500 rounded-full">
                                {sheep.length}명
                            </span>
                        </h2>
                        <p className="text-xs text-text-secondary mt-0.5">성도 리스트 및 심방 공백을 모니터링합니다.</p>
                    </div>
                    <button
                        onClick={() => {
                            setName('');
                            setPhone('');
                            setDepartment('');
                            setPrayerRequest('');
                            setIsAddModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
                    >
                        <Plus size={14} />
                        성도 추가
                    </button>
                </div>

                {/* 검색 바 */}
                <div className="relative mb-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" size={16} />
                    <input
                        type="text"
                        placeholder="이름, 소속, 전화번호로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all text-text"
                    />
                    {searchTerm && (
                        <button 
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* 성도 카드 리스트 */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {filteredSheep.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <span className="text-3xl mb-2">🔍</span>
                            <p className="text-sm font-semibold text-text-secondary">등록된 성도가 없거나 검색 결과가 없습니다.</p>
                            <p className="text-xs text-text-secondary/70 mt-1">새로운 성도를 추가하여 목양 관리를 시작하세요.</p>
                        </div>
                    ) : (
                        filteredSheep.map((s) => {
                            const status = getCareStatus(s.lastCareDate);
                            const isSelected = selectedSheep?.id === s.id;
                            return (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedSheep(s)}
                                    className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                                        isSelected 
                                            ? 'bg-indigo-600/5 border-indigo-500/30 shadow-sm shadow-indigo-500/5' 
                                            : 'bg-card/50 border-border/60 hover:bg-gray-50/50 hover:border-border'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                                            isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {s.name.substring(0, 2)}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-text truncate">{s.name}</span>
                                                {s.department && (
                                                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-semibold truncate">
                                                        {s.department}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-text-secondary truncate mt-0.5">
                                                {s.phone ? s.phone : '연락처 없음'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="text-right hidden sm:block">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${status.color}`}>
                                                {status.label}
                                            </span>
                                            <p className="text-[9px] text-text-secondary mt-1">누적 심방 {s.careCount}회</p>
                                        </div>
                                        <ChevronRight size={14} className="text-text-secondary group-hover:text-text transition-colors" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* === 성도 목양 카드 (우측 상세 영역) === */}
            <div className="flex-1 bg-card border border-border rounded-3xl p-5 flex flex-col h-full overflow-hidden">
                {selectedSheep ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* 프로필 헤더 */}
                        <div className="flex items-start justify-between border-b border-border pb-4 mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20">
                                    🐑
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-text flex items-center gap-2">{selectedSheep.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        {selectedSheep.department && (
                                            <span className="text-[11px] px-2 py-0.5 bg-indigo-500/10 text-indigo-500 font-bold rounded-lg">
                                                {selectedSheep.department}
                                            </span>
                                        )}
                                        {selectedSheep.phone && (
                                            <a 
                                                href={`tel:${selectedSheep.phone}`} 
                                                className="text-[11px] flex items-center gap-1 text-text-secondary hover:text-indigo-600 transition-colors"
                                            >
                                                <Phone size={10} />
                                                {selectedSheep.phone}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => openEditModal(selectedSheep)}
                                    className="p-2 text-text-secondary hover:text-indigo-600 hover:bg-indigo-50/10 rounded-xl transition-all"
                                    title="정보 수정"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDeleteSheep(selectedSheep.id)}
                                    className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50/10 rounded-xl transition-all"
                                    title="삭제"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* 메인 상세 정보 영역 (스크롤 가능) */}
                        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                            {/* 대표 기도제목 */}
                            <div className="bg-indigo-50/10 border border-indigo-500/10 rounded-2xl p-4">
                                <h4 className="text-xs font-black text-indigo-500 flex items-center gap-1.5 mb-2">
                                    <Heart size={12} fill="currentColor" />
                                    대표 기도 제목 & 주의 사항
                                </h4>
                                <p className="text-sm text-text leading-relaxed whitespace-pre-wrap">
                                    {selectedSheep.prayerRequest || "등록된 기도 제목이 없습니다. 심방 시 파악한 기도 제목을 적어주세요."}
                                </p>
                            </div>

                            {/* 심방 히스토리 타임라인 */}
                            <div>
                                <h4 className="text-xs font-black text-text flex items-center gap-1.5 mb-3.5">
                                    <Clock size={12} />
                                    심방 이력 타임라인
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md">
                                        {selectedSheepHistory.length}건
                                    </span>
                                </h4>
                                
                                {selectedSheepHistory.length === 0 ? (
                                    <div className="border-2 border-dashed border-border rounded-2xl p-8 text-center text-text-secondary">
                                        <MessageSquare className="mx-auto text-gray-300 mb-2" size={24} />
                                        <p className="text-xs font-medium">기록된 심방 이력이 없습니다.</p>
                                        <p className="text-[10px] text-text-secondary/70 mt-1">
                                            '기록' 탭에서 사역 입력 시 이 성도를 태그하거나 본문에 이름을 넣어 작성하세요.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 relative pl-3 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[2px] before:bg-border/60">
                                        {selectedSheepHistory.map((e) => (
                                            <div key={e.id} className="relative group">
                                                {/* 타임라인 노드 아이콘 */}
                                                <div className="absolute -left-[11px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center shadow-sm">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                                </div>
                                                <div className="bg-card/40 border border-border/50 rounded-2xl p-3.5 hover:border-indigo-500/20 hover:bg-gray-50/10 transition-all">
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded">
                                                                {e.subType}
                                                            </span>
                                                            <span className="text-[10px] text-text-secondary font-bold">
                                                                {e.date} {e.time}
                                                            </span>
                                                        </div>
                                                        {e.isHighlight && (
                                                            <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                                                ★ 중요
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">
                                                        {e.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary">
                        <div className="text-5xl mb-3 animate-pulse">🐑</div>
                        <h3 className="font-bold text-sm text-text">성도 카드가 비어있습니다</h3>
                        <p className="text-xs mt-1 max-w-[260px] text-text-secondary/80 leading-relaxed">
                            좌측 목록에서 성도를 선택하여 상세 정보와 심방 이력을 확인하세요.
                        </p>
                    </div>
                )}
            </div>

            {/* === 성도 추가 모달 === */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute right-4 top-4 p-1.5 hover:bg-gray-100 rounded-lg text-text-secondary"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-base font-black text-text mb-4 flex items-center gap-1.5">
                            🐑 새 성도 등록
                        </h3>
                        <form onSubmit={handleAddSheep} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">이름 *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="이름을 입력하세요"
                                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1.5">연락처</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="010-1234-5678"
                                        className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1.5">소속/직분</label>
                                    <input
                                        type="text"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        placeholder="청년부, 집사 등"
                                        className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">기도 제목 & 특이사항</label>
                                <textarea
                                    value={prayerRequest}
                                    onChange={(e) => setPrayerRequest(e.target.value)}
                                    placeholder="대표적인 기도 제목이나 주의해야 할 건강/상황 등을 적어주세요."
                                    rows={4}
                                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all mt-2"
                            >
                                성도 등록 완료
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* === 성도 수정 모달 === */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-card border border-border w-full max-w-md rounded-3xl shadow-2xl p-6 relative">
                        <button
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute right-4 top-4 p-1.5 hover:bg-gray-100 rounded-lg text-text-secondary"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-base font-black text-text mb-4 flex items-center gap-1.5">
                            ⚙️ 성도 정보 수정
                        </h3>
                        <form onSubmit={handleEditSheep} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">이름 *</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1.5">연락처</label>
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1.5">소속/직분</label>
                                    <input
                                        type="text"
                                        value={department}
                                        onChange={(e) => setDepartment(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1.5">기도 제목 & 특이사항</label>
                                <textarea
                                    value={prayerRequest}
                                    onChange={(e) => setPrayerRequest(e.target.value)}
                                    rows={4}
                                    className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/20 active:scale-95 transition-all mt-2"
                            >
                                변경 내용 저장
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ShepherdingPage;
