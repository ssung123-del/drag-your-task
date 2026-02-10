export type Category = '심방' | '업무' | '기타';

export type SubType =
    | '방문심방' | '카페심방' | '전화심방' // 심방
    | '회의' | '행정' | '기타' // 업무
    | '새벽기도' | '기타'; // 기타

export interface MinistryEntry {
    id: string;
    date: string; // YYYY-MM-DD
    time: string; // "05:00", "06:00", ..., "11:40", "12:40", ...
    category: Category;
    subType: SubType;
    content: string;
    isHighlight: boolean;
    createdAt: string;
}

export interface WeeklyPlan {
    weekStartDate: string; // Sunday of the week (YYYY-MM-DD)
    plans: {
        [key: string]: string; // "Sunday", "Monday", ..., "Remarks" -> Content
    };
}

export interface WeeklyNote {
    weekStartDate: string; // Sunday of the week
    specialNote: string;
    dawnPrayerDays: string[]; // ["Mon", "Tue", "Wed", "Thu", "Fri"]
}

export interface UserProfile {
    name: string;
    department: string;
    churchName: "오륜교회"; // Fixed
}

export const TIME_SLOTS = [
    "05:00", "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "11:40", // Lunch
    "12:40", "14:00", "15:00", "16:00",
    "17:00", // Dinner (17:00-18:00)
    "18:00",
    "19:00", "20:00", "21:00", "22:00", "23:00"
];

export const DAYS_OF_WEEK_KR = ["주일", "월", "화", "수", "목", "금", "토"];
export const PLAN_LABELS = [...DAYS_OF_WEEK_KR, "비고"];

