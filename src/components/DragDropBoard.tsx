
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    DndContext,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { useMinistryStore } from '../store/useMinistryStore';
import { type MinistryEntry, type SubType, type Category, TIME_SLOTS } from '../types';
import { format, addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X, Check, ChevronLeft, ChevronRight, Info, Copy, ArrowRightLeft } from 'lucide-react';
import clsx from 'clsx';
import type { BlockItem, BoardEntryItem } from './drag-board/types';
import { MINISTRY_BLOCKS } from './drag-board/blocks';
import DraggableBlock from './drag-board/DraggableBlock';
import DroppableTimeSlot from './drag-board/DroppableTimeSlot';

type ActiveDragData = ({ type: 'block' } & BlockItem) | ({ type: 'entry' } & BoardEntryItem);

const EMPTY_SLOT_ENTRIES: BoardEntryItem[] = [];
const BOARD_GUIDE_KEY = 'drag-board-guide-dismissed-v1';

// ─── ESC 키 훅: 모달에서 ESC로 닫기 ──────────────────────────────
const useEscapeKey = (onEscape: () => void) => {
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onEscape();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onEscape]);
};

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

    // ESC 키로 모달 닫기
    useEscapeKey(onCancel);

    if (!block) return null;

    const handleSubmit = () => {
        onConfirm(selectedSubType, content.trim() || `${selectedSubType} 진행`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card rounded-xl shadow-2xl w-full max-w-md p-6 space-y-5 border border-border">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-text">📝 사역 내용 입력</h3>
                    <button onClick={onCancel} className="p-2 rounded-full hover:bg-background" aria-label="입력 모달 닫기">
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
                                        ? "bg-card text-text shadow-sm ring-1 ring-black/5 scale-[1.02]"
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
                        aria-label="사역 내용 입력"
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

// ─── 이동/복사 선택 모달 ──────────────────────────────────────
// 드롭 위치에 바로 표시되는 컨텍스트 팝오버 — 마우스 이동 최소화
const MoveOrCopyModal: React.FC<{
    entryContent: string;
    position: { x: number; y: number };
    onMove: () => void;
    onCopy: () => void;
    onCancel: () => void;
}> = ({ entryContent, position, onMove, onCopy, onCancel }) => {
    useEscapeKey(onCancel);
    const popoverRef = React.useRef<HTMLDivElement>(null);
    const [adjustedPos, setAdjustedPos] = React.useState(position);

    // 팝오버가 화면 밖으로 나가지 않도록 위치 보정
    React.useEffect(() => {
        const el = popoverRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let { x, y } = position;

        // 오른쪽 넘침 방지 (여백 12px)
        if (x + rect.width > vw - 12) x = vw - rect.width - 12;
        // 아래쪽 넘침 방지
        if (y + rect.height > vh - 12) y = vh - rect.height - 12;
        // 왼쪽/위쪽 최소 12px
        if (x < 12) x = 12;
        if (y < 12) y = 12;

        setAdjustedPos({ x, y });
    }, [position]);

    return (
        /* 반투명 배경: 클릭하면 취소 */
        <div className="fixed inset-0 z-[110] bg-black/30" onClick={onCancel}>
            <div
                ref={popoverRef}
                onClick={(e) => e.stopPropagation()}
                className="absolute bg-card rounded-xl shadow-2xl border border-border p-3 space-y-2 w-56 animate-in fade-in zoom-in-95"
                style={{ left: adjustedPos.x, top: adjustedPos.y }}
            >
                <p className="text-[10px] text-text-secondary truncate px-1 font-semibold">"{entryContent}"</p>
                <button
                    onClick={onMove}
                    className="flex items-center gap-2.5 w-full p-2.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors active:scale-[0.98]"
                >
                    <ArrowRightLeft size={15} />
                    <div className="text-left">
                        <div className="text-sm font-bold">이동</div>
                        <div className="text-[9px] opacity-60">원래 위치 → 새 위치</div>
                    </div>
                </button>
                <button
                    onClick={onCopy}
                    className="flex items-center gap-2.5 w-full p-2.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors active:scale-[0.98]"
                >
                    <Copy size={15} />
                    <div className="text-left">
                        <div className="text-sm font-bold">복사</div>
                        <div className="text-[9px] opacity-60">원래 유지 + 새 위치 추가</div>
                    </div>
                </button>
            </div>
        </div>
    );
};

// ─── 메인 드래그 앤 드롭 보드 ────────────────────────────────────
const DragDropBoard: React.FC = () => {
    // Store Hooks - 개별 selector로 분리하여 불필요한 리렌더 방지
    const entries = useMinistryStore(state => state.entries);
    const addEntry = useMinistryStore(state => state.addEntry);
    const updateEntry = useMinistryStore(state => state.updateEntry);
    const deleteEntry = useMinistryStore(state => state.deleteEntry);

    // 최신 entries에 접근하기 위한 ref — handleEdit 콜백의 참조를 안정적으로 유지
    const entriesRef = useRef(entries);
    entriesRef.current = entries;

    // State
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

    // 오늘 날짜를 1회만 계산하여 캐싱 — 매 슬롯마다 new Date() 생성 방지
    const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);

    // Drag & Modal State
    const [activeDragData, setActiveDragData] = useState<ActiveDragData | null>(null);

    // Modals
    const [showModal, setShowModal] = useState(false);
    const [showQuickModal, setShowQuickModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    // 이동/복사 선택 모달 상태
    const [showMoveOrCopyModal, setShowMoveOrCopyModal] = useState(false);
    // 드롭 위치 좌표 — 팝오버를 드롭한 자리에 표시하기 위해
    const [dropPosition, setDropPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [pendingEntryDrop, setPendingEntryDrop] = useState<{
        entry: BoardEntryItem;
        newDate: string;
        newTime: string;
    } | null>(null);

    // Pending Data for Drop
    const [pendingDrop, setPendingDrop] = useState<{ data: BlockItem | null; date: string; time: string } | null>(null);

    const [editingEntry, setEditingEntry] = useState<MinistryEntry | null>(null);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const [showGuide, setShowGuide] = useState(() => !localStorage.getItem(BOARD_GUIDE_KEY));
    const [highlightedSlotKey, setHighlightedSlotKey] = useState<string | null>(null);

    // Responsive Check
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setViewMode('week');
            } else {
                setViewMode('day');
            }
        };
        handleResize();
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
        const start = startOfWeek(new Date(selectedDate), { weekStartsOn: 0 });
        return eachDayOfInterval({
            start,
            end: endOfWeek(new Date(selectedDate), { weekStartsOn: 0 })
        })
            .filter((d) => d.getDay() !== 1) // 월요일 제외
            .map((d) => format(d, 'yyyy-MM-dd'));
    }, [selectedDate, viewMode]);

    const weekGridTemplateColumns = useMemo(
        () => `60px repeat(${weekDates.length}, minmax(0, 1fr))`,
        [weekDates.length],
    );

    const weekRangeStart = weekDates[0];
    const weekRangeEnd = weekDates[weekDates.length - 1];

    // Derived Data: Entries for the current view
    const viewEntries = useMemo(() => {
        const dateSet = new Set(weekDates);
        return entries.filter(e => dateSet.has(e.date));
    }, [entries, weekDates]);

    const entriesBySlot = useMemo(() => {
        const map = new Map<string, BoardEntryItem[]>();
        for (const entry of viewEntries) {
            const key = `${entry.date}|${entry.time}`;
            // MinistryEntry → BoardEntryItem 변환을 여기서 1회만 수행하여 캐싱
            const boardItem: BoardEntryItem = {
                id: entry.id,
                subType: entry.subType,
                content: entry.content,
                category: entry.category,
                time: entry.time,
                date: entry.date,
            };
            const list = map.get(key);
            if (list) {
                list.push(boardItem);
            } else {
                map.set(key, [boardItem]);
            }
        }
        return map;
    }, [viewEntries]);

    // useCallback으로 안정적인 참조 유지 → DroppableTimeSlot의 React.memo가 제대로 동작
    const getSlotEntries = useCallback((date: string, time: string) => {
        return entriesBySlot.get(`${date}|${time}`) ?? EMPTY_SLOT_ENTRIES;
    }, [entriesBySlot]);

    const flashSlot = useCallback((date: string, time: string) => {
        const key = `${date}|${time}`;
        setHighlightedSlotKey(key);
        setTimeout(() => setHighlightedSlotKey(null), 1500);
    }, []);

    const showSavedToast = useCallback(() => {
        setLastSaved(format(new Date(), 'HH:mm:ss'));
        setTimeout(() => setLastSaved(null), 2000);
    }, []);

    // Drag Handlers
    const handleDragStart = useCallback((event: DragStartEvent) => {
        const data = event.active.data.current;
        if (data && (data.type === 'block' || data.type === 'entry')) {
            setActiveDragData(data as ActiveDragData);
            return;
        }
        setActiveDragData(null);
    }, []);

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        setActiveDragData(null);
        const { over, active } = event;
        if (!over) return;

        const overId = over.id as string;
        if (!overId.startsWith('slot-')) return;

        const lastHyphen = overId.lastIndexOf('-');
        const time = overId.substring(lastHyphen + 1);
        const datePart = overId.substring(5, lastHyphen);

        const type = active.data.current?.type;
        if (!type) return;

        // 기존 엔트리 드래그 → 드롭 위치에 이동/복사 팝오버 표시
        if (type === 'entry') {
            const entryData = active.data.current as BoardEntryItem | undefined;
            if (!entryData) return;
            // 같은 위치면 무시
            if (entryData.time === time && entryData.date === datePart) return;

            // 드롭된 슬롯의 DOM 위치를 기준으로 팝오버 좌표 계산
            const overNode = over.rect;
            const posX = overNode ? overNode.left + overNode.width / 2 : 0;
            const posY = overNode ? overNode.top : 0;
            setDropPosition({ x: posX, y: posY });

            setPendingEntryDrop({ entry: entryData, newDate: datePart, newTime: time });
            setShowMoveOrCopyModal(true);
            return;
        }

        setPendingDrop({ data: active.data.current as BlockItem, date: datePart, time });
        setShowModal(true);
    }, []);

    // 엔트리 이동 처리
    const handleEntryMove = useCallback(async () => {
        if (!pendingEntryDrop) return;
        await updateEntry(pendingEntryDrop.entry.id, {
            date: pendingEntryDrop.newDate,
            time: pendingEntryDrop.newTime,
        });
        showSavedToast();
        flashSlot(pendingEntryDrop.newDate, pendingEntryDrop.newTime);
        setShowMoveOrCopyModal(false);
        setPendingEntryDrop(null);
    }, [pendingEntryDrop, updateEntry, showSavedToast, flashSlot]);

    // 엔트리 복사 처리
    const handleEntryCopy = useCallback(async () => {
        if (!pendingEntryDrop) return;
        const { entry, newDate, newTime } = pendingEntryDrop;
        await addEntry({
            date: newDate,
            time: newTime,
            category: entry.category as Category,
            subType: entry.subType as SubType,
            content: entry.content,
            isHighlight: false,
        });
        showSavedToast();
        flashSlot(newDate, newTime);
        setShowMoveOrCopyModal(false);
        setPendingEntryDrop(null);
    }, [pendingEntryDrop, addEntry, showSavedToast, flashSlot]);

    const handleCancelMoveOrCopy = useCallback(() => {
        setShowMoveOrCopyModal(false);
        setPendingEntryDrop(null);
    }, []);

    // Drop Logic Handlers
    const [selectedBlockForModal, setSelectedBlockForModal] = useState<BlockItem | null>(null);

    const onCategorySelect = useCallback((block: BlockItem) => {
        setSelectedBlockForModal(block);
        setShowQuickModal(false);
        setShowModal(true);
    }, []);

    const handleFinalConfirm = useCallback(async (subType: SubType, content: string) => {
        if (!pendingDrop) return;

        const category = pendingDrop.data?.category ?? selectedBlockForModal?.category;
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
        showSavedToast();
        flashSlot(pendingDrop.date, pendingDrop.time);
    }, [pendingDrop, selectedBlockForModal, addEntry, showSavedToast, flashSlot]);

    // Quick Add via Click
    const handleSlotClick = useCallback((time: string, date: string) => {
        setPendingDrop({ data: null, date, time });
        setShowQuickModal(true);
    }, []);

    // Edit handler - entriesRef를 사용하여 콜백 참조를 안정화
    // entries가 바뀌어도 handleEdit 참조는 유지되므로 DroppableTimeSlot의 memo가 깨지지 않음
    const handleEdit = useCallback((id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const entry = entriesRef.current.find(e => e.id === id);
        if (entry) {
            setEditingEntry(entry);
            setShowEditModal(true);
        }
    }, []);

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} autoScroll={false}>
            <div className="space-y-4 max-w-[1600px] mx-auto">
                {showGuide && (
                    <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
                        <Info size={18} className="text-blue-600 mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-blue-900">
                                블록을 시간칸으로 드래그하거나, 시간칸을 탭해서 빠르게 추가할 수 있어요.
                            </p>
                            <p className="text-xs text-blue-700/80 mt-1">
                                모바일은 탭 추가가 더 빠르고, PC는 주간 뷰에서 드래그 이동이 편합니다.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                localStorage.setItem(BOARD_GUIDE_KEY, '1');
                                setShowGuide(false);
                            }}
                            className="text-xs font-bold text-blue-700 hover:underline"
                        >
                            닫기
                        </button>
                    </div>
                )}

                {/* 헤더: 제목 + 기본 블록 + 날짜 네비게이션을 한 줄로 */}
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-3">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-2xl font-extrabold text-text tracking-tight flex items-center gap-2">
                            ✏️ 사역 기록 <span className="text-sm font-normal text-text-secondary bg-black/5 px-2 py-0.5 rounded-full">{viewMode === 'week' ? '주간 View' : '일간 View'}</span>
                        </h2>
                        {/* 기본 블록 - 헤더에 인라인 배치 */}
                        <div className="flex items-center gap-1.5">
                            {MINISTRY_BLOCKS.map(block => (
                                <DraggableBlock key={block.id} block={block} />
                            ))}
                        </div>
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
                                            {weekRangeStart && weekRangeEnd
                                                ? `${format(new Date(weekRangeStart), 'MM.dd')} ~ ${format(new Date(weekRangeEnd), 'MM.dd')}`
                                                : ''}
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
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 font-bold">저장 자동 동기화</span>
                    <span className="px-2.5 py-1 rounded-full bg-background border border-border text-text-secondary font-semibold">
                        {viewMode === 'week' ? 'PC/대화면: 주간 보기' : '모바일/태블릿: 일간 보기'}
                    </span>
                </div>

                {/* 타임테이블 */}
                <div className="flex flex-col gap-4">
                    <div className="flex-1 min-w-0 bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                        {/* Day View */}
                        {viewMode === 'day' && (
                            <div className="p-4 md:p-6 space-y-1">
                                {TIME_SLOTS.map((time) => (
                                    <DroppableTimeSlot
                                        key={time}
                                        time={time}
                                        date={selectedDate}
                                        entries={getSlotEntries(selectedDate, time)}
                                        onEdit={handleEdit}
                                        onQuickAdd={handleSlotClick}
                                        viewMode="day"
                                        isHighlighted={highlightedSlotKey === `${selectedDate}|${time}`}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Week View */}
                        {viewMode === 'week' && (
                            <div className="flex flex-col h-full min-w-[800px] overflow-x-auto">
                                {/* Header Row */}
                                <div
                                    className="grid border-b border-border bg-background/50 sticky top-0 z-10"
                                    style={{ gridTemplateColumns: weekGridTemplateColumns }}
                                >
                                    <div className="p-3 text-center text-xs font-bold text-text-secondary border-r border-border">Time</div>
                                    {weekDates.map((d) => {
                                        const isTodayDate = d === todayStr;
                                        return (
                                            <div key={d} className={clsx(
                                                "p-2 text-center border-r border-border last:border-r-0 flex flex-col items-center justify-center gap-1",
                                                isTodayDate && "bg-indigo-50/50"
                                            )}>
                                                <span className={clsx("text-xs font-medium", isTodayDate ? "text-indigo-600" : "text-text-secondary")}>
                                                    {format(new Date(d), 'eee', { locale: ko })}
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
                                            <div
                                                key={time}
                                                className={clsx(
                                                    "grid h-[100px]",
                                                    isMealTime && "bg-orange-50/30"
                                                )}
                                                style={{ gridTemplateColumns: weekGridTemplateColumns }}
                                            >
                                                {/* Time Label Column */}
                                                <div className={clsx(
                                                    "flex flex-col items-center justify-start pt-3 text-xs font-bold border-r border-border",
                                                    isMealTime ? "text-orange-500 bg-orange-50/50" : "text-text-secondary bg-background/30"
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
                                                            entries={getSlotEntries(d, time)}
                                                            onEdit={handleEdit}
                                                            onQuickAdd={handleSlotClick}
                                                            viewMode="week"
                                                            isTodaySlot={d === todayStr}
                                                            isHighlighted={highlightedSlotKey === `${d}|${time}`}
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
                    <div className="fixed bottom-6 right-6 px-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-lg animate-in fade-in slide-in-from-bottom-2" role="status" aria-live="polite">
                        <Check size={16} /> 저장됨 ({lastSaved})
                    </div>
                )}
            </div>

            {/* 드래그 오버레이 */}
            <DragOverlay>
                {activeDragData && activeDragData.type === 'block' && (
                    <div className={clsx(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold text-xs shadow-xl opacity-90 pointer-events-none",
                        activeDragData.color, activeDragData.textColor
                    )}>
                        <div className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{activeDragData.icon}</div>
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

            {/* 이동/복사 선택 모달 */}
            {showMoveOrCopyModal && pendingEntryDrop && (
                <MoveOrCopyModal
                    entryContent={pendingEntryDrop.entry.content}
                    position={dropPosition}
                    onMove={handleEntryMove}
                    onCopy={handleEntryCopy}
                    onCancel={handleCancelMoveOrCopy}
                />
            )}

            {/* Quick/Category Modal */}
            {showQuickModal && (
                <QuickCategoryModal
                    onCategorySelect={onCategorySelect}
                    onCancel={() => { setShowQuickModal(false); setPendingDrop(null); }}
                />
            )}

            {/* Detail Modal */}
            {showModal && pendingDrop && (pendingDrop.data || selectedBlockForModal) && (
                <DetailModal
                    block={pendingDrop.data ?? selectedBlockForModal!}
                    time={pendingDrop.time}
                    date={pendingDrop.date}
                    onConfirm={handleFinalConfirm}
                    onCancel={() => { setShowModal(false); setPendingDrop(null); setSelectedBlockForModal(null); }}
                />
            )}

            {/* Edit Modal */}
            {showEditModal && editingEntry && (
                <EditModal
                    entry={editingEntry}
                    onConfirm={async (id, subType, content) => {
                        await updateEntry(id, { subType, content });
                        flashSlot(editingEntry.date, editingEntry.time);
                        setShowEditModal(false);
                        setEditingEntry(null);
                        showSavedToast();
                    }}
                    onCancel={() => { setShowEditModal(false); setEditingEntry(null); }}
                    onDelete={async (id) => {
                        await deleteEntry(id);
                        setShowEditModal(false);
                        setEditingEntry(null);
                    }}
                />
            )}
        </DndContext>
    );
};

// ─── Quick Category 모달 (분리하여 리렌더 최소화) ─────────────────
const QuickCategoryModal: React.FC<{
    onCategorySelect: (block: BlockItem) => void;
    onCancel: () => void;
}> = ({ onCategorySelect, onCancel }) => {
    useEscapeKey(onCancel);

    return (
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
                            aria-label={`${block.label} 선택`}
                        >
                            <div className="p-2 bg-white/20 rounded-lg">{block.icon}</div>
                            <div className="text-lg font-bold">{block.label}</div>
                        </button>
                    ))}
                </div>
                <button
                    onClick={onCancel}
                    className="w-full py-3 text-sm font-bold text-text-secondary hover:text-text"
                >
                    취소
                </button>
            </div>
        </div>
    );
};

// ─── Edit Modal ───────────────────────────────────────────────
const EditModal: React.FC<{
    entry: MinistryEntry;
    onConfirm: (id: string, subType: SubType, content: string) => void;
    onCancel: () => void;
    onDelete: (id: string) => void;
}> = ({ entry, onConfirm, onCancel, onDelete }) => {
    const block = MINISTRY_BLOCKS.find(b => b.category === entry.category) || MINISTRY_BLOCKS[0];
    const [selectedSubType, setSelectedSubType] = useState<SubType>(entry.subType as SubType);
    const [content, setContent] = useState(entry.content);
    // confirm() 대신 인라인 삭제 확인 — 모달 뒤로 가려지는 문제 방지
    const [confirmDelete, setConfirmDelete] = useState(false);

    // ESC 키로 닫기 (삭제 확인 중이면 확인 상태만 취소)
    useEscapeKey(() => {
        if (confirmDelete) {
            setConfirmDelete(false);
        } else {
            onCancel();
        }
    });

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
                            onClick={() => setConfirmDelete(true)}
                            className="p-2 rounded-full hover:bg-red-50 text-red-500 transition-colors"
                            title="삭제"
                            aria-label="일정 삭제"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
                        </button>
                        <button onClick={onCancel} className="p-2 rounded-full hover:bg-background" aria-label="수정 모달 닫기">
                            <X size={20} className="text-text-secondary" />
                        </button>
                    </div>
                </div>

                {/* 삭제 확인 인라인 배너 — confirm() 대신 모달 안에서 처리 */}
                {confirmDelete && (
                    <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-xl animate-in fade-in">
                        <span className="text-sm font-bold text-red-700">정말 삭제하시겠습니까?</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setConfirmDelete(false)}
                                className="px-3 py-1.5 text-xs font-bold text-text-secondary bg-white rounded-lg border border-border hover:bg-background transition-colors"
                            >
                                아니오
                            </button>
                            <button
                                onClick={() => onDelete(entry.id)}
                                className="px-3 py-1.5 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                            >
                                삭제
                            </button>
                        </div>
                    </div>
                )}

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
                                        ? "bg-card text-text shadow-sm ring-1 ring-black/5"
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
                        aria-label="사역 내용 수정"
                        autoFocus
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
