
import React, { useState } from 'react';
import { useMinistryStore } from '../store/useMinistryStore';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Trash2, Search } from 'lucide-react';
import clsx from 'clsx';

const HistoryPage: React.FC = () => {
    const { entries, deleteEntry } = useMinistryStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');

    const filteredEntries = entries.filter((entry) => {
        const matchSearch = entry.content.includes(searchTerm) || entry.subType.includes(searchTerm);
        const matchCategory = filterCategory === 'ALL' || entry.category === filterCategory;
        return matchSearch && matchCategory;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const handleDelete = (id: string) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            deleteEntry(id);
        }
    };

    return (
        <div className="p-4 space-y-6 max-w-3xl mx-auto pb-24">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 flex items-center gap-2">
                📋 기록 관리
            </h2>

            {/* Search & Filter */}
            <div className="flex flex-col gap-4 bg-white p-5 rounded-3xl shadow-xl shadow-gray-100 border border-gray-100/50">
                <div className="relative group">
                    <Search size={18} className="absolute top-3.5 left-4 text-gray-400 group-focus-within:text-[#007AFF] transition-colors" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-gray-100/50 rounded-2xl text-gray-900 font-medium focus:bg-white focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-400"
                        placeholder="사역 내용으로 검색..."
                    />
                </div>
                <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-500 ml-1">필터</label>
                    <div className="flex-1 flex bg-gray-100/50 p-1 rounded-xl">
                        {['ALL', '심방', '업무', '기타'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={clsx(
                                    "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                    filterCategory === cat
                                        ? "bg-white text-gray-900 shadow-sm"
                                        : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                {cat === 'ALL' ? '전체' : cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="space-y-4">
                {filteredEntries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-gray-400 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <span className="text-4xl mb-2">🔍</span>
                        <span className="font-medium text-gray-500">검색 결과가 없습니다.</span>
                    </div>
                ) : (
                    filteredEntries.map((entry) => (
                        <div key={entry.id} className="bg-white p-5 rounded-3xl shadow-lg shadow-gray-100/50 border border-gray-100 flex flex-col gap-3 transition-transform active:scale-[0.98] group relative">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${entry.category === '심방' ? 'bg-blue-100 text-blue-700' :
                                        entry.category === '업무' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                                        }`}>
                                        {entry.subType}
                                    </span>
                                    {entry.isHighlight && (
                                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-[10px] font-bold flex items-center gap-0.5">
                                            ✨ 핵심
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 font-semibold bg-gray-50 px-2 py-1 rounded-lg">
                                    {format(new Date(entry.date), 'yyyy.MM.dd(eee)', { locale: ko })} {entry.time}
                                </span>
                            </div>

                            <p className="text-gray-800 text-base font-medium leading-relaxed">
                                {entry.content}
                            </p>

                            <button
                                onClick={() => handleDelete(entry.id)}
                                className="absolute -top-2 -right-2 p-2 bg-red-50 text-red-500 rounded-full shadow-md border border-red-100 opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default HistoryPage;
