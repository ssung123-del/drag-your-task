
import React, { useState } from 'react';
import {
    DndContext,
    DragOverlay,
    useDraggable,
    useDroppable,
    type DragStartEvent,
    type DragEndEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { useMinistryStore } from '../store/useMinistryStore';
import { type Category, type SubType, TIME_SLOTS } from '../types';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X, Check, GripVertical, Home, Briefcase } from 'lucide-react';
import clsx from 'clsx';

// ─── 타입 정의 ──────────────────────────────────────────────────
interface BlockItem {
    id: string;
    category: Category;
    label: string;
    icon: React.ReactNode;
    color: string;
    textColor: string;
    subTypes: { value: SubType; label: string }[];  // 드롭 후 모달에서 선택
}

// DropData는 모달 내부에서 관리하므로 별도 인터페이스 불필요

// ─── 블록 데이터: 심방과 업무 두 개만 ──────────────────────────
// 왜 두 개만? → 사용자가 세부 카테고리를 블록에서 분리해달라고 요청
// 세부 유형(방문/카페/전화 등)은 드롭 후 모달에서 선택하는 방식
const MINISTRY_BLOCKS: BlockItem[] = [
    {
        id: 'block-visit',
        category: '심방',
        label: '심방',
        icon: <Home size={22} />,
        color: 'bg-blue-500',
        textColor: 'text-white',
        subTypes: [
            { value: '방문심방', label: '방문' },
            { value: '카페심방', label: '카페' },
            { value: '전화심방', label: '전화' },
        ],
    },
    {
        id: 'block-work',
        category: '업무',
        label: '업무',
        icon: <Briefcase size={22} />,
        color: 'bg-green-500',
        textColor: 'text-white',
        subTypes: [
            { value: '회의', label: '회의' },
            { value: '행정', label: '행정' },
            { value: '기타', label: '기타' },
        ],
    },
];

// ─── 드래그 가능한 블록 ─────────────────────────────────────────
const DraggableBlock: React.FC<{ block: BlockItem }> = ({ block }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: block.id,
        data: block,
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            className={clsx(
                "flex items-center gap-2 md:gap-3 px-4 py-3 md:px-5 md:py-3.5 rounded-2xl font-bold transition-all select-none touch-none shadow-lg outline-none w-full lg:max-w-[180px]",
                block.color, block.textColor,
                isDragging ? "opacity-30 scale-95" : "opacity-100 hover:shadow-xl hover:scale-[1.03]"
            )}
        >
            <GripVertical size={16} className="opacity-40 shrink-0" />
            <div className="shrink-0">{block.icon}</div>
            <span className="text-sm md:text-base whitespace-nowrap">{block.label}</span>
        </div>
    );
};

