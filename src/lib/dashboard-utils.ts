/**
 * dashboard-utils.ts
 *
 * 대시보드에서 사용하는 통계 계산 유틸리티 함수들.
 * 왜 분리했는가? → 계산 로직과 UI 로직을 분리하여 테스트/재사용성 확보
 */

import { addDays, format } from 'date-fns';
import type { MinistryEntry, WeeklyPlan, WeeklyNote } from '../types';
import { DAYS_OF_WEEK_KR, TIME_SLOTS } from '../types';

// ─── 타입 정의 ────────────────────────────────────────────────

/** 주간 통계 카드에 표시할 데이터 */
export interface WeeklyStats {
  visit: number;
  cafe: number;
  phone: number;
  work: number;
  total: number;
}

/** 전주 대비 변화량 */
export interface StatsDiff {
  visit: number;
  cafe: number;
  phone: number;
  work: number;
  total: number;
}

/** 4주 추이 데이터 (한 주 분량) */
export interface WeekTrendItem {
  label: string;        // "5/12~5/18" 형식
  심방: number;
  업무: number;
  기타: number;
  total: number;
}

/** 히트맵 셀 데이터 */
export interface HeatmapCell {
  day: string;           // "주일", "화", ...
  time: string;          // "09:00", "10:00", ...
  count: number;
}

/** 새벽기도 주간 출석 데이터 */
export interface PrayerWeekData {
  weekLabel: string;     // "5/12 주" 형식
  weekStartDate: string;
  days: boolean[];       // [월, 화, 수, 목, 금] 출석 여부
  count: number;
}

/** 계획 vs 실행 비교 데이터 */
export interface PlanVsExecutionItem {
  dayLabel: string;      // "주일", "화", ...
  date: string;          // "2026-05-25"
  plan: string;          // 해당 요일 계획 텍스트
  entries: { subType: string; content: string }[];
  hasActivity: boolean;
}

// ─── 공통 헬퍼 ────────────────────────────────────────────────

/**
 * 특정 주의 시작일~종료일 범위에 해당하는 엔트리를 필터링
 * weekStart는 일요일 (weekStartsOn: 0)
 */
export function getEntriesForWeek(
  entries: MinistryEntry[],
  weekStart: Date,
): MinistryEntry[] {
  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endDate = addDays(weekStart, 7);
  const endStr = format(endDate, 'yyyy-MM-dd');

  return entries.filter((e) => e.date >= startStr && e.date < endStr);
}

// ─── 섹션 1: 핵심 요약 카드 ──────────────────────────────────

/** 주간 통계 계산 */
export function calcWeeklyStats(weekEntries: MinistryEntry[]): WeeklyStats {
  return {
    visit: weekEntries.filter((e) => e.subType === '방문심방').length,
    cafe: weekEntries.filter((e) => e.subType === '카페심방').length,
    phone: weekEntries.filter((e) => e.subType === '전화심방').length,
    work: weekEntries.filter((e) => e.subType === '업무').length,
    total: weekEntries.length,
  };
}

/** 전주 대비 변화량 계산 */
export function calcStatsDiff(
  currentStats: WeeklyStats,
  prevStats: WeeklyStats,
): StatsDiff {
  return {
    visit: currentStats.visit - prevStats.visit,
    cafe: currentStats.cafe - prevStats.cafe,
    phone: currentStats.phone - prevStats.phone,
    work: currentStats.work - prevStats.work,
    total: currentStats.total - prevStats.total,
  };
}

// ─── 섹션 2: 4주 추이 차트 ───────────────────────────────────

/** 최근 4주의 카테고리별 사역 건수 추이 */
export function calcWeeklyTrend(
  entries: MinistryEntry[],
  currentWeekStart: Date,
): WeekTrendItem[] {
  const result: WeekTrendItem[] = [];

  for (let i = 3; i >= 0; i--) {
    const weekStart = addDays(currentWeekStart, -7 * i);
    const weekEntries = getEntriesForWeek(entries, weekStart);

    const startLabel = format(weekStart, 'M/d');
    const endLabel = format(addDays(weekStart, 6), 'M/d');

    result.push({
      label: `${startLabel}~${endLabel}`,
      심방: weekEntries.filter((e) => e.category === '심방').length,
      업무: weekEntries.filter((e) => e.category === '업무').length,
      기타: weekEntries.filter((e) => e.category === '기타').length,
      total: weekEntries.length,
    });
  }

  return result;
}

// ─── 섹션 3: 요일 × 시간 히트맵 ────────────────────────────

