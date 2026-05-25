/**
 * DashboardPage.tsx
 *
 * 사역 인사이트 대시보드 — 5개 섹션으로 구성
 * 1. 핵심 요약 카드 (전주 대비 변화량)
 * 2. 최근 4주 추이 차트
 * 3. 요일×시간 히트맵
 * 4. 새벽기도 출석 트래커
 * 5. 계획 vs 실행 비교
 *
 * 왜 기존 페이지를 확장했는가? → 새 페이지를 추가하면 탭이 늘어나 UX 복잡해짐
 */

import React, { useState, useMemo } from 'react';
import WeekSelector from '../components/WeekSelector';
import { useMinistryStore } from '../store/useMinistryStore';
import { startOfWeek, addDays, format } from 'date-fns';

// 대시보드 컴포넌트들
import StatCards from '../components/dashboard/StatCards';
import WeeklyTrendChart from '../components/dashboard/WeeklyTrendChart';
import HeatmapGrid from '../components/dashboard/HeatmapGrid';
import PrayerTracker from '../components/dashboard/PrayerTracker';
import PlanVsExecution from '../components/dashboard/PlanVsExecution';

// 유틸 함수들
import {
  getEntriesForWeek,
  calcWeeklyStats,
  calcStatsDiff,
  calcWeeklyTrend,
  calcHeatmapData,
  calcPrayerData,
  calcPlanVsExecution,
} from '../lib/dashboard-utils';

const DashboardPage: React.FC = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );

  // 필요한 상태만 개별 selector로 구독 — 불필요한 리렌더 방지
  const entries = useMinistryStore((state) => state.entries);
  const weeklyPlans = useMinistryStore((state) => state.weeklyPlans);
  const weeklyNotes = useMinistryStore((state) => state.weeklyNotes);

  // ─── 섹션 1: 핵심 요약 카드 ─────────────────────────────
  const currentWeekEntries = useMemo(
    () => getEntriesForWeek(entries, currentWeekStart),
    [entries, currentWeekStart]
  );

  const prevWeekStart = useMemo(
    () => addDays(currentWeekStart, -7),
    [currentWeekStart]
  );

  const prevWeekEntries = useMemo(
    () => getEntriesForWeek(entries, prevWeekStart),
    [entries, prevWeekStart]
  );

  const currentStats = useMemo(
    () => calcWeeklyStats(currentWeekEntries),
    [currentWeekEntries]
  );

  const prevStats = useMemo(
    () => calcWeeklyStats(prevWeekEntries),
    [prevWeekEntries]
  );

  const statsDiff = useMemo(
    () => calcStatsDiff(currentStats, prevStats),
    [currentStats, prevStats]
  );

  // ─── 섹션 2: 4주 추이 차트 ──────────────────────────────
  const trendData = useMemo(
    () => calcWeeklyTrend(entries, currentWeekStart),
    [entries, currentWeekStart]
  );

  // ─── 섹션 3: 히트맵 ─────────────────────────────────────
  const heatmapData = useMemo(
    () => calcHeatmapData(entries),
    [entries]
  );

  // ─── 섹션 4: 새벽기도 트래커 ─────────────────────────────
  const prayerData = useMemo(
    () => calcPrayerData(weeklyNotes, currentWeekStart, 8),
    [weeklyNotes, currentWeekStart]
  );

  // ─── 섹션 5: 계획 vs 실행 ───────────────────────────────
  const currentWeekPlan = useMemo(
    () => {
      const weekStr = format(currentWeekStart, 'yyyy-MM-dd');
      return weeklyPlans.find((p) => p.weekStartDate === weekStr);
    },
    [weeklyPlans, currentWeekStart]
  );

  const planVsExecution = useMemo(
    () => calcPlanVsExecution(currentWeekEntries, currentWeekPlan, currentWeekStart),
    [currentWeekEntries, currentWeekPlan, currentWeekStart]
  );

  return (
    <div className="p-4 space-y-8 max-w-4xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-text flex items-center gap-2">
        📊 사역 인사이트
      </h2>

      <WeekSelector
        currentWeekStart={currentWeekStart}
        onWeekChange={setCurrentWeekStart}
      />

      {/* 섹션 1: 핵심 요약 카드 */}
      <StatCards stats={currentStats} diff={statsDiff} />

      {/* 섹션 2 + 3: 추이 차트와 히트맵 — 넓은 화면에서 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyTrendChart data={trendData} />
        <HeatmapGrid cells={heatmapData.cells} maxCount={heatmapData.maxCount} />
      </div>

      {/* 섹션 4 + 5: 새벽기도와 계획 비교 — 넓은 화면에서 2열 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PrayerTracker
          weeks={prayerData.weeks}
          totalDays={prayerData.totalDays}
          totalPossible={prayerData.totalPossible}
          avgPerWeek={prayerData.avgPerWeek}
          longestStreak={prayerData.longestStreak}
        />
        <PlanVsExecution items={planVsExecution} />
      </div>
    </div>
  );
};

export default DashboardPage;
