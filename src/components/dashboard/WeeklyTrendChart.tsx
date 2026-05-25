/**
 * WeeklyTrendChart.tsx
 *
 * 최근 4주 카테고리별 사역 건수 추이를 순수 CSS 막대 그래프로 표현
 * 왜 외부 라이브러리 안 쓰는가? → 번들 사이즈 유지 + 데이터가 단순(4주×3카테고리)
 */

import React from 'react';
import clsx from 'clsx';
import type { WeekTrendItem } from '../../lib/dashboard-utils';

interface WeeklyTrendChartProps {
  data: WeekTrendItem[];
}

// 카테고리별 색상 매핑
const CATEGORY_COLORS = {
  심방: { bg: 'bg-blue-500', label: 'text-blue-600', dot: 'bg-blue-500' },
  업무: { bg: 'bg-green-500', label: 'text-green-600', dot: 'bg-green-500' },
  기타: { bg: 'bg-gray-400', label: 'text-gray-500', dot: 'bg-gray-400' },
} as const;

const WeeklyTrendChart: React.FC<WeeklyTrendChartProps> = React.memo(({ data }) => {
  // 전체 중 최대값 — 막대 높이 비율 계산용
  const maxTotal = Math.max(...data.map((d) => d.total), 1);

  return (
    <div className="bg-card p-6 rounded-3xl shadow-lg border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-text">📊 최근 4주 추이</h3>
          <p className="text-xs text-text-secondary mt-0.5">카테고리별 사역 건수 변화</p>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-3">
          {Object.entries(CATEGORY_COLORS).map(([key, colors]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={clsx("w-2.5 h-2.5 rounded-full", colors.dot)} />
              <span className="text-[10px] font-bold text-text-secondary">{key}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 차트 영역 */}
      <div className="flex items-end gap-3 h-48 px-2">
        {data.map((week, i) => {
          const isCurrentWeek = i === data.length - 1;
          // 각 카테고리의 높이를 최대값 대비 비율로 계산
          const 심방Height = maxTotal > 0 ? (week.심방 / maxTotal) * 100 : 0;
          const 업무Height = maxTotal > 0 ? (week.업무 / maxTotal) * 100 : 0;
          const 기타Height = maxTotal > 0 ? (week.기타 / maxTotal) * 100 : 0;

          return (
            <div key={week.label} className="flex-1 flex flex-col items-center gap-2">
              {/* 막대 그래프 — 스택 형태 */}
              <div className="flex items-end gap-0.5 h-36 w-full justify-center">
                {/* 심방 바 */}
                <div
                  className={clsx(
                    "rounded-t-md transition-all duration-500 ease-out",
                    CATEGORY_COLORS.심방.bg,
                    isCurrentWeek ? "w-4 opacity-100" : "w-3 opacity-70"
                  )}
                  style={{ height: `${Math.max(심방Height, week.심방 > 0 ? 8 : 0)}%` }}
                  title={`심방: ${week.심방}건`}
                />
                {/* 업무 바 */}
                <div
                  className={clsx(
                    "rounded-t-md transition-all duration-500 ease-out",
                    CATEGORY_COLORS.업무.bg,
                    isCurrentWeek ? "w-4 opacity-100" : "w-3 opacity-70"
                  )}
                  style={{ height: `${Math.max(업무Height, week.업무 > 0 ? 8 : 0)}%` }}
                  title={`업무: ${week.업무}건`}
                />
                {/* 기타 바 */}
                {week.기타 > 0 && (
                  <div
                    className={clsx(
                      "rounded-t-md transition-all duration-500 ease-out",
                      CATEGORY_COLORS.기타.bg,
                      isCurrentWeek ? "w-4 opacity-100" : "w-3 opacity-70"
                    )}
                    style={{ height: `${Math.max(기타Height, 8)}%` }}
                    title={`기타: ${week.기타}건`}
                  />
                )}
              </div>

              {/* 합계 숫자 */}
              <span
                className={clsx(
                  "text-xs font-bold tabular-nums",
                  isCurrentWeek ? "text-indigo-600" : "text-text-secondary"
                )}
              >
                {week.total}건
              </span>

              {/* 주간 라벨 */}
              <span
                className={clsx(
                  "text-[10px] font-medium text-center leading-tight",
                  isCurrentWeek
                    ? "text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full"
                    : "text-text-secondary/70"
                )}
              >
                {week.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 데이터 없음 처리 */}
      {data.every((d) => d.total === 0) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-sm text-text-secondary/50 font-medium">최근 4주 기록이 없습니다</p>
        </div>
      )}
    </div>
  );
});

export default WeeklyTrendChart;
