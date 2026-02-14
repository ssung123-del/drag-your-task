import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical } from 'lucide-react';
import clsx from 'clsx';
import type { BlockItem } from './types';

interface DraggableBlockProps {
    block: BlockItem;
}

const DraggableBlock: React.FC<DraggableBlockProps> = ({ block }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: block.id,
        data: { type: 'block', ...block },
    });

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            role="button"
            aria-label={`${block.label} 블록 드래그`}
            className={clsx(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-bold transition-transform select-none touch-none shadow-sm outline-none text-xs",
                block.color,
                block.textColor,
                isDragging ? "opacity-30 scale-95" : "opacity-100 hover:scale-[1.03]"
            )}
        >
            <GripVertical size={12} className="opacity-40 shrink-0" />
            <div className="shrink-0 [&>svg]:w-3.5 [&>svg]:h-3.5">{block.icon}</div>
            <span className="whitespace-nowrap">{block.label}</span>
        </div>
    );
};

export default DraggableBlock;
