/**
 * PrayerTracker.tsx
 *
 * 새벽기도 출석 트래커 — 최근 8주 출석 현황 + 통계
 * 왜 이 섹션이 필요한가? → dawnPrayerDays 데이터를 이미 수집 중인데 활용하지 않고 있었음
 */

import React from 'react';
import clsx from 'clsx';
import { Flame, Target } from 'lucide-react';
import type { PrayerWeekData } from '../../lib/dashboard-utils';

interface PrayerTrackerProps {
  weeks: PrayerWeekData[];
  totalDays: number;
  totalPossible: number;
  avgPerWeek: number;
  longestStreak: number;
}

const DAY_LABELS = ['월', '화', '수', '목', '금'];

const PrayerTracker: React.FC<PrayerTrackerProps> = React.memo(({
  weeks,
  totalDays,
  totalPossible,
  avgPerWeek,
  longestStreak,
}) => {
  const attendanceRate = totalPossible > 0 ? Math.round((totalDays / totalPossible) * 100) : 0;

  return (
    <div className="bg-card p-6 rounded-3xl shadow-lg border border-border">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-text">🌅 새벽기도 출석</h3>
          <p className="text-xs text-text-secondary mt-0.5">최근 {weeks.length}주 새벽기도 참석 현황</p>
        </div>
      </div>

      {/* 통계 요약 바 */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-indigo-50 rounded-2xl p-3 text-center border border-indigo-100">
          <div className="text-2xl font-bold text-indigo-700 tabular-nums">{attendanceRate}%</div>
          <div className="text-[10px] font-bold text-indigo-500 mt-0.5">출석률</div>
        </div>
        <div className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-100">
          <div className="flex items-center justify-center gap-1">
            <Flame size={16} className="text-amber-600" />
            <span className="text-2xl font-bold text-amber-700 tabular-nums">{longestStreak}</span>
          </div>
          <div className="text-[10px] font-bold text-amber-500 mt-0.5">최장 연속(일)</div>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-3 text-center border border-emerald-100">
          <div className="flex items-center justify-center gap-1">
            <Target size={16} className="text-emerald-600" />
            <span className="text-2xl font-bold text-emerald-700 tabular-nums">{avgPerWeek.toFixed(1)}</span>
          </div>
          <div className="text-[10px] font-bold text-emerald-500 mt-0.5">주당 평균(일)</div>
        </div>
      </div>

      {/* 주간별 출석 그리드 */}
      <div className="space-y-2">
        {/* 요일 헤더 */}
        <div className="grid gap-1.5 pl-[72px]" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
          {DAY_LABELS.map((day) => (
            <div key={day} className="text-center text-[10px] font-bold text-text-secondary">
              {day}
            </div>
          ))}
        </div>

        {/* 주간 행 — 최신 주가 위에 */}
        {[...weeks].reverse().map((week, idx) => {
          const isCurrentWeek = idx === 0;
          return (
            <div
              key={week.weekStartDate}
              className={clsx(
                "grid gap-1.5 items-center rounded-xl px-2 py-1.5 transition-colors",
                isCurrentWeek && "bg-indigo-50/50 ring-1 ring-indigo-200"
              )}
              style={{ gridTemplateColumns: '64px repeat(5, 1fr) auto' }}
            >
              {/* 주간 라벨 */}
              <span
                className={clsx(
                  "text-[10px] font-bold truncate",
                  isCurrentWeek ? "text-indigo-600" : "text-text-secondary/70"
                )}
              >
                {week.weekLabel}
              </span>

              {/* 출석 셀 */}
              {week.days.map((attended, dayIdx) => (
                <div
                  key={dayIdx}
                  className={clsx(
                    "h-7 rounded-lg flex items-center justify-center text-[10px] font-black transition-all",
                    attended
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-300"
                  )}
                >
                  {attended ? '✓' : '·'}
                </div>
              ))}

              {/* 해당 주 출석 횟수 */}
              <span
                className={clsx(
                  "text-[10px] font-bold tabular-nums text-right w-8",
                  week.count >= 4
                    ? "text-indigo-600"
                    : week.count >= 2
                      ? "text-text-secondary"
                      : "text-text-secondary/50"
                )}
              >
                {week.count}/5
                {week.count === 5 && ' 🔥'}
              </span>
            </div>
          );
        })}
      </div>

      {/* 데이터 없음 */}
      {weeks.every((w) => w.count === 0) && (
        <div className="text-center py-6 mt-4">
          <p className="text-sm text-text-secondary/50 font-medium">
            계획 페이지에서 새벽기도 출석을 기록하면 여기에 표시됩니다
          </p>
        </div>
      )}
    </div>
  );
});

export default PrayerTracker;
