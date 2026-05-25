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
import { startOfWeek, addDays, format, differenceInDays } from 'date-fns';

// 대시보드 컴포넌트들
import StatCards from '../components/dashboard/StatCards';
import WeeklyTrendChart from '../components/dashboard/WeeklyTrendChart';
import HeatmapGrid from '../components/dashboard/HeatmapGrid';
import PrayerTracker from '../components/dashboard/PrayerTracker';
import PlanVsExecution from '../components/dashboard/PlanVsExecution';
import { AlertCircle, Heart } from 'lucide-react';

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
  const sheep = useMinistryStore((state) => state.sheep);

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

  // ─── 목양 케어 리마인더 통계 계산 ───────────────────────
  const shepherdingStats = useMemo(() => {
    if (sheep.length === 0) return { coverage: 0, alertSheep: [] };
    
    const alertSheep: { name: string; days: number }[] = [];
    let caredCount = 0;
    const now = new Date();
    
    sheep.forEach(s => {
      const related = entries.filter(e => 
        (e.taggedSheepIds?.includes(s.id)) || 
        (e.content.includes(s.name) && e.category === '심방')
      );
      
      const lastDate = related.length > 0 
        ? new Date(Math.max(...related.map(e => new Date(e.date).getTime())))
        : null;
        
      if (lastDate) {
        const days = differenceInDays(now, lastDate);
        if (days > 30) {
          alertSheep.push({ name: s.name, days });
        } else {
          caredCount++;
        }
      } else {
        alertSheep.push({ name: s.name, days: 999 }); // 기록 없음
      }
    });
    
    const coverage = Math.round((caredCount / sheep.length) * 100);
    alertSheep.sort((a, b) => b.days - a.days);
    
    return { coverage, alertSheep };
  }, [sheep, entries]);

  return (
    <div className="p-4 space-y-8 max-w-4xl mx-auto pb-24 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-text flex items-center gap-2">
        📊 사역 인사이트
      </h2>

      <WeekSelector
        currentWeekStart={currentWeekStart}
        onWeekChange={setCurrentWeekStart}
      />

      {/* 목양 케어 리마인더 & 커버리지 섹션 */}
      {sheep.length > 0 && (
        <div className="bg-card border border-border rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-black text-text flex items-center gap-1.5">
                <Heart size={16} className="text-indigo-600 fill-indigo-600" />
                목양 커버리지
              </h3>
              <p className="text-xs text-text-secondary mt-0.5">전체 등록 성도 중 최근 30일 이내 돌봄을 받은 성도 비율</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600">{shepherdingStats.coverage}%</span>
              <span className="text-xs text-text-secondary"> ({sheep.length - shepherdingStats.alertSheep.length}/{sheep.length}명)</span>
            </div>
          </div>

          {/* 게이지 바 */}
          <div className="w-full h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all duration-500" 
              style={{ width: `${shepherdingStats.coverage}%` }}
            />
          </div>

          {/* 돌봄이 시급한 성도 리마인더 */}
          {shepherdingStats.alertSheep.length > 0 && (
            <div className="pt-2 border-t border-border/60">
              <span className="text-xs font-bold text-red-500 flex items-center gap-1 mb-2">
                <AlertCircle size={13} />
                돌봄이 시급한 성도 ({shepherdingStats.alertSheep.length}명)
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {shepherdingStats.alertSheep.map((s, idx) => (
                  <span 
                    key={idx} 
                    className="px-2.5 py-1 bg-red-500/10 text-red-600 border border-red-500/20 text-[10px] font-bold rounded-lg"
                    title={s.days === 999 ? '심방 기록 없음' : `${s.days}일 동안 심방 없음`}
                  >
                    🐑 {s.name} <span className="opacity-75">({s.days === 999 ? '미심방' : `${s.days}일째`})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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
