
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
                "flex items-center gap-2 md:gap-3 px-4 py-2.5 md:px-6 md:py-4 rounded-2xl font-bold transition-all select-none touch-none shadow-lg outline-none",
                block.color, block.textColor,
                isDragging ? "opacity-30 scale-95" : "opacity-100 hover:shadow-xl hover:scale-[1.03]"
            )}
        >
            <GripVertical size={16} className="opacity-40 shrink-0 md:size-18" />
            <div className="shrink-0 scale-90 md:scale-100">{block.icon}</div>
            <span className="text-sm md:text-lg whitespace-nowrap">{block.label}</span>
        </div>
    );
};

// ─── 드롭 가능한 시간 슬롯 ──────────────────────────────────────
const DroppableTimeSlot: React.FC<{
    time: string;
    entries: { id: string; subType: string; content: string; category: string }[];
    onDelete: (id: string) => void;
}> = ({ time, entries, onDelete }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `slot-${time}` });

    const getTimeLabel = (t: string) => {
        if (t === '11:40') return '🍚 점심';
        if (t === '18:00') return '🍽️ 저녁';
        return t;
    };

    return (
        <div
            ref={setNodeRef}
            className={clsx(
                "flex items-stretch gap-3 min-h-[52px] rounded-2xl transition-all duration-200 group",
                isOver ? "bg-blue-50 ring-2 ring-blue-300 ring-offset-2 scale-[1.01]" : "hover:bg-gray-50/50"
            )}
        >
            {/* 시간 라벨 */}
            <div className="w-16 md:w-20 shrink-0 flex items-center justify-center">
                <span className={clsx(
                    "text-xs md:text-sm font-bold tabular-nums",
                    time === '11:40' || time === '18:00' ? "text-orange-500" : "text-gray-400"
                )}>
                    {getTimeLabel(time)}
                </span>
            </div>

            {/* 드롭 영역 */}
            <div className={clsx(
                "flex-1 flex flex-wrap gap-2 items-center p-2 rounded-xl border-2 border-dashed transition-all min-h-[44px]",
                isOver ? "border-blue-300 bg-blue-50/50" : "border-transparent group-hover:border-gray-200"
            )}>
                {entries.length === 0 && isOver && (
                    <span className="text-xs text-blue-400 font-medium animate-pulse">여기에 놓으세요!</span>
                )}
                {entries.map((entry) => (
                    <div
                        key={entry.id}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all group/item relative",
                            entry.category === '심방' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                        )}
                    >

                        <span>{entry.subType}</span>
                        <span className="text-[10px] opacity-60 max-w-[120px] truncate">{entry.content}</span>
                        <button
                            onClick={() => onDelete(entry.id)}
                            className="ml-1 p-0.5 rounded-full bg-red-100 text-red-500 opacity-0 group-hover/item:opacity-100 hover:bg-red-500 hover:text-white transition-all"
                        >
                            <X size={10} />
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
                    <h2 className="text-2xl font-bold text-gray-900">✏️ 사역 기록</h2>
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-500">날짜</label>
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="px-4 py-2.5 bg-gray-100 rounded-2xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#007AFF] focus:outline-none transition-all"
                        />
                    </div>
                </div>

                {/* 저장 성공 메시지 */}
                {lastSaved && (
                    <div className="p-4 bg-green-100 text-green-800 rounded-2xl flex items-center justify-center gap-2 animate-fade-in text-base font-bold">
                        <Check size={20} />
                        저장되었습니다 ({lastSaved})
                    </div>
                )}

                {/* === 드래그 앤 드롭 레이아웃 === */}
                {/* 모바일: 블록(상단) → 타임라인(하단) */}
                {/* PC: 블록(좌측) | 타임라인(우측) */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* ─── 사역 블록 팔레트 ─── */}
                    <div className="lg:w-52 xl:w-56 shrink-0 z-40 sticky top-[68px] lg:top-24 self-start">
                        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-4 lg:p-5">
                            <div className="flex items-center justify-between mb-3 lg:mb-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">사역 도구함</h3>
                                <span className="md:hidden text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">FLOATING</span>
                            </div>

                            <div className="flex lg:flex-col gap-2.5">
                                {MINISTRY_BLOCKS.map(block => (
                                    <DraggableBlock key={block.id} block={block} />
                                ))}
                            </div>

                            <p className="text-[10px] text-gray-400 mt-4 text-center font-medium leading-relaxed hidden lg:block">
                                블록을 끌어서 시간대에<br />놓으면 기록됩니다
                            </p>
                        </div>
                    </div>

                    {/* ─── 타임라인 (드롭 타겟) ─── */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100/50 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">타임라인</h3>
                                <span className="text-xs text-gray-400 font-semibold bg-gray-50 px-3 py-1 rounded-full">
                                    {format(new Date(selectedDate), 'M월 d일 (eee)', { locale: ko })}
                                </span>
                            </div>

                            <div className="space-y-1 divide-y divide-gray-50">
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
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 드래그 오버레이 (마우스 따라다니는 고스트) */}
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
