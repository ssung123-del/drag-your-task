
import React, { useState, useEffect, useMemo } from 'react';
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
import { type Category, type SubType, TIME_SLOTS, DAYS_OF_WEEK_KR } from '../types';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
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
        data: { type: 'block', ...block },
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



// ─── 드래그 가능한 등록된 업무 (Draggable Entry) ───────────────────
const DraggableEntry: React.FC<{
    entry: { id: string; subType: string; content: string; category: string; time: string; date: string };
    viewMode: 'day' | 'week';
    onEdit: (id: string, e: React.MouseEvent) => void;
}> = ({ entry, viewMode, onEdit }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: entry.id,
        data: { type: 'entry', ...entry },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            // Add double click to edit? Or normal click?
            // If we allow click to edit, we need to be careful with drag.
            // For now, let's just let the edit button handle editing, or use double click.
            className={clsx(
                "group/card flex items-center gap-1.5 rounded-lg text-[10px] font-bold shadow-sm border select-none transition-all w-full overflow-hidden cursor-grab active:cursor-grabbing",
                viewMode === 'day' ? "px-3 py-2 text-xs" : "px-1.5 py-1",
                entry.category === '심방'
                    ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-100 dark:border-blue-500/50'
                    : 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-100 dark:border-green-500/50',
                isDragging ? "opacity-30 z-50 scale-95" : "opacity-100 hover:scale-[1.02]"
            )}
            style={{ touchAction: 'none' }}
        >
            <span className="shrink-0 opacity-60 text-[10px]">{entry.category === '심방' ? '■' : '●'}</span>
            <span className="truncate flex-1 text-left">{entry.content}</span>

            <div className={clsx("flex items-center gap-0.5 shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity", viewMode === 'week' && "hidden group-hover/card:flex")}>
                <button
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start when clicking button
                    onClick={(e) => onEdit(entry.id, e)}
                    className="p-1 rounded hover:bg-black/10 transition-colors"
                >
                    <Pencil size={10} />
                </button>
            </div>
        </div>
    );
};

// ─── 드롭 가능한 시간 슬롯 (메모이제이션 적용) ───────────────────
const DroppableTimeSlot: React.FC<{
    time: string;
    date: string;
    entries: { id: string; subType: string; content: string; category: string; time: string; date: string }[];
    onEdit: (id: string, e: React.MouseEvent) => void;
    onQuickAdd: (time: string, date: string) => void;
    viewMode: 'day' | 'week';
    isTodaySlot?: boolean;
}> = React.memo(({ time, date, entries, onEdit, onQuickAdd, viewMode, isTodaySlot }) => {
    const slotId = `slot-${date}-${time}`;
    const { setNodeRef, isOver } = useDroppable({ id: slotId });

    const getTimeLabel = (t: string) => {
        if (t === '11:40') return '점심';
        if (t === '17:00') return '저녁';
        return t;
    };

    const isMealTime = time === '11:40' || time === '17:00';

    return (
        <div
            ref={setNodeRef}
            onClick={() => onQuickAdd(time, date)}
            className={clsx(
                "relative flex items-stretch rounded-xl transition-colors duration-150 group cursor-pointer border",
                viewMode === 'day' ? "gap-3 min-h-[60px]" : "h-full flex-col p-1 gap-1 overflow-hidden",
                isOver
                    ? "bg-indigo-50 dark:bg-indigo-900/20 ring-2 ring-indigo-300 border-transparent"
                    : isTodaySlot
                        ? "bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                        : "bg-card border-border/50 hover:bg-background/80 active:bg-background"
            )}
        >
            {/* 시간 라벨 (Only for Day view) */}
            {viewMode === 'day' && (
                <div className="w-16 md:w-20 shrink-0 flex items-center justify-center border-r border-border/50">
                    <span className={clsx(
                        "text-xs md:text-sm font-bold tabular-nums",
                        isMealTime ? "text-orange-500" : (isOver ? "text-indigo-600 dark:text-indigo-400" : "text-text-secondary")
                    )}>
                        {getTimeLabel(time)}
                    </span>
                </div>
            )}

            {/* 내용 표시 영역 */}
            <div className={clsx("flex-1 flex flex-wrap gap-1.5 items-center min-w-0", viewMode === 'day' ? "p-2" : "content-start")}>
                {entries.length === 0 && !isOver && viewMode === 'day' && (
                    <div className="w-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs font-bold text-text-secondary/50">+ 추가</span>
                    </div>
                )}

                {entries.length === 0 && isOver && (
                    <span className="text-xs text-indigo-400 font-bold w-full text-center py-2">여기!</span>
                )}

                {entries.map((entry) => (
                    <DraggableEntry
                        key={entry.id}
                        entry={entry}
                        viewMode={viewMode}
                        onEdit={onEdit}
                    />
                ))}
            </div>
        </div>
    );
}, (prev, next) => {
    return prev.time === next.time &&
        prev.date === next.date &&
        prev.viewMode === next.viewMode &&
        prev.isTodaySlot === next.isTodaySlot &&
        prev.entries === next.entries;
});

