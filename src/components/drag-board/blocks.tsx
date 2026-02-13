import { Briefcase, Home } from 'lucide-react';
import type { BlockItem } from './types';

export const MINISTRY_BLOCKS: BlockItem[] = [
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
