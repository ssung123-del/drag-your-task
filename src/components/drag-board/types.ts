import type React from 'react';
import type { Category, SubType } from '../../types';

export interface BlockItem {
    id: string;
    category: Category;
    label: string;
    icon: React.ReactNode;
    color: string;
    textColor: string;
    subTypes: { value: SubType; label: string }[];
}

export interface BoardEntryItem {
    id: string;
    subType: string;
    content: string;
    category: string;
    time: string;
    date: string;
}
