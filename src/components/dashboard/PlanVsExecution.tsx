/**
 * PlanVsExecution.tsx
 *
 * 계획 vs 실행 비교 섹션
 * 왜 필요한가? → "계획을 세웠는데 실행했나?"를 시각적으로 비교하여 자기 점검 유도
 */

import React from 'react';
import clsx from 'clsx';
import { CheckCircle, AlertCircle, MinusCircle } from 'lucide-react';
import type { PlanVsExecutionItem } from '../../lib/dashboard-utils';

interface PlanVsExecutionProps {
  items: PlanVsExecutionItem[];
}

/** 각 요일의 상태를 판정 */
function getDayStatus(item: PlanVsExecutionItem): 'done' | 'partial' | 'empty' | 'no-plan' {
  const hasPlan = item.plan.trim().length > 0;
  const hasEntries = item.entries.length > 0;

  if (!hasPlan && !hasEntries) return 'no-plan';
  if (!hasPlan && hasEntries) return 'done';     // 계획 없이도 실행함
  if (hasPlan && hasEntries) return 'done';       // 계획도 있고 실행도 함
  return 'empty';                                  // 계획은 있는데 실행 안 함
}

const STATUS_CONFIG = {
  done: {
    icon: CheckCircle,
    label: '완료',
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50 border-emerald-100',
  },
  partial: {
    icon: AlertCircle,
    label: '일부',
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50 border-amber-100',
  },
  empty: {
    icon: AlertCircle,
    label: '미실행',
    iconColor: 'text-red-400',
    bgColor: 'bg-red-50 border-red-100',
  },
  'no-plan': {
    icon: MinusCircle,
    label: '',
    iconColor: 'text-gray-300',
    bgColor: 'bg-gray-50 border-gray-100',
  },
};

const PlanVsExecution: React.FC<PlanVsExecutionProps> = React.memo(({ items }) => {
  // 전체 실행률 계산
  const withPlan = items.filter((item) => item.plan.trim().length > 0);
  const executed = withPlan.filter((item) => item.entries.length > 0);
  const executionRate = withPlan.length > 0 ? Math.round((executed.length / withPlan.length) * 100) : 0;

  return (
    <div className="bg-card p-6 rounded-3xl shadow-lg border border-border">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-text">✅ 계획 vs 실행</h3>
          <p className="text-xs text-text-secondary mt-0.5">이번 주 요일별 계획 대비 실행 현황</p>
        </div>

        {/* 실행률 뱃지 */}
        {withPlan.length > 0 && (
          <div
            className={clsx(
              "px-3 py-1.5 rounded-full text-xs font-bold border",
              executionRate >= 80
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : executionRate >= 50
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-600 border-red-200"
            )}
          >
            실행률 {executionRate}%
          </div>
        )}
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const status = getDayStatus(item);
          const config = STATUS_CONFIG[status];
          const StatusIcon = config.icon;

          return (
            <div
              key={item.dayLabel}
              className={clsx(
                "rounded-2xl p-4 border transition-colors",
                config.bgColor
              )}
            >
              <div className="flex items-start gap-3">
                {/* 상태 아이콘 */}
                <div className="pt-0.5">
                  <StatusIcon size={18} className={config.iconColor} />
                </div>

                <div className="flex-1 min-w-0">
                  {/* 요일 라벨 */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-bold text-text">{item.dayLabel}</span>
                    <span className="text-[10px] text-text-secondary/60 font-medium">
                      {item.date.substring(5).replace('-', '/')}
                    </span>
                  </div>

                  {/* 계획 */}
                  {item.plan ? (
                    <p className="text-xs text-text-secondary mb-1.5">
                      <span className="font-bold text-text-secondary/80">계획:</span> {item.plan}
                    </p>
                  ) : (
                    <p className="text-xs text-text-secondary/40 mb-1.5 italic">계획 없음</p>
                  )}

                  {/* 실행 내역 */}
                  {item.entries.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {item.entries.map((entry, idx) => (
                        <span
                          key={idx}
                          className={clsx(
                            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
                            entry.subType.includes('심방')
                              ? "bg-blue-100 text-blue-700"
                              : "bg-green-100 text-green-700"
                          )}
                        >
                          {entry.subType}
                          {entry.content && (
                            <span className="font-normal opacity-70 truncate max-w-[80px]">
                              · {entry.content}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    status !== 'no-plan' && (
                      <p className="text-[10px] text-red-400 font-medium italic">기록 없음</p>
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 모든 요일에 계획이 없을 때 */}
      {withPlan.length === 0 && (
        <div className="text-center py-6 mt-2">
          <p className="text-sm text-text-secondary/50 font-medium">
            계획 페이지에서 주간 계획을 입력하면 실행 비교가 표시됩니다
          </p>
        </div>
      )}
    </div>
  );
});

export default PlanVsExecution;
