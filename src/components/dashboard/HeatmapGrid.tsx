/**
 * HeatmapGrid.tsx
 *
 * 요일 × 시간대 히트맵 — GitHub 잔디 스타일
 * 왜 히트맵인가? → "나는 언제 사역을 가장 많이 하는가?" 패턴을 직관적으로 파악
 */

import React from 'react';
import clsx from 'clsx';
import type { HeatmapCell } from '../../lib/dashboard-utils';
import { DAYS_OF_WEEK_KR, TIME_SLOTS } from '../../types';

interface HeatmapGridProps {
  cells: HeatmapCell[];
  maxCount: number;
}

/**
 * 카운트를 0~4 단계의 강도로 변환
 * 0: 빈칸, 1: 연한색, 2: 중간, 3: 진한색, 4: 가장 진한색
 */
function getIntensity(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount <= 0) return 0;

  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

const INTENSITY_CLASSES = [
  'bg-gray-100',           // 0: 없음
  'bg-indigo-100',         // 1: 연한
  'bg-indigo-300',         // 2: 중간
  'bg-indigo-500',         // 3: 진한
  'bg-indigo-700',         // 4: 가장 진한
];

const INTENSITY_TEXT = [
  'text-text-secondary/30', // 0
  'text-indigo-600',        // 1
  'text-indigo-700',        // 2
  'text-white',             // 3
  'text-white',             // 4
];

/** 식사 시간 여부 */
function isMealTime(time: string): boolean {
  return time === '11:40' || time === '17:00';
}

/** 시간 라벨 표시 */
function getTimeLabel(time: string): string {
  if (time === '11:40') return '점심';
  if (time === '17:00') return '저녁';
  return time;
}

const HeatmapGrid: React.FC<HeatmapGridProps> = React.memo(({ cells, maxCount }) => {
  // cells를 [time][day] 형태로 접근하기 위해 Map 구성
  const cellMap = new Map<string, number>();
  for (const cell of cells) {
    cellMap.set(`${cell.time}|${cell.day}`, cell.count);
  }

  return (
    <div className="bg-card p-6 rounded-3xl shadow-lg border border-border">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-text">🗓️ 사역 패턴 히트맵</h3>
          <p className="text-xs text-text-secondary mt-0.5">전체 기간 요일 × 시간대별 활동 빈도</p>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-text-secondary mr-1">적음</span>
          {INTENSITY_CLASSES.map((cls, i) => (
            <div
              key={i}
              className={clsx("w-3.5 h-3.5 rounded-sm", cls)}
              title={`강도 ${i}`}
            />
          ))}
          <span className="text-[9px] text-text-secondary ml-1">많음</span>
        </div>
      </div>

      {/* 히트맵 그리드 */}
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* 요일 헤더 */}
          <div className="grid gap-1.5 mb-1.5" style={{ gridTemplateColumns: '48px repeat(6, 1fr)' }}>
            <div /> {/* 빈 칸 (시간 라벨 자리) */}
            {DAYS_OF_WEEK_KR.map((day) => (
              <div
                key={day}
                className="text-center text-[11px] font-bold text-text-secondary py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 시간 행 */}
          {TIME_SLOTS.map((time) => (
            <div
              key={time}
              className={clsx(
                "grid gap-1.5 mb-1.5",
                isMealTime(time) && "opacity-60"
              )}
              style={{ gridTemplateColumns: '48px repeat(6, 1fr)' }}
            >
              {/* 시간 라벨 */}
              <div
                className={clsx(
                  "flex items-center justify-end pr-2 text-[10px] font-bold tabular-nums",
                  isMealTime(time) ? "text-orange-500" : "text-text-secondary/70"
                )}
              >
                {getTimeLabel(time)}
              </div>

              {/* 각 요일 셀 */}
              {DAYS_OF_WEEK_KR.map((day) => {
                const count = cellMap.get(`${time}|${day}`) || 0;
                const intensity = getIntensity(count, maxCount);

                return (
                  <div
                    key={`${time}-${day}`}
                    className={clsx(
                      "aspect-[2/1] rounded-md flex items-center justify-center transition-colors cursor-default",
                      INTENSITY_CLASSES[intensity]
                    )}
                    title={`${day} ${time}: ${count}건`}
                  >
                    {count > 0 && (
                      <span
                        className={clsx(
                          "text-[9px] font-bold tabular-nums",
                          INTENSITY_TEXT[intensity]
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* 데이터 없음 */}
      {maxCount === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-text-secondary/50 font-medium">
            사역 기록이 쌓이면 활동 패턴이 여기에 표시됩니다
          </p>
        </div>
      )}
    </div>
  );
});

export default HeatmapGrid;
