import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import clsx from 'clsx';
import DraggableEntry from './DraggableEntry';
import type { BoardEntryItem } from './types';

interface DroppableTimeSlotProps {
    time: string;
    date: string;
    entries: BoardEntryItem[];
    onEdit: (id: string, e: React.MouseEvent) => void;
    onQuickAdd: (time: string, date: string) => void;
    viewMode: 'day' | 'week';
    isTodaySlot?: boolean;
    isHighlighted?: boolean;
}

const DroppableTimeSlot: React.FC<DroppableTimeSlotProps> = React.memo(({
    time,
    date,
    entries,
    onEdit,
    onQuickAdd,
    viewMode,
    isTodaySlot,
    isHighlighted,
}) => {
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
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onQuickAdd(time, date);
                }
            }}
            aria-label={`${date} ${time} 슬롯에 일정 추가`}
            className={clsx(
                "relative flex items-stretch rounded-xl transition-colors duration-150 group cursor-pointer border",
                viewMode === 'day' ? "gap-3 min-h-[60px]" : "h-full flex-col p-1 gap-1 overflow-hidden",
                isHighlighted && "ring-2 ring-emerald-400 border-emerald-200 bg-emerald-50/40",
                isOver
                    ? "bg-indigo-50 ring-2 ring-indigo-300 border-transparent"
                    : isTodaySlot
                        ? "bg-indigo-50/30 border-indigo-100 hover:bg-indigo-50"
                        : "bg-card border-border/50 hover:bg-background/80 active:bg-background"
            )}
        >
            {viewMode === 'day' && (
                <div className="w-16 md:w-20 shrink-0 flex items-center justify-center border-r border-border/50">
                    <span className={clsx(
                        "text-xs md:text-sm font-bold tabular-nums",
                        isMealTime ? "text-orange-500" : (isOver ? "text-indigo-600" : "text-text-secondary")
                    )}>
                        {getTimeLabel(time)}
                    </span>
                </div>
            )}

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
        prev.isHighlighted === next.isHighlighted &&
        prev.entries === next.entries &&
        prev.onEdit === next.onEdit &&
        prev.onQuickAdd === next.onQuickAdd;
});

export default DroppableTimeSlot;