// ─── 드롭 가능한 시간 슬롯 ──────────────────────────────────────
const DroppableTimeSlot: React.FC<{
    time: string;
    entries: { id: string; subType: string; content: string; category: string }[];
    onDelete: (id: string) => void;
    onQuickAdd: (time: string) => void;
}> = ({ time, entries, onDelete, onQuickAdd }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `slot-${time}` });

    const getTimeLabel = (t: string) => {
        if (t === '11:40') return '🍚 점심';
        if (t === '18:00') return '🍽️ 저녁';
        return t;
    };

    const isMealTime = time === '11:40' || time === '18:00';

    return (
        <div
            ref={setNodeRef}
            onClick={() => onQuickAdd(time)}
            className={clsx(
                "flex items-stretch gap-3 min-h-[64px] rounded-2xl transition-all duration-200 group cursor-pointer",
                isOver ? "bg-indigo-50 ring-2 ring-indigo-300 ring-offset-2 scale-[1.01]" : "hover:bg-gray-50/80 active:bg-gray-100"
            )}
        >
            {/* 시간 라벨 */}
            <div className="w-16 md:w-20 shrink-0 flex items-center justify-center border-r border-gray-50">
                <span className={clsx(
                    "text-xs md:text-sm font-bold tabular-nums transition-colors",
                    isMealTime ? "text-orange-500" : (isOver ? "text-indigo-600" : "text-gray-400")
                )}>
                    {getTimeLabel(time)}
                </span>
            </div>

            {/* 드롭/클릭 영역 */}
            <div className={clsx(
                "flex-1 flex flex-wrap gap-2 items-center p-3 rounded-xl border-2 border-dashed transition-all min-h-[44px]",
                isOver ? "border-indigo-300 bg-indigo-50/50" : "border-transparent group-hover:border-gray-200"
            )}>
                {entries.length === 0 && !isOver && (
                    <div className="w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-300">
                            <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                <span className="text-sm">+</span>
                            </div>
                            기록 추가
                        </div>
                    </div>
                )}

                {entries.length === 0 && isOver && (
                    <span className="text-xs text-indigo-400 font-bold animate-pulse">사역 블록 배치 중...</span>
                )}

                {entries.map((entry) => (
                    <div
                        key={entry.id}
                        onClick={(e) => e.stopPropagation()} // 삭제 버튼 클릭 시 등록 팝업 안 뜨게 방지
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all group/item relative shadow-sm",
                            entry.category === '심방' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        )}
                    >
                        <span className="shrink-0">{entry.category === '심방' ? '■' : '●'}</span>
                        <span>{entry.subType}</span>
                        <span className="text-[10px] opacity-60 font-medium max-w-[150px] truncate">{entry.content}</span>
                        <button
                            onClick={() => onDelete(entry.id)}
                            className="ml-1 p-1 rounded-full bg-white/50 text-red-500 opacity-0 group-hover/item:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        >
                            <X size={10} strokeWidth={3} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ─── 상세 내용 입력 모달 ────────────────────────────────────────
// 블록 드롭 후: 세부 유형 선택 + 내용 입력
const DetailModal: React.FC<{
    block: BlockItem;
    time: string;
    date: string;
    onConfirm: (subType: SubType, content: string) => void;
    onCancel: () => void;
}> = ({ block, time, date, onConfirm, onCancel }) => {
    const [selectedSubType, setSelectedSubType] = useState<SubType>(block.subTypes[0].value);
    const [content, setContent] = useState('');

    const handleSubmit = () => {
        onConfirm(selectedSubType, content.trim() || `${selectedSubType} 진행`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5 animate-slide-up">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">📝 사역 내용 입력</h3>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* 드롭 정보 요약 */}
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    <div className={clsx("p-2.5 rounded-xl text-white", block.color)}>
                        {block.icon}
                    </div>
                    <div className="text-sm space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900">{block.label}</span>
                            <span className="text-gray-400">→</span>
                            <span className="font-bold text-[#007AFF]">{time}</span>
                        </div>
                        <span className="text-xs text-gray-500">
                            {format(new Date(date), 'yyyy년 M월 d일 (eee)', { locale: ko })}
                        </span>
                    </div>
                </div>

                {/* 세부 유형 선택 (세그먼티드 컨트롤) */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 ml-1">세부 유형</label>
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                        {block.subTypes.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setSelectedSubType(value)}
                                className={clsx(
                                    "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all",
                                    selectedSubType === value
                                        ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 내용 입력 */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 ml-1">사역 내용</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-100 rounded-2xl text-gray-900 font-medium h-28 focus:bg-white focus:ring-2 focus:ring-[#007AFF] focus:outline-none resize-none transition-all placeholder:text-gray-400"
                        placeholder="사역 내용을 자유롭게 입력하세요..."
                        autoFocus
                    />
                </div>


                {/* 확인/취소 버튼 */}
                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-[#007AFF] hover:bg-[#0062cc] shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        등록
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── 메인 드래그 앤 드롭 보드 ────────────────────────────────────
const DragDropBoard: React.FC = () => {
    const { entries, addEntry, deleteEntry } = useMinistryStore();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [activeBlock, setActiveBlock] = useState<BlockItem | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showQuickModal, setShowQuickModal] = useState(false);
    const [pendingDrop, setPendingDrop] = useState<{ block: BlockItem; time: string } | null>(null);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // 터치(모바일) + 포인터(PC) 모두 지원하는 센서
    const pointerSensor = useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
    });
    const touchSensor = useSensor(TouchSensor, {
        activationConstraint: { delay: 200, tolerance: 5 },
    });
    const sensors = useSensors(pointerSensor, touchSensor);

    const todayEntries = entries.filter(e => e.date === selectedDate);

    const handleDragStart = (event: DragStartEvent) => {
        const block = MINISTRY_BLOCKS.find(b => b.id === event.active.id);
        setActiveBlock(block || null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveBlock(null);
        const { over } = event;
        if (!over) return;

        const droppedBlock = MINISTRY_BLOCKS.find(b => b.id === event.active.id);
        if (!droppedBlock) return;

        const time = (over.id as string).replace('slot-', '');
        setPendingDrop({ block: droppedBlock, time });
        setShowModal(true);
    };

    // 퀵 추가 핸들러 (슬롯 클릭 시)
    const handleQuickAdd = (time: string) => {
        setPendingDrop({ block: MINISTRY_BLOCKS[0], time }); // 기본값 설정 (block-visit)
        setShowQuickModal(true);
    };

    const handleSelectCategory = (block: BlockItem) => {
        if (!pendingDrop) return;
        setPendingDrop({ ...pendingDrop, block });
        setShowQuickModal(false);
        setShowModal(true);
    };

    // 모달에서 등록 확인
    const handleConfirm = (subType: SubType, content: string) => {
        if (!pendingDrop) return;

        addEntry({
            date: selectedDate,
            time: pendingDrop.time,
            category: pendingDrop.block.category,
            subType,
            content,
            isHighlight: false,
        });

        setShowModal(false);
        setPendingDrop(null);
        setLastSaved(format(new Date(), 'HH:mm:ss'));
        setTimeout(() => setLastSaved(null), 3000);
    };

    const handleDeleteEntry = (id: string) => {
        if (confirm('이 기록을 삭제하시겠습니까?')) {
            deleteEntry(id);
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-6">
                {/* 헤더: 타이틀 + 날짜 선택 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">✏️ 사역 기록</h2>
                    <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100">
                        <label className="text-xs font-bold text-gray-400 uppercase">DATE</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent text-gray-900 font-bold focus:outline-none"
                        />
                    </div>
                </div>

                {/* 저장 성공 메시지 */}
                {lastSaved && (
                    <div className="p-4 bg-emerald-500 text-white rounded-2xl flex items-center justify-center gap-2 animate-fade-in text-base font-bold shadow-lg shadow-emerald-200">
                        <Check size={20} />
                        기록이 저장되었습니다 ({lastSaved})
                    </div>
                )}

                {/* === 드래그 앤 드롭 레이아웃 === */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* ─── 사역 블록 팔레트 ─── */}
                    <div className="lg:w-56 shrink-0 z-40 sticky top-[68px] lg:top-24 self-start">
                        <div className="bg-white/90 backdrop-blur-md rounded-[32px] shadow-2xl shadow-gray-200/40 border border-gray-100 p-5 lg:p-6">
                            <div className="flex items-center justify-between mb-4 lg:mb-6 px-1">
                                <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">사역 도구함</h3>
                                <span className="md:hidden text-[10px] text-indigo-600 font-black bg-indigo-50 px-2 py-1 rounded-lg">FLOATING</span>
                            </div>

                            <div className="flex flex-row lg:flex-col gap-3 lg:items-center">
                                {MINISTRY_BLOCKS.map(block => (
                                    <DraggableBlock key={block.id} block={block} />
                                ))}
                            </div>

                            <div className="mt-6 pt-5 border-t border-gray-50 hidden lg:block">
                                <p className="text-[11px] text-gray-400 text-center font-bold leading-relaxed opacity-80 uppercase tracking-wider">
                                    Drag & Drop<br />to Timeline
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ─── 타임라인 (드롭 타겟) ─── */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 md:p-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="space-y-1">
                                    <h3 className="text-xl font-bold text-gray-900">데일리 타임라인</h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TIMELINE | {format(new Date(selectedDate), 'yyyy-MM-dd')}</p>
                                </div>
                                <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100">
                                    {format(new Date(selectedDate), 'M월 d일 (eee)', { locale: ko })}
                                </span>
                            </div>

                            <div className="space-y-1.5 ">
                                {TIME_SLOTS.map((time) => {
                                    const slotEntries = todayEntries
                                        .filter(e => e.time === time)
                                        .map(e => ({
                                            id: e.id,
                                            subType: e.subType,
                                            content: e.content,
                                            category: e.category,
                                        }));

                                    return (
                                        <DroppableTimeSlot
                                            key={time}
                                            time={time}
                                            entries={slotEntries}
                                            onDelete={handleDeleteEntry}
                                            onQuickAdd={handleQuickAdd}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 드래그 오버레이 */}
            <DragOverlay>
                {activeBlock && (
                    <div className={clsx(
                        "flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-lg shadow-2xl opacity-90 pointer-events-none",
                        activeBlock.color, activeBlock.textColor
                    )}>
                        {activeBlock.icon}
                        <span>{activeBlock.label}</span>
                    </div>
                )}
            </DragOverlay>

            {/* 사역 종류 선택 모달 (퀵 추가 시) */}
            {showQuickModal && pendingDrop && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-8 space-y-6 animate-slide-up">
                        <div className="text-center space-y-1">
                            <h3 className="text-2xl font-black text-gray-900">어떤 기록을 할까요?</h3>
                            <p className="text-sm font-bold text-indigo-500 uppercase tracking-widest">Selection for {pendingDrop.time}</p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {MINISTRY_BLOCKS.map(block => (
                                <button
                                    key={block.id}
                                    onClick={() => handleSelectCategory(block)}
                                    className={clsx(
                                        "flex items-center gap-4 p-5 rounded-2xl transition-all active:scale-95 text-white shadow-lg",
                                        block.color
                                    )}
                                >
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                                        {block.icon}
                                    </div>
                                    <div className="text-left">
                                        <p className="text-lg font-black">{block.label} 기록하기</p>
                                        <p className="text-[10px] opacity-80 font-bold uppercase tracking-wider">{block.category} Module</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => { setShowQuickModal(false); setPendingDrop(null); }}
                            className="w-full py-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            창 닫기
                        </button>
                    </div>
                </div>
            )}

            {/* 상세 내용 입력 모달 */}
            {showModal && pendingDrop && (
                <DetailModal
                    block={pendingDrop.block}
                    time={pendingDrop.time}
                    date={selectedDate}
                    onConfirm={handleConfirm}
                    onCancel={() => { setShowModal(false); setPendingDrop(null); }}
                />
            )}
        </DndContext>
    );
};

export default DragDropBoard;
