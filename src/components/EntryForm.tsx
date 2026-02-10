
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMinistryStore } from '../store/useMinistryStore';
import { type Category, type SubType, TIME_SLOTS } from '../types';
import { format } from 'date-fns';
import { Check, Send, Star } from 'lucide-react';
import clsx from 'clsx';

type FormValues = {
    date: string;
    time: string;
    category: Category;
    subType: SubType;
    content: string;
    isHighlight: boolean;
};

const CATEGORIES: Category[] = ['심방', '업무', '기타'];

const SUB_TYPES: Record<Category, SubType[]> = {
    '심방': ['방문심방', '카페심방', '전화심방'],
    '업무': ['회의', '행정', '기타'],
    '기타': ['새벽기도', '기타'],
};

const EntryForm: React.FC = () => {
    const { addEntry } = useMinistryStore();
    const [lastSaved, setLastSaved] = useState<string | null>(null);


    const { register, handleSubmit, watch, reset, setValue } = useForm<FormValues>({
        defaultValues: {
            date: format(new Date(), 'yyyy-MM-dd'),
            time: '09:00', // Initial default, heavily overridden by useEffect
            category: '심방',
            subType: '방문심방',
            content: '',
            isHighlight: false,
        }
    });

    // Initialize with current time and date
    React.useEffect(() => {
        const now = new Date();
        setValue('date', format(now, 'yyyy-MM-dd'));

        // Find closest time slot or default to current hour
        const currentHour = now.getHours();
        const timeString = `${currentHour.toString().padStart(2, '0')}:00`;
        // If exact hour exists in TIME_SLOTS use it, otherwise default to a reasonable fallback
        if (TIME_SLOTS.includes(timeString)) {
            setValue('time', timeString);
        } else {
            // Fallback logic if needed, or stick to default
            // For simplicity, let's try to match the closest slot if exact match fails
            // (Optional: implement closest match logic here if desired)
        }
    }, [setValue]);

    const selectedCategory = watch('category');



    // Helper to get current closest time slot
    const getCurrentTimeSlot = () => {
        const now = new Date();
        const currentHour = now.getHours();
        const timeString = `${currentHour.toString().padStart(2, '0')}:00`;
        return TIME_SLOTS.includes(timeString) ? timeString : '09:00';
    };

    // Update the submit handler to reset with CURRENT time
    const onSubmitHandler = (data: FormValues) => {
        addEntry(data);
        const now = new Date();
        setLastSaved(format(now, 'HH:mm:ss'));

        reset({
            category: data.category,
            subType: data.subType,
            date: format(now, 'yyyy-MM-dd'), // Update to current date
            time: getCurrentTimeSlot(), // Update to current time slot
            content: '',
            isHighlight: false,
        });

        setTimeout(() => setLastSaved(null), 3000);
    };
    return (

        <div className="bg-card p-6 rounded-3xl shadow-xl border border-border">
            <h2 className="text-2xl font-bold mb-6 text-text flex items-center gap-2">
                ✏️ 사역 기록
            </h2>

            <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-secondary ml-1">날짜</label>
                        <input
                            type="date"
                            {...register('date')}
                            className="w-full px-4 py-3 bg-background rounded-2xl text-text font-medium focus:bg-card focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-text-secondary ml-1">시간</label>
                        <div className="relative">
                            <select
                                {...register('time')}
                                className="w-full px-4 py-3 bg-background rounded-2xl text-text font-medium appearance-none focus:bg-card focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                            >
                                {TIME_SLOTS.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            {/* Custom arrow could go here */}
                        </div>
                    </div>
                </div>

                {/* Category Buttons (Segmented Control) */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-secondary ml-1">카테고리</label>
                    <div className="flex bg-background p-1.5 rounded-2xl">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                type="button"
                                onClick={() => {
                                    setValue('category', cat);
                                    setValue('subType', SUB_TYPES[cat][0]);
                                }}
                                className={clsx(
                                    "flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200",
                                    selectedCategory === cat
                                        ? "bg-card text-text shadow-sm ring-1 ring-black/5"
                                        : "text-text-secondary hover:text-text"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* SubType Select */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-secondary ml-1">세부 유형</label>
                    <select
                        {...register('subType')}
                        className="w-full px-4 py-3 bg-background rounded-2xl text-text font-medium appearance-none focus:bg-card focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    >
                        {SUB_TYPES[selectedCategory].map(st => (
                            <option key={st} value={st}>{st}</option>
                        ))}
                    </select>
                </div>

                {/* Content */}
                <div className="space-y-2">
                    <label className="block text-sm font-semibold text-text-secondary ml-1">내용</label>
                    <textarea
                        {...register('content', { required: true })}
                        className="w-full px-4 py-3 bg-background rounded-2xl text-text h-32 focus:bg-card focus:ring-2 focus:ring-primary focus:outline-none resize-none transition-all placeholder:text-text-secondary/50"
                        placeholder="사역 내용을 입력하세요..."
                    />
                </div>

                {/* Highlight Toggle Button */}
                <button
                    type="button"
                    onClick={() => setValue('isHighlight', !watch('isHighlight'))}
                    className={clsx(
                        "w-full flex items-center justify-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer group",
                        watch('isHighlight')
                            ? "bg-yellow-500/10 border-yellow-400/50 text-yellow-600 shadow-sm"
                            : "bg-card border-border text-text-secondary hover:bg-background hover:border-border"
                    )}
                >
                    <Star
                        size={24}
                        className={clsx(
                            "transition-all duration-300",
                            watch('isHighlight') ? "fill-yellow-400 text-yellow-400 scale-110" : "text-gray-400 group-hover:text-gray-500"
                        )}
                    />
                    <span className="font-bold text-lg">
                        {watch('isHighlight') ? "중요 사역입니다" : "중요 사역으로 표시"}
                    </span>
                </button>

                {/* Submit Button */}
                <button
                    type="submit"
                    className="w-full bg-[#007AFF] hover:bg-[#0062cc] text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                >
                    <Send size={20} />
                    기록 저장하기
                </button>
            </form>

            {/* Success Feedback */}
            {lastSaved && (
                <div className="mt-6 p-4 bg-green-100 text-green-800 rounded-2xl flex items-center justify-center gap-2 animate-fade-in text-base font-bold shadow-inner">
                    <Check size={20} />
                    저장되었습니다 ({lastSaved})
                </div>
            )}
        </div>
    );
};

export default EntryForm;