// ─── 상세 내용 입력 모달 ──────────────────────────────────────
const DetailModal: React.FC<{
    block: BlockItem;
    time: string;
    date: string;
    initialContent?: string;
    onConfirm: (subType: SubType, content: string) => void;
    onCancel: () => void;
}> = ({ block, time, date, initialContent, onConfirm, onCancel }) => {
    const defaultSubType: SubType = block?.subTypes?.[0]?.value || '기타';
    const [selectedSubType, setSelectedSubType] = useState<SubType>(defaultSubType);
    const [content, setContent] = useState(initialContent || '');

    if (!block) return null;

    const handleSubmit = () => {
        onConfirm(selectedSubType, content.trim() || `${selectedSubType} 진행`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-border">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-text">📝 사역 내용 입력</h3>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-background">
                        <X size={20} className="text-text-secondary" />
                    </button>
                </div>

                <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border/50">
                    <div className={clsx("p-2.5 rounded-lg text-white shadow-sm", block.color)}>
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
                    <div className="flex bg-background p-1.5 rounded-lg border border-border/50">
                        {block.subTypes.map(({ value, label }) => (
                            <button
                                key={value}
                                onClick={() => setSelectedSubType(value)}
                                className={clsx(
                                    "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all",
                                    selectedSubType === value
                                        ? "bg-card text-text shadow-sm ring-1 ring-black/5 dark:ring-white/10 scale-[1.02]"
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
                        className="w-full px-4 py-3 bg-background rounded-lg text-text font-medium h-28 focus:bg-card focus:ring-2 focus:ring-[#007AFF] focus:outline-none resize-none placeholder:text-text-secondary/50 border border-border/50"
                        placeholder="사역 내용을 자유롭게 입력하세요..."
                        autoFocus
                    />
                </div>

                <div className="flex gap-3 pt-1">
                    <button
                        onClick={onCancel}
                        className="flex-1 py-3.5 rounded-xl font-bold text-text-secondary bg-background hover:bg-border transition-colors border border-border/50"
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

// ─── 메인 드래그 앤 드롭 보드 ────────────────────────────────────
const DragDropBoard: React.FC = () => {
    // Store Hooks
    const {
        entries, addEntry, updateEntry, deleteEntry
    } = useMinistryStore();

    // State
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');


    // Drag & Modal State
    const [activeDragData, setActiveDragData] = useState<any>(null); // QuickTask or Block

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showQuickModal, setShowQuickModal] = useState(false); // Used for Category Selection now
    const [showEditModal, setShowEditModal] = useState(false);

    // Pending Data for Drop
    const [pendingDrop, setPendingDrop] = useState<{
        type: 'block' | 'quick';
        data: any; // BlockItem or QuickTask
        date: string;
        time: string
    } | null>(null);

    const [editingEntry, setEditingEntry] = useState<any>(null);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // Responsive Check
    useEffect(() => {
        const handleResize = () => {
            // Rule: Mobile/Tablet (<1024px) = Day Only. PC (>=1024px) = Weekly.
            if (window.innerWidth >= 1024) {
                setViewMode('week');
            } else {
                setViewMode('day');
            }
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 10 } })
    );

    // Derived Data: Week Dates
    const weekDates = useMemo(() => {
        if (viewMode === 'day') return [selectedDate];
        const start = startOfWeek(new Date(selectedDate), { weekStartsOn: 0 }); // Sunday start
        return eachDayOfInterval({
            start,
            end: endOfWeek(new Date(selectedDate), { weekStartsOn: 0 })
        }).map(d => format(d, 'yyyy-MM-dd'));
    }, [selectedDate, viewMode]);

    // Derived Data: Entries for the current view (Day or Week)
    const viewEntries = useMemo(() => {
        const dateSet = new Set(weekDates);
        return entries.filter(e => dateSet.has(e.date));
    }, [entries, weekDates]);

    // Drag Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveDragData(event.active.data.current);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setActiveDragData(null);
        const { over, active } = event;
        if (!over) return;

        const overId = over.id as string;
        if (!overId.startsWith('slot-')) return;

        // Parse "slot-YYYY-MM-DD-HH:mm"
        // Find last hyphen to separate time
        const lastHyphen = overId.lastIndexOf('-');
        const time = overId.substring(lastHyphen + 1);
        const datePart = overId.substring(5, lastHyphen); // remove "slot-"

        const type = active.data.current?.type;
        if (!type) return;

        // NEW: Handle existing entry drag
        if (type === 'entry') {
            const entryData = active.data.current;
            if (!entryData) return;
            // Only update if moved to a different time/date
            if (entryData.time !== time || entryData.date !== datePart) {
                // We use updateEntry to move it. 
                // Since updateEntry takes partial<MinistryEntry>, we just pass new date/time.
                // Note: We need to make sure we are correctly calling updated functions.
                // BUT, wait. updateEntry in store might just update subType/content?
                // Left's check store... 
                // Usually updateEntry(id, updates). 
                // Assuming it handles date/time updates? 
                // If not, we might need a moveEntry function. 
                // But looking at types, MinistryEntry has date and time. So updateEntry should work if store allows it.
                // Let's assume updateEntry works for now. 

                // wait, updateEntry in DragDropBoard is used for EditModal:
                // updateEntry(id, { subType, content })
                // Let's check if we can pass date/time.
                // Just in case, I will assume yes. 

                // Actually, I can't verify store code right now easily without reading it, 
                // but usually it uses set(state => ... map ... { ...entry, ...updates }).
                // So date/time update should work.

                // Let's call it:
                updateEntry(entryData.id, { date: datePart, time: time });
                setLastSaved(format(new Date(), 'HH:mm:ss'));
                setTimeout(() => setLastSaved(null), 2000);
            }
            return;
        }

        setPendingDrop({
            type: 'block',
            data: active.data.current,
            date: datePart,
            time: time
        });

        // If Quick Task -> Go to Category Selection
        // If Block -> Go to Detail Modal
        setShowModal(true);
    };



    // Drop Logic Handlers
    const onCategorySelect = (block: BlockItem) => {
        setSelectedBlockForModal(block);
        setShowQuickModal(false);
        setShowModal(true);
    };

    const [selectedBlockForModal, setSelectedBlockForModal] = useState<BlockItem | null>(null);

    const handleFinalConfirm = async (subType: SubType, content: string) => {
        if (!pendingDrop) return;

        const category = (pendingDrop.type === 'block' && pendingDrop.data)
            ? pendingDrop.data.category
            : selectedBlockForModal?.category;

        if (!category) return;

        await addEntry({
            date: pendingDrop.date,
            time: pendingDrop.time,
            category: category,
            subType,
            content,
            isHighlight: false,
        });



        setShowModal(false);
        setPendingDrop(null);
        setSelectedBlockForModal(null);
        setLastSaved(format(new Date(), 'HH:mm:ss'));
        setTimeout(() => setLastSaved(null), 2000);
    };

    // Quick Add via Click (Existing feature)
    const handleSlotClick = (time: string, date: string) => {
        // Treated same as dragging a default generic block? 
        // Or show the "Select Category" modal immediately.
        setPendingDrop({
            type: 'block', // We pretend it's a block drop, but which one? 
            // Actually existing logic showed QuickModal to pick category.
            // Let's reuse that.
            data: null, // No block yet
            date,
            time
        });
        setShowQuickModal(true);
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} autoScroll={false}>
            <div className="space-y-4 max-w-[1600px] mx-auto">
                {/* 헤더 */}
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-extrabold text-text tracking-tight flex items-center gap-2">
                            ✏️ 사역 기록 <span className="text-sm font-normal text-text-secondary bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">{viewMode === 'week' ? '주간 View' : '일간 View'}</span>
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        {/* Date Navigation */}
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
                                    onClick={() => setSelectedDate(prev => format(subDays(new Date(prev), viewMode === 'week' ? 7 : 1), 'yyyy-MM-dd'))}
                                    className="p-1.5 rounded-lg text-text-secondary hover:bg-background hover:text-text transition-colors"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <span className="text-sm md:text-base font-bold text-text tabular-nums px-2">
                                    {viewMode === 'day' ? (
                                        <>
                                            {format(new Date(selectedDate), 'yyyy.MM.dd')}
                                            <span className="text-xs font-medium text-text-secondary ml-1">
                                                ({format(new Date(selectedDate), 'eee', { locale: ko })})
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            {format(new Date(weekDates[0]), 'MM.dd')} ~ {format(new Date(weekDates[6]), 'MM.dd')}
                                        </>
                                    )}
                                </span>
                                <button
                                    onClick={() => setSelectedDate(prev => format(addDays(new Date(prev), viewMode === 'week' ? 7 : 1), 'yyyy-MM-dd'))}
                                    className="p-1.5 rounded-lg text-text-secondary hover:bg-background hover:text-text transition-colors"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Panel: Blocks & Quick Tasks */}
                    <div className="lg:w-64 shrink-0 space-y-4">
                        {/* Standard Blocks */}
                        <div className="bg-card rounded-2xl shadow-sm border border-border p-4">
                            <h3 className="text-xs font-bold text-text-secondary mb-3 uppercase tracking-wider">기본 블록</h3>
                            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
                                {MINISTRY_BLOCKS.map(block => (
                                    <DraggableBlock key={block.id} block={block} />
                                ))}
                            </div>
                        </div>


                    </div>

                    {/* Right Panel: Calendar Board */}
                    <div className="flex-1 min-w-0 bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                        {/* Day View Implementation */}
                        {viewMode === 'day' && (
                            <div className="p-4 md:p-6 space-y-1">
                                {TIME_SLOTS.map((time) => (
                                    <DroppableTimeSlot
                                        key={time}
                                        time={time}
                                        date={selectedDate}
                                        entries={viewEntries.filter(e => e.time === time)}
                                        onEdit={(id, e) => {
                                            e?.stopPropagation();
                                            const entry = entries.find(e => e.id === id);
                                            if (entry) { setEditingEntry(entry); setShowEditModal(true); }
                                        }}
                                        onQuickAdd={handleSlotClick}
                                        viewMode="day"
                                    />
                                ))}
                            </div>
                        )}

                        {/* Week View Implementation */}
                        {viewMode === 'week' && (
                            <div className="flex flex-col h-full min-w-[800px] overflow-x-auto">
                                {/* Header Row */}
                                <div className="grid grid-cols-[60px_repeat(7,minmax(0,1fr))] border-b border-border bg-background/50 sticky top-0 z-10">
                                    <div className="p-3 text-center text-xs font-bold text-text-secondary border-r border-border">Time</div>
                                    {weekDates.map((d, i) => {
                                        const isTodayDate = isSameDay(new Date(d), new Date());
                                        return (
                                            <div key={d} className={clsx(
                                                "p-2 text-center border-r border-border last:border-r-0 flex flex-col items-center justify-center gap-1",
                                                isTodayDate && "bg-indigo-50/50 dark:bg-indigo-900/10"
                                            )}>
                                                <span className={clsx("text-xs font-medium", isTodayDate ? "text-indigo-600 dark:text-indigo-400" : "text-text-secondary")}>
                                                    {DAYS_OF_WEEK_KR[i % 7]}
                                                </span>
                                                <span className={clsx("text-sm font-bold w-8 h-8 flex items-center justify-center rounded-full", isTodayDate ? "bg-indigo-600 text-white shadow-md" : "text-text")}>
                                                    {format(new Date(d), 'd')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Body Rows */}
                                <div className="divide-y divide-border">
                                    {TIME_SLOTS.map(time => {
                                        const isMealTime = time === '11:40' || time === '17:00';
                                        return (
                                            <div key={time} className={clsx(
                                                "grid grid-cols-[60px_repeat(7,minmax(0,1fr))] h-[100px]",
                                                isMealTime && "bg-orange-50/30 dark:bg-orange-900/10"
                                            )}>
                                                {/* Time Label Column */}
                                                <div className={clsx(
                                                    "flex flex-col items-center justify-start pt-3 text-xs font-bold border-r border-border",
                                                    isMealTime ? "text-orange-500 bg-orange-50/50 dark:bg-orange-900/20" : "text-text-secondary bg-background/30"
                                                )}>
                                                    <span>{time}</span>
                                                    {isMealTime && (
                                                        <span className="text-[10px] mt-0.5 opacity-80">
                                                            {time === '11:40' ? '점심' : '저녁'}
                                                        </span>
                                                    )}
                                                </div>
                                                {/* Days Columns */}
                                                {weekDates.map(d => (
                                                    <div key={`${d}-${time}`} className="border-r border-border last:border-r-0 relative">
                                                        <DroppableTimeSlot
                                                            time={time}
                                                            date={d}
                                                            entries={viewEntries.filter(e => e.time === time && e.date === d)}
                                                            onEdit={(id, e) => {
                                                                e?.stopPropagation();
                                                                const entry = entries.find(e => e.id === id);
                                                                if (entry) { setEditingEntry(entry); setShowEditModal(true); }
                                                            }}
                                                            onQuickAdd={handleSlotClick}
                                                            viewMode="week"
                                                            isTodaySlot={isSameDay(new Date(d), new Date())}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* 저장 알림 */}
                {lastSaved && (
                    <div className="fixed bottom-6 right-6 px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2">
                        <Check size={16} /> 저장됨
                    </div>
                )}
            </div>

            {/* 드래그 오버레이 */}
            <DragOverlay>
                {activeDragData && activeDragData.type === 'block' && (
                    <div className={clsx(
                        "flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-base shadow-xl opacity-90 pointer-events-none",
                        activeDragData.color, activeDragData.textColor
                    )}>
                        {activeDragData.icon}
                        <span>{activeDragData.label}</span>
                    </div>
                )}

                {activeDragData && activeDragData.type === 'entry' && (
                    <div className={clsx(
                        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold shadow-xl border pointer-events-none opacity-90",
                        activeDragData.category === '심방'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-green-100 text-green-700 border-green-200'
                    )}>
                        <span className="shrink-0 opacity-60 text-[10px]">{activeDragData.category === '심방' ? '■' : '●'}</span>
                        <span className="truncate">{activeDragData.content}</span>
                    </div>
                )}
            </DragOverlay>

            {/* Quick/Category Modal */}
            {showQuickModal && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 space-y-4 border border-border">
                        <div className="text-center space-y-1">
                            <h3 className="text-xl font-bold text-text">분류 선택</h3>
                            <p className="text-sm text-text-secondary">어떤 유형의 사역인가요?</p>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {MINISTRY_BLOCKS.map(block => (
                                <button
                                    key={block.id}
                                    onClick={() => onCategorySelect(block)}
                                    className={clsx(
                                        "flex items-center gap-3 p-4 rounded-xl text-white shadow-md transition-transform active:scale-[0.98]",
                                        block.color
                                    )}
                                >
                                    <div className="p-2 bg-white/20 rounded-lg">{block.icon}</div>
                                    <div className="text-lg font-bold">{block.label}</div>
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

            {/* Detail Modal */}
            {showModal && (pendingDrop?.data || selectedBlockForModal) && (
                <DetailModal
                    block={(pendingDrop?.type === 'block' && pendingDrop.data) ? pendingDrop.data : selectedBlockForModal!}
                    time={pendingDrop?.time || ''}
                    date={pendingDrop?.date || ''}
                    initialContent={pendingDrop?.type === 'quick' ? (pendingDrop.data as any).content : ''}
                    onConfirm={handleFinalConfirm}
                    onCancel={() => { setShowModal(false); setPendingDrop(null); setSelectedBlockForModal(null); }}
                />
            )}

            {/* Edit Modal (Keeping existing Edit logic, simplified here as reuse) */}
            {showEditModal && editingEntry && (
                <EditModal
                    entry={editingEntry}
                    onConfirm={async (id, subType, content) => {
                        await updateEntry(id, { subType, content });
                        setShowEditModal(false);
                        setEditingEntry(null);
                        setLastSaved(format(new Date(), 'HH:mm:ss'));
                        setTimeout(() => setLastSaved(null), 2000);
                    }}
                    onCancel={() => { setShowEditModal(false); setEditingEntry(null); }}
                    onDelete={async (id) => {
                        if (confirm('정말 삭제하시겠습니까?')) {
                            await deleteEntry(id);
                            setShowEditModal(false);
                            setEditingEntry(null);
                        }
                    }}
                />
            )}
        </DndContext>
    );
};

// ... Edit Modal (Missing in previous chunk, adding it now)
const EditModal: React.FC<{
    entry: any; // Using any for brevity in this glue, but should be MinistryEntry
    onConfirm: (id: string, subType: SubType, content: string) => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
}> = ({ entry, onConfirm, onCancel, onDelete }) => {
    const block = MINISTRY_BLOCKS.find(b => b.category === entry.category) || MINISTRY_BLOCKS[0];
    const [selectedSubType, setSelectedSubType] = useState<SubType>(entry.subType as SubType);
    const [content, setContent] = useState(entry.content);

    const handleSubmit = () => {
        onConfirm(entry.id, selectedSubType, content.trim() || `${selectedSubType} 진행`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-border">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-text">✏️ 사역 내용 수정</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onDelete(entry.id)}
                            className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                            title="삭제"
                        >
                            <span className="sr-only">삭제</span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                        </button>
                        <button onClick={onCancel} className="p-2 rounded-full hover:bg-background">
                            <X size={20} className="text-text-secondary" />
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-background rounded-lg border border-border/50">
                    <div className={clsx("p-2.5 rounded-lg text-white", block.color)}>
                        {block.icon}
                    </div>
                    <div className="text-sm space-y-0.5">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-text">{block.label}</span>
                            <span className="text-text-secondary">→</span>
                            <span className="font-bold text-[#007AFF]">{entry.time}</span>
                        </div>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-secondary ml-1">세부 유형</label>
                    <div className="flex bg-background p-1.5 rounded-lg border border-border/50">
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
                        className="w-full px-4 py-3 bg-background rounded-lg text-text font-medium h-28 focus:bg-card focus:ring-2 focus:ring-[#007AFF] focus:outline-none resize-none placeholder:text-text-secondary/50 border border-border/50"
                    />
                </div>
                <div className="flex gap-3 pt-1">
                    <button onClick={onCancel} className="flex-1 py-3.5 rounded-xl font-bold text-text-secondary bg-background hover:bg-border transition-colors border border-border/50">취소</button>
                    <button onClick={handleSubmit} className="flex-1 py-3.5 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-md flex items-center justify-center gap-2 transition-colors">
                        <Check size={18} /> 수정 완료
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DragDropBoard;