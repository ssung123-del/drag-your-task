import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Pencil } from 'lucide-react';
import clsx from 'clsx';
import type { BoardEntryItem } from './types';

interface DraggableEntryProps {
    entry: BoardEntryItem;
    viewMode: 'day' | 'week';
    onEdit: (id: string, e: React.MouseEvent) => void;
}

// React.memo로 감싸서 동일한 entry면 리렌더 방지
const DraggableEntry: React.FC<DraggableEntryProps> = React.memo(({ entry, viewMode, onEdit }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: entry.id,
        data: { type: 'entry', ...entry },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            aria-label={`${entry.date} ${entry.time} ${entry.subType} 일정`}
            className={clsx(
                "group/card flex items-center gap-1.5 rounded-lg text-[10px] font-bold shadow-sm border select-none transition-all w-full overflow-hidden cursor-grab active:cursor-grabbing",
                viewMode === 'day' ? "px-3 py-2 text-xs" : "px-1.5 py-1",
                entry.category === '심방'
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-green-100 text-green-700 border-green-200',
                isDragging ? "opacity-30 z-50 scale-95" : "opacity-100 hover:scale-[1.02]"
            )}
            style={{ touchAction: 'none' }}
        >
            <span className="shrink-0 opacity-60 text-[10px]">{entry.category === '심방' ? '■' : '●'}</span>
            <span className="truncate flex-1 text-left">{entry.content}</span>

            <div className={clsx("flex items-center gap-0.5 shrink-0 opacity-0 group-hover/card:opacity-100 transition-opacity", viewMode === 'week' && "hidden group-hover/card:flex")}>
                <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => onEdit(entry.id, e)}
                    className="p-1 rounded hover:bg-black/10 transition-colors"
                    aria-label="일정 수정"
                >
                    <Pencil size={10} />
                </button>
            </div>
        </div>
    );
});

export default DraggableEntry;
