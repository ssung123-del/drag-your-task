
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
import { format, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X, Check, GripVertical, Home, Briefcase, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

// ─── 타입 정의 ──────────────────────────────────────────────────
interface BlockItem {
    id: string;
    category: Category;
    label: string;
    icon: React.ReactNode;
    color: string;
    textColor: string;
    subTypes: { value: SubType; label: string }[];
}

// ─── 블록 데이터 ────────────────────────────────────────────────
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
                "flex items-center gap-2 md:gap-3 px-4 py-3 md:px-5 md:py-3.5 rounded-2xl font-bold transition-transform select-none touch-none shadow-lg outline-none w-full lg:max-w-[180px]",
                block.color, block.textColor,
                isDragging ? "opacity-30 scale-95" : "opacity-100 hover:scale-[1.02]"
            )}
        >
            <GripVertical size={16} className="opacity-40 shrink-0" />
            <div className="shrink-0">{block.icon}</div>
            <span className="text-sm md:text-base whitespace-nowrap">{block.label}</span>
        </div>
    );
};

// ─── 드롭 가능한 시간 슬롯 (메모이제이션 적용) ───────────────────
const DroppableTimeSlot: React.FC<{
    time: string;
    entries: { id: string; subType: string; content: string; category: string }[];
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onQuickAdd: (time: string) => void;
}> = React.memo(({ time, entries, onDelete, onEdit, onQuickAdd }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `slot-${time}` });

    const getTimeLabel = (t: string) => {
        if (t === '11:40') return '점심';
        if (t === '17:00') return '저녁';
        return t;
    };

    const isMealTime = time === '11:40' || time === '17:00';

    return (
        <div
            ref={setNodeRef}
            onClick={() => onQuickAdd(time)}
            className={clsx(
                "flex items-stretch gap-3 min-h-[60px] rounded-xl transition-colors duration-150 group cursor-pointer",
                isOver ? "bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-300" : "hover:bg-background/80 active:bg-background"
            )}
        >
            {/* 시간 라벨 */}
            <div className="w-16 md:w-20 shrink-0 flex items-center justify-center border-r border-border/50">
                <span className={clsx(
                    "text-xs md:text-sm font-bold tabular-nums",
                    isMealTime ? "text-orange-500" : (isOver ? "text-indigo-600 dark:text-indigo-400" : "text-text-secondary")
                )}>
                    {getTimeLabel(time)}
                </span>
            </div>

            {/* 내용 표시 영역 */}
            <div className="flex-1 flex flex-wrap gap-2 items-center p-2">
                {entries.length === 0 && !isOver && (
                    <div className="w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-text-secondary/50">+ 추가</span>
                    </div>
                )}

                {entries.length === 0 && isOver && (
                    <span className="text-xs text-indigo-400 font-bold">여기에 놓기</span>
                )}

                {entries.map((entry) => (
                    <div
                        key={entry.id}
                        onClick={(e) => e.stopPropagation()}
                        className={clsx(
                            "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold shadow-sm border select-none transition-colors",
                            entry.category === '심방'
                                ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-100 dark:border-blue-500/50'
                                : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-100 dark:border-green-500/50'
                        )}
                    >
                        <span className="shrink-0 opacity-60 text-[10px]">{entry.category === '심방' ? '■' : '●'}</span>
                        <span className="truncate max-w-[150px] md:max-w-[200px]">{entry.content}</span>

                        <div className="flex items-center gap-0.5 ml-1 shrink-0 opacity-80 hover:opacity-100">
                            <button
                                onClick={(e) => { e.stopPropagation(); onEdit(entry.id); }}
                                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                            >
                                <Pencil size={11} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
                                className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-red-500 dark:text-red-400 transition-colors"
                            >
                                <X size={11} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}, (prevProps, nextProps) => {
    return prevProps.time === nextProps.time &&
        prevProps.entries === nextProps.entries;
});

// ─── 상세 내용 입력 모달 (애니메이션 제거) ──────────────────────
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
            <div className="bg-card rounded-xl shadow-lg w-full max-w-md p-6 space-y-5 border border-border">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-text">📝 사역 내용 입력</h3>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-background">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                    <div className={clsx("p-2.5 rounded-lg text-white", block.color)}>
                        {block.icon}
                    </div>
                    <div className="text-sm space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-text">{block.label}</span>
                            <span className="text-text-secondary">→</span>
                            <span className="font-bold text-[#007AFF]">{time}</span>
                        </div>
                        <span className="text-xs text-text-secondary">
                            {format(new Date(date), 'yyyy년 M월 d일 (eee)', { locale: ko })}
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-secondary ml-1">세부 유형</label>
                    <div className="flex bg-background p-1.5 rounded-lg">
                        {block.subTypes.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setSelectedSubType(value)}
                                className={clsx(
                                    "flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors",
                                    selectedSubType === value
                                        ? "bg-card text-text shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                        : "text-text-secondary hover:text-text"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-secondary ml-1">사역 내용</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-3 bg-background rounded-lg text-text font-medium h-28 focus:bg-card focus:ring-2 focus:ring-[#007AFF] focus:outline-none resize-none placeholder:text-text-secondary/50"
                        placeholder="사역 내용을 자유롭게 입력하세요..."
                        autoFocus
                    />
                </div>

                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-xl font-bold text-text-secondary bg-background hover:bg-border transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-3.5 rounded-xl font-bold text-white bg-[#007AFF] hover:bg-[#0062cc] shadow-md flex items-center justify-center gap-2 transition-colors"
                    >
                        <Check size={18} />
                        등록
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── 수정 모달 (애니메이션 제거) ──────────────────────────────
const EditModal: React.FC<{
    entry: { id: string; category: string; subType: string; content: string; time: string };
    date: string;
    onConfirm: (id: string, subType: SubType, content: string) => void;
    onCancel: () => void;
}> = ({ entry, date, onConfirm, onCancel }) => {
    const block = MINISTRY_BLOCKS.find(b => b.category === entry.category) || MINISTRY_BLOCKS[0];
    const [selectedSubType, setSelectedSubType] = useState<SubType>(entry.subType as SubType);
    const [content, setContent] = useState(entry.content);

    const handleSubmit = () => {
        onConfirm(entry.id, selectedSubType, content.trim() || `${selectedSubType} 진행`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
            <div className="bg-card rounded-xl shadow-lg w-full max-w-md p-6 space-y-5 border border-border">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-text">✏️ 사역 내용 수정</h3>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-background">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                <div className="flex items-center gap-3 p-4 bg-background rounded-lg">
                    <div className={clsx("p-2.5 rounded-lg text-white", block.color)}>
                        {block.icon}
                    </div>
                    <div className="text-sm space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-text">{block.label}</span>
                            <span className="text-text-secondary">→</span>
                            <span className="font-bold text-[#007AFF]">{entry.time}</span>
                        </div>
                        <span className="text-xs text-text-secondary">
                            {format(new Date(date), 'yyyy년 M월 d일 (eee)', { locale: ko })}
                        </span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-secondary ml-1">세부 유형</label>
                    <div className="flex bg-background p-1.5 rounded-lg">
                        {block.subTypes.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setSelectedSubType(value)}
                                className={clsx(
                                    "flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors",
                                    selectedSubType === value
                                        ? "bg-card text-text shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                        : "text-text-secondary hover:text-text"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-secondary ml-1">사역 내용</label>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full px-4 py-3 bg-background rounded-lg text-text font-medium h-28 focus:bg-card focus:ring-2 focus:ring-[#007AFF] focus:outline-none resize-none placeholder:text-text-secondary/50"
                        placeholder="사역 내용을 자유롭게 입력하세요..."
                        autoFocus
                    />
                </div>

                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-xl font-bold text-text-secondary bg-background hover:bg-border transition-colors"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 py-3.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md flex items-center justify-center gap-2 transition-colors"
                    >
                        <Check size={18} />
                        수정 완료
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── 메인 드래그 앤 드롭 보드 ────────────────────────────────────
const DragDropBoard: React.FC = () => {
    const { entries, addEntry, updateEntry, deleteEntry } = useMinistryStore();
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [activeBlock, setActiveBlock] = useState<BlockItem | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showQuickModal, setShowQuickModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEntry, setEditingEntry] = useState<{ id: string; category: string; subType: string; content: string; time: string } | null>(null);
    const [pendingDrop, setPendingDrop] = useState<{ block: BlockItem; time: string } | null>(null);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // 센서: 빠른 반응을 위해 딜레이 최소화 (Pointer는 즉시, Touch는 약간의 딜레이)
    const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
    const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 10 } });
    const sensors = useSensors(pointerSensor, touchSensor);

    // [최적화 1] 오늘 날짜 데이터만 필터링
    const todayEntries = entries.filter(e => e.date === selectedDate);

    // [최적화 2] 데이터 미리 그룹핑 (렌더링 최적화)
    const entriesByTime = React.useMemo(() => {
        const map: Record<string, typeof todayEntries> = {};
        TIME_SLOTS.forEach(t => map[t] = []);
        todayEntries.forEach(entry => map[entry.time]?.push(entry));
        return map;
    }, [todayEntries]);

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

    const handleQuickAdd = React.useCallback((time: string) => {
        setPendingDrop({ block: MINISTRY_BLOCKS[0], time });
        setShowQuickModal(true);
    }, []);

    const handleDeleteEntry = React.useCallback((id: string) => {
        if (confirm('이 기록을 삭제하시겠습니까?')) deleteEntry(id);
    }, [deleteEntry]);

    const handleEditEntry = React.useCallback((id: string) => {
        const target = entries.find(e => e.id === id);
        if (target) {
            setEditingEntry({ ...target });
            setShowEditModal(true);
        }
    }, [entries]);

    const handleSelectCategory = (block: BlockItem) => {
        if (!pendingDrop) return;
        setPendingDrop({ ...pendingDrop, block });
        setShowQuickModal(false);
        setShowModal(true);
    };

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
        setTimeout(() => setLastSaved(null), 2000);
    };

    const handleEditConfirm = async (id: string, subType: SubType, content: string) => {
        await updateEntry(id, { subType, content });
        setShowEditModal(false);
        setEditingEntry(null);
        setLastSaved(format(new Date(), 'HH:mm:ss'));
        setTimeout(() => setLastSaved(null), 2000);
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="space-y-4">
                {/* 헤더 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <h2 className="text-2xl font-extrabold text-text tracking-tight">✏️ 사역 기록</h2>
                    <div className="flex items-center gap-2 bg-card p-1 rounded-xl border border-border shadow-sm">
                        <button
                            onClick={() => setSelectedDate(format(new Date(), 'yyyy-MM-dd'))}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                        >
                            오늘
                        </button>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex items-center">
                            <button
                                onClick={() => setSelectedDate(prev => format(subDays(new Date(prev), 1), 'yyyy-MM-dd'))}
                                className="p-1.5 rounded-lg text-text-secondary hover:bg-background hover:text-text transition-colors"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            <span className="text-base font-bold text-text tabular-nums px-2">
                                {format(new Date(selectedDate), 'yyyy.MM.dd')}
                                <span className="text-xs font-medium text-text-secondary ml-1">
                                    ({format(new Date(selectedDate), 'eee', { locale: ko })})
                                </span>
                            </span>
                            <button
                                onClick={() => setSelectedDate(prev => format(addDays(new Date(prev), 1), 'yyyy-MM-dd'))}
                                className="p-1.5 rounded-lg text-text-secondary hover:bg-background hover:text-text transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* 저장 알림 */}
                {lastSaved && (
                    <div className="px-4 py-2 bg-emerald-500/90 text-white rounded-lg flex items-center justify-center gap-2 text-sm font-bold shadow-md">
                        <Check size={16} /> 저장됨
                    </div>
                )}

                {/* === 드래그 앤 드롭 레이아웃 === */}
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* ─── 사역 블록 팔레트 ─── */}
                    <div className="lg:w-48 shrink-0 z-40 sticky top-4 self-start">
                        <div className="bg-card rounded-2xl shadow-lg border border-border p-4">
                            <div className="flex lg:flex-col gap-2">
                                {MINISTRY_BLOCKS.map(block => (
                                    <DraggableBlock key={block.id} block={block} />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ─── 타임라인 (드롭 타겟) ─── */}
                    <div className="flex-1 min-w-0">
                        <div className="bg-card rounded-2xl shadow-lg border border-border p-4 md:p-6">
                            <div className="space-y-1">
                                {TIME_SLOTS.map((time) => (
                                    <DroppableTimeSlot
                                        key={time}
                                        time={time}
                                        entries={entriesByTime[time] || []}
                                        onDelete={handleDeleteEntry}
                                        onEdit={handleEditEntry}
                                        onQuickAdd={handleQuickAdd}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 드래그 오버레이 */}
            <DragOverlay>
                {activeBlock && (
                    <div className={clsx(
                        "flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-base shadow-xl opacity-90 pointer-events-none",
                        activeBlock.color, activeBlock.textColor
                    )}>
                        {activeBlock.icon}
                        <span>{activeBlock.label}</span>
                    </div>
                )}
            </DragOverlay>

            {/* 빠른 추가 모달 (애니메이션 제거) */}
            {showQuickModal && pendingDrop && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60">
                    <div className="bg-card rounded-xl shadow-lg w-full max-w-sm p-6 space-y-4 border border-border">
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-text">어떤 기록을 할까요?</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {MINISTRY_BLOCKS.map(block => (
                                <button
                                    key={block.id}
                                    onClick={() => handleSelectCategory(block)}
                                    className={clsx(
                                        "flex items-center gap-3 p-4 rounded-xl text-white shadow-md transition-transform active:scale-[0.98]",
                                        block.color
                                    )}
                                >
                                    <div className="text-lg font-bold">{block.label} 기록하기</div>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => { setShowQuickModal(false); setPendingDrop(null); }}
                            className="w-full py-3 text-sm font-bold text-text-secondary hover:text-text"
                        >
                            취소
                        </button>
                    </div>
                </div>
            )}

            {showModal && pendingDrop && (
                <DetailModal
                    block={pendingDrop.block}
                    time={pendingDrop.time}
                    date={selectedDate}
                    onConfirm={handleConfirm}
                    onCancel={() => { setShowModal(false); setPendingDrop(null); }}
                />
            )}

            {showEditModal && editingEntry && (
                <EditModal
                    entry={editingEntry}
                    date={selectedDate}
                    onConfirm={handleEditConfirm}
                    onCancel={() => { setShowEditModal(false); setEditingEntry(null); }}
                />
            )}
        </DndContext>
    );
};

export default DragDropBoard;