/**
 * 전체 기간 엔트리를 요일×시간 기준으로 그룹핑하여 히트맵 데이터 생성
 * 왜 전체 기간인가? → 누적 데이터일수록 패턴이 선명해짐
 */
export function calcHeatmapData(entries: MinistryEntry[]): {
  cells: HeatmapCell[];
  maxCount: number;
} {
  // 요일 인덱스 매핑 (월요일 제외: 0=일, 2=화, 3=수, 4=목, 5=금, 6=토)
  const dayIndexToLabel: Record<number, string> = {
    0: '주일',
    2: '화',
    3: '수',
    4: '목',
    5: '금',
    6: '토',
  };

  const countMap = new Map<string, number>();

  for (const entry of entries) {
    const dayOfWeek = new Date(entry.date).getDay();
    const dayLabel = dayIndexToLabel[dayOfWeek];
    if (!dayLabel) continue; // 월요일 제외

    const key = `${dayLabel}|${entry.time}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  const cells: HeatmapCell[] = [];
  let maxCount = 0;

  for (const day of DAYS_OF_WEEK_KR) {
    for (const time of TIME_SLOTS) {
      const count = countMap.get(`${day}|${time}`) || 0;
      cells.push({ day, time, count });
      if (count > maxCount) maxCount = count;
    }
  }

  return { cells, maxCount };
}

// ─── 섹션 4: 새벽기도 트래커 ────────────────────────────────

/** 최근 N주의 새벽기도 출석 데이터 계산 */
export function calcPrayerData(
  weeklyNotes: WeeklyNote[],
  currentWeekStart: Date,
  weekCount = 8,
): {
  weeks: PrayerWeekData[];
  totalDays: number;
  totalPossible: number;
  avgPerWeek: number;
  longestStreak: number;
} {
  const allDays = ['월', '화', '수', '목', '금'];
  const weeks: PrayerWeekData[] = [];

  // 전체 출석 일수를 연속 계산하기 위해 한 번에 모으기
  const allAttendance: boolean[] = [];

  for (let i = weekCount - 1; i >= 0; i--) {
    const weekStart = addDays(currentWeekStart, -7 * i);
    const weekStr = format(weekStart, 'yyyy-MM-dd');
    const note = weeklyNotes.find((n) => n.weekStartDate === weekStr);
    const attendedDays = note?.dawnPrayerDays || [];

    const days = allDays.map((d) => attendedDays.includes(d));
    const count = days.filter(Boolean).length;

    weeks.push({
      weekLabel: format(weekStart, 'M/d') + ' 주',
      weekStartDate: weekStr,
      days,
      count,
    });

    allAttendance.push(...days);
  }

  const totalDays = allAttendance.filter(Boolean).length;
  const totalPossible = weekCount * 5;
  const avgPerWeek = weekCount > 0 ? totalDays / weekCount : 0;

  // 최장 연속 출석 계산
  let longestStreak = 0;
  let currentStreak = 0;
  for (const attended of allAttendance) {
    if (attended) {
      currentStreak++;
      if (currentStreak > longestStreak) longestStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  }

  return { weeks, totalDays, totalPossible, avgPerWeek, longestStreak };
}

// ─── 섹션 5: 계획 vs 실행 ───────────────────────────────────

/**
 * 이번 주 계획과 실제 실행을 요일별로 비교
 *
 * PLAN_LABELS = ["주일", "화", "수", "목", "금", "토", "비고"]
 * plans 객체의 key는 인덱스(0~6)
 */
export function calcPlanVsExecution(
  weekEntries: MinistryEntry[],
  weekPlan: WeeklyPlan | undefined,
  currentWeekStart: Date,
): PlanVsExecutionItem[] {
  // 요일별 날짜 계산 (일=0, 화=2, 수=3, 목=4, 금=5, 토=6 → 월요일 제외)
  const dayOffsets = [0, 2, 3, 4, 5, 6]; // 주일, 화, 수, 목, 금, 토
  const dayLabels = ['주일', '화', '수', '목', '금', '토'];
  // plans 인덱스: 0=주일, 1=화, 2=수, 3=목, 4=금, 5=토
  const planKeys = [0, 1, 2, 3, 4, 5];

  return dayLabels.map((label, idx) => {
    const date = format(addDays(currentWeekStart, dayOffsets[idx]), 'yyyy-MM-dd');
    const plan = weekPlan?.plans?.[planKeys[idx]] || '';
    const dayEntries = weekEntries.filter((e) => e.date === date);

    return {
      dayLabel: label,
      date,
      plan,
      entries: dayEntries.map((e) => ({
        subType: e.subType,
        content: e.content,
      })),
      hasActivity: dayEntries.length > 0,
    };
  });
}
