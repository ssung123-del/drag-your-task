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
                "flex items-center gap-2 md:gap-3 px-4 py-3 md:px-5 md:py-3.5 rounded-2xl font-bold transition-transform select-none touch-none shadow-lg outline-none w-full lg:max-w-[180px]",
                block.color,
                block.textColor,
                isDragging ? "opacity-30 scale-95" : "opacity-100 hover:scale-[1.02]"
            )}
        >
            <GripVertical size={16} className="opacity-40 shrink-0" />
            <div className="shrink-0">{block.icon}</div>
            <span className="text-sm md:text-base whitespace-nowrap">{block.label}</span>
        </div>
    );
};

export default DraggableBlock;
