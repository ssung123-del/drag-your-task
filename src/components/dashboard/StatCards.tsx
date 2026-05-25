/**
 * StatCards.tsx
 *
 * 핵심 요약 카드 4장 — 전주 대비 변화량(▲/▼) 포함
 * 왜 변화량을 보여주는가? → 단순 숫자보다 "추세"가 사역 동기부여에 효과적
 */

import React from 'react';
import { TrendingUp, Coffee, PhoneCall, BarChart2, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import clsx from 'clsx';
import type { WeeklyStats, StatsDiff } from '../../lib/dashboard-utils';

interface StatCardsProps {
  stats: WeeklyStats;
  diff: StatsDiff;
}

/** 변화량 뱃지 — 양수면 초록, 음수면 빨강, 0이면 회색 */
const DiffBadge: React.FC<{ value: number }> = ({ value }) => {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-text-secondary/60 bg-background px-1.5 py-0.5 rounded-full">
        <Minus size={10} />
        동일
      </span>
    );
  }

  const isPositive = value > 0;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
        isPositive ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
      )}
    >
      {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
      {isPositive ? '+' : ''}{value}
    </span>
  );
};

const StatCards: React.FC<StatCardsProps> = React.memo(({ stats, diff }) => {
  const cards = [
    {
      label: '방문심방',
      value: stats.visit,
      diff: diff.visit,
      icon: TrendingUp,
      color: 'blue',
      bgIcon: 'text-blue-500',
      badge: 'bg-blue-50',
      badgeIcon: 'p-2 bg-blue-50 rounded-xl',
    },
    {
      label: '카페심방',
      value: stats.cafe,
      diff: diff.cafe,
      icon: Coffee,
      color: 'orange',
      bgIcon: 'text-orange-500',
      badge: 'bg-orange-50',
      badgeIcon: 'p-2 bg-orange-50 rounded-xl',
    },
    {
      label: '전화심방',
      value: stats.phone,
      diff: diff.phone,
      icon: PhoneCall,
      color: 'green',
      bgIcon: 'text-green-500',
      badge: 'bg-green-50',
      badgeIcon: 'p-2 bg-green-50 rounded-xl',
    },
    {
      label: '업무',
      value: stats.work,
      diff: diff.work,
      icon: BarChart2,
      color: 'purple',
      bgIcon: 'text-purple-500',
      badge: 'bg-purple-50',
      badgeIcon: 'p-2 bg-purple-50 rounded-xl',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-card p-5 rounded-3xl shadow-lg border border-border flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-xl transition-all duration-300"
        >
          {/* 배경 아이콘 */}
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <card.icon size={64} className={card.bgIcon} />
          </div>

          <div className="flex items-center gap-2 mb-1">
            <div className={card.badgeIcon}>
              <card.icon size={20} className={card.bgIcon} />
            </div>
            <span className="text-sm font-semibold text-text-secondary">{card.label}</span>
          </div>

          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold tracking-tighter text-text">{card.value}</span>
            <DiffBadge value={card.diff} />
          </div>
        </div>
      ))}

      {/* 전체 합계 카드 — 강조 스타일 */}
      <div className="bg-[#007AFF] p-5 rounded-3xl shadow-lg shadow-blue-500/30 border border-blue-500 flex flex-col justify-between h-36 relative overflow-hidden group hover:shadow-blue-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 p-4 opacity-20 transform scale-110">
          <BarChart2 size={70} className="text-white" />
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <BarChart2 size={20} className="text-white" />
          </div>
          <span className="text-sm font-semibold text-blue-100">전체합계</span>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-4xl font-bold tracking-tighter text-white">{stats.total}</span>
          {diff.total !== 0 && (
            <span
              className={clsx(
                "inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                diff.total > 0 ? "text-white bg-white/20" : "text-blue-200 bg-white/10"
              )}
            >
              {diff.total > 0 ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
              {diff.total > 0 ? '+' : ''}{diff.total}
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

export default StatCards;
