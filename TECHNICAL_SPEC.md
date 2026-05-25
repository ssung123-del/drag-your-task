# 📋 Drag Your Task — 기술 상세 설명서

> **버전**: v1.5  
> **마지막 업데이트**: 2026-02-15  
> **저장소**: [github.com/ssung123-del/drag-your-task](https://github.com/ssung123-del/drag-your-task)

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [기술 스택](#2-기술-스택)
3. [프로젝트 구조](#3-프로젝트-구조)
4. [아키텍처 설계](#4-아키텍처-설계)
5. [핵심 데이터 모델](#5-핵심-데이터-모델)
6. [상태 관리 설계](#6-상태-관리-설계)
7. [Firebase 연동](#7-firebase-연동)
8. [드래그 앤 드롭 시스템](#8-드래그-앤-드롭-시스템)
9. [페이지별 기능 상세](#9-페이지별-기능-상세)
10. [내보내기 시스템](#10-내보내기-시스템)
11. [UI/UX 디자인 시스템](#11-uiux-디자인-시스템)
12. [성능 최적화](#12-성능-최적화)
13. [빌드 및 배포](#13-빌드-및-배포)
14. [향후 확장 포인트](#14-향후-확장-포인트)

---

## 1. 프로젝트 개요

### 1.1 목적
**Drag Your Task**는 오륜교회 사역자를 위한 **주간 사역 기록 관리 웹 앱**입니다. 드래그 앤 드롭 기반의 직관적 UI를 통해 심방, 업무 등의 사역 일정을 시간표에 배치하고, Excel/HWPX 문서로 내보내기할 수 있습니다.

### 1.2 주요 기능
| 기능 | 설명 |
|------|------|
| **드래그 앤 드롭 스케줄 보드** | 사역 블록을 시간표에 끌어다 놓아 일정 등록 |
| **이동/복사 팝오버** | 기존 일정을 다른 슬롯으로 드래그 시 이동/복사 선택 |
| **주간 계획** | 주일~토 요일별 계획 및 새벽기도 체크 |
| **주간 통계 대시보드** | 방문/카페/전화 심방 건수 실시간 집계 |
| **기록 관리** | 전체 기록 검색, 카테고리 필터, 삭제 |
| **Excel/HWPX 내보내기** | 주간 보고서를 엑셀 또는 한글(HWPX) 문서로 다운로드 |
| **Firebase 실시간 동기화** | Google 로그인 기반 클라우드 데이터 동기화 |
| **백업/복원** | JSON 파일로 전체 데이터 백업 및 복원 |

### 1.3 대상 사용자
- 오륜교회 사역자 (목사, 전도사, 교육전도사 등)
- 주 사용 환경: 모바일(iOS/Android), 태블릿, 데스크탑

---

## 2. 기술 스택

### 2.1 프론트엔드 코어
| 기술 | 버전 | 역할 |
|------|------|------|
| **React** | 19.2.0 | UI 프레임워크 (Functional Components + Hooks) |
| **TypeScript** | 5.9.3 | 타입 안전성 (Strict Mode) |
| **Vite** | 7.3.1 | 빌드 도구 (HMR, Code Splitting) |
| **React Router DOM** | 7.13.0 | 클라이언트 사이드 라우팅 (SPA) |

### 2.2 상태 관리
| 기술 | 버전 | 역할 |
|------|------|------|
| **Zustand** | 5.0.11 | 경량 전역 상태 관리 |
| **zustand/persist** | built-in | localStorage 자동 영속화 |

### 2.3 드래그 앤 드롭
| 기술 | 버전 | 역할 |
|------|------|------|
| **@dnd-kit/core** | 6.3.1 | 드래그 앤 드롭 엔진 |
| **@dnd-kit/sortable** | 10.0.0 | 정렬 가능한 목록 지원 |
| **@dnd-kit/utilities** | 3.2.2 | CSS Transform 유틸리티 |

### 2.4 백엔드 / 인프라
| 기술 | 버전 | 역할 |
|------|------|------|
| **Firebase** | 12.9.0 | Authentication (Google), Firestore (NoSQL DB) |

### 2.5 UI / 스타일링
| 기술 | 버전 | 역할 |
|------|------|------|
| **Tailwind CSS** | 4.1.18 | 유틸리티 우선 CSS |
| **Lucide React** | 0.563.0 | 아이콘 시스템 |
| **clsx** | 2.1.1 | 조건부 클래스명 유틸리티 |
| **Radix UI** | 최신 | Dialog, DropdownMenu, Select 프리미티브 |

### 2.6 내보내기 / 유틸리티
| 기술 | 버전 | 역할 |
|------|------|------|
| **ExcelJS** | 4.4.0 | .xlsx 파일 생성 |
| **JSZip** | 3.10.1 | HWPX (ZIP 기반) 파일 생성 |
| **file-saver** | 2.0.5 | 브라우저에서 파일 다운로드 |
| **date-fns** | 4.1.0 | 날짜 유틸리티 (한국어 로케일) |

---

## 3. 프로젝트 구조

```
drag-your-task-main/
├── public/                          # 정적 자산
├── src/
│   ├── main.tsx                     # 앱 엔트리포인트
│   ├── App.tsx                      # 라우팅 설정 (Lazy Loading)
│   ├── index.css                    # 글로벌 CSS (디자인 토큰, 애니메이션)
│   ├── App.css                      # 앱 레벨 스타일
│   │
│   ├── types/
│   │   └── index.ts                 # 전체 타입 정의 + 상수값
│   │
│   ├── store/
│   │   └── useMinistryStore.ts      # Zustand 글로벌 스토어
│   │
│   ├── config/
│   │   └── firebase-config.ts       # Firebase 프로젝트 설정
│   │
│   ├── lib/
│   │   ├── firebase.ts              # Firebase SDK 초기화
│   │   ├── excel-export.ts          # Excel(xlsx) 생성 로직
│   │   └── hwpx-export.ts           # HWPX(한글) 생성 로직
│   │
│   ├── components/
│   │   ├── AuthInitializer.tsx       # Firebase Auth 상태 + Firestore 실시간 리스너
│   │   ├── Layout.tsx               # 반응형 레이아웃 (탭바/사이드바)
│   │   ├── WeekSelector.tsx          # 주간 선택기
│   │   ├── EntryForm.tsx             # 사역 기록 입력 폼
│   │   ├── DragDropBoard.tsx         # 메인 드래그 앤 드롭 보드 (핵심 컴포넌트)
│   │   └── drag-board/
│   │       ├── types.ts              # 드래그 보드 전용 타입
│   │       ├── blocks.tsx            # 사역 블록 정의 (심방, 업무)
│   │       ├── DraggableBlock.tsx    # 드래그 가능한 블록 컴포넌트
│   │       ├── DraggableEntry.tsx    # 드래그 가능한 기존 엔트리 컴포넌트
│   │       └── DroppableTimeSlot.tsx # 드롭 가능한 시간 슬롯 컴포넌트
│   │
│   └── pages/
│       ├── HomePage.tsx              # 홈 (→ 드래그 보드로 리다이렉트)
│       ├── DashboardPage.tsx         # 주간 통계 대시보드
│       ├── PlansPage.tsx             # 주간 계획 입력
│       ├── ExportPage.tsx            # Excel/HWPX 내보내기
│       ├── HistoryPage.tsx           # 전체 기록 검색/관리
│       └── SettingsPage.tsx          # 설정 (백업/복원/초기화)
│
├── index.html                       # HTML 엔트리
├── package.json                     # 의존성 관리
├── vite.config.ts                   # Vite 빌드 설정
├── tailwind.config.js               # Tailwind 커스텀 설정
├── tsconfig.json                    # TypeScript 설정
├── tsconfig.app.json                # 앱 전용 TS 설정
├── tsconfig.node.json               # Node.js 전용 TS 설정
├── eslint.config.js                 # ESLint 설정
└── postcss.config.js                # PostCSS 설정
```

### 3.1 컴포넌트/파일 규모

| 파일 | 라인 수 | 바이트 | 역할 |
|------|---------|--------|------|
| `DragDropBoard.tsx` | ~886 | 44.6KB | **핵심 컴포넌트** — 드래그 보드 + 모달 4종 |
| `hwpx-export.ts` | ~314 | 15.4KB | HWPX XML 생성 / ZIP 패키징 |
| `Layout.tsx` | ~246 | 13.2KB | 반응형 레이아웃 + 네비게이션 |
| `excel-export.ts` | ~304 | 12.6KB | Excel 워크시트 생성 |
| `ExportPage.tsx` | ~178 | 10.0KB | 내보내기 UI |
| `PlansPage.tsx` | ~193 | 9.2KB | 주간 계획 입력 |
| `EntryForm.tsx` | ~96 | 9.6KB | 기록 입력 폼 |

---

## 4. 아키텍처 설계

### 4.1 전체 아키텍처 개요

```
┌──────────────────────────────────────────────────────────┐
│                    React 19 SPA (Vite)                    │
│                                                          │
│  ┌──────────┐  ┌───────────┐  ┌─────────────────────┐   │
│  │  Pages   │──│ Components│──│  Zustand Store       │   │
│  │ (6개)    │  │ (핵심5개) │  │ (useMinistryStore)   │   │
│  └──────────┘  └───────────┘  └──────────┬──────────┘   │
│                                          │               │
│  ┌──────────┐  ┌───────────┐  ┌──────────▼──────────┐   │
│  │  Library │  │ Config    │  │  AuthInitializer     │   │
│  │ (export) │  │ (firebase)│  │ (실시간 동기화 허브)  │   │
│  └──────────┘  └───────────┘  └──────────┬──────────┘   │
│                                          │               │
└──────────────────────────────────────────┼───────────────┘
                                           │
                    ┌──────────────────────▼──────────────────────┐
                    │              Firebase                        │
                    │  ┌──────────────┐  ┌────────────────────┐   │
                    │  │ Auth         │  │ Firestore           │   │
                    │  │ (Google SSO) │  │ (NoSQL Realtime DB) │   │
                    │  └──────────────┘  └────────────────────┘   │
                    └─────────────────────────────────────────────┘
```

### 4.2 데이터 흐름

```
사용자 액션 → React 컴포넌트 → Zustand Store → (동시에 두 갈래)
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
              localStorage                   Firestore
              (persist 미들웨어)             (setDoc/deleteDoc)
                    │                              │
                    ▼                              ▼
              오프라인 백업                   클라우드 동기화
                                                   │
                                                   ▼
                                          onSnapshot 리스너
                                          (AuthInitializer)
                                                   │
                                                   ▼
                                          Zustand Store 업데이트
                                                   │
                                                   ▼
                                          React 리렌더링 (selector 기반)
```

### 4.3 라우팅 구조

```
BrowserRouter
├── / (HomePage → DragDropBoard)        # 메인 시간표
├── /dashboard (DashboardPage)           # 주간 통계
├── /plans (PlansPage)                   # 주간 계획
├── /export (ExportPage)                 # 내보내기
├── /history (HistoryPage)               # 기록 관리
├── /settings (SettingsPage)             # 설정
└── /* → Navigate to / (404 처리)
```

- **Lazy Loading**: `React.lazy()` + `Suspense`로 코드 분할 → 초기 번들 크기 최소화
- **AuthInitializer**: 최상단에서 렌더 트리 외부로 동작, Firebase 인증 상태 변화를 감지

---

## 5. 핵심 데이터 모델

### 5.1 타입 정의 (`types/index.ts`)

```typescript
// 사역 카테고리 (3종)
type Category = '심방' | '업무' | '기타';

// 세부 유형 (8종)
type SubType =
  | '방문심방' | '카페심방' | '전화심방'  // 심방
  | '회의' | '행정' | '기타'              // 업무
  | '새벽기도' | '기타';                  // 기타

// 사역 기록 엔트리 (핵심 단위)
interface MinistryEntry {
  id: string;           // crypto.randomUUID() 생성
  date: string;         // "YYYY-MM-DD"
  time: string;         // "09:00", "11:40" 등
  category: Category;
  subType: SubType;
  content: string;      // 사역 내용 (자유 텍스트)
  isHighlight: boolean; // ✨ 핵심 마크
  createdAt: string;    // ISO 8601 타임스탬프
}

// 주간 계획
interface WeeklyPlan {
  weekStartDate: string;       // 주 시작일 (일요일, YYYY-MM-DD)
  plans: { [key: string]: string };  // "주일" | "화" | ... | "비고" → 내용
}

// 주간 메모
interface WeeklyNote {
  weekStartDate: string;
  specialNote: string;
  dawnPrayerDays: string[];   // ["Mon", "Tue", ...] 새벽기도 체크
}

// 사역자 프로필
interface UserProfile {
  name: string;
  department: string;
  churchName: "오륜교회";     // 고정값
}
```

### 5.2 시간 슬롯 정의

```typescript
const TIME_SLOTS = [
  "09:00", "10:00", "11:00",
  "11:40",  // 점심
  "12:40", "14:00", "15:00", "16:00",
  "17:00",  // 저녁
  "18:00", "19:00", "20:00"
];
```

- **12개 시간 슬롯** × **6개 요일** (주일, 화~토) = **72개 셀**의 주간 시간표
- 월요일은 의도적으로 제외 (교회 사역 특성에 맞춤)

### 5.3 드래그 보드 전용 타입 (`drag-board/types.ts`)

```typescript
// 사역 블록 (팔레트에서 드래그)
interface BlockItem {
  id: string;
  category: Category;
  label: string;
  icon: React.ReactNode;
  color: string;           // Tailwind 배경색 클래스
  textColor: string;
  subTypes: { value: SubType; label: string }[];
}

// 기존 엔트리 (보드에서 드래그)
interface BoardEntryItem {
  id: string;
  subType: string;
  content: string;
  category: string;
  time: string;
  date: string;
}
```

---

## 6. 상태 관리 설계

### 6.1 Zustand Store 구조 (`useMinistryStore`)

```typescript
interface MinistryState {
  // ── 상태 ──
  user: UserAuth | null;          // 로그인 사용자 정보
  entries: MinistryEntry[];       // 사역 기록 배열
  weeklyPlans: WeeklyPlan[];      // 주간 계획 배열
  weeklyNotes: WeeklyNote[];      // 주간 메모 배열
  profile: UserProfile | null;    // 사역자 프로필

  // ── 액션 ──
  setUser: (user) => void;
  setEntries: (entries) => void;
  addEntry: (entry) => Promise<void>;
  updateEntry: (id, update) => Promise<void>;
  deleteEntry: (id) => Promise<void>;
  updateWeeklyPlan: (plan) => Promise<void>;
  updateWeeklyNote: (note) => Promise<void>;
  updateProfile: (profile) => Promise<void>;
  clearData: () => void;
}
```

### 6.2 영속화 전략

```typescript
persist(storeConfig, {
  name: 'ministry-store',           // localStorage 키
  partialize: (state) => ({         // 영속화할 필드만 선택 (user 제외)
    entries: state.entries,
    weeklyPlans: state.weeklyPlans,
    weeklyNotes: state.weeklyNotes,
    profile: state.profile,
  }),
});
```

**설계 의도**:
- `user` 정보는 Firebase Auth가 관리하므로 localStorage에 저장하지 않음
- 나머지 데이터는 `localStorage`에 캐시 → 오프라인에서도 접근 가능
- Firebase Firestore와 양방향 동기화 (Optimistic Update 패턴)

### 6.3 Optimistic Update 패턴

```
1. 사용자 액션 발생
2. Zustand 로컬 상태 즉시 업데이트 (UI 반응성)
3. Firebase Firestore에 비동기로 기록 (await setDoc)
4. Firestore onSnapshot 리스너가 변경 감지 → 상태 갱신 (최종 일관성 보장)
```

---

## 7. Firebase 연동

### 7.1 구성

| 서비스 | 용도 |
|--------|------|
| **Firebase Auth** | Google 소셜 로그인 (signInWithPopup/Redirect) |
| **Cloud Firestore** | NoSQL 데이터베이스 (실시간 동기화) |

### 7.2 Firestore 데이터 구조

```
users/
└── {uid}/
    ├── entries/
    │   └── {entryId}: MinistryEntry
    ├── plans/
    │   └── {weekStartDate}: WeeklyPlan
    ├── notes/
    │   └── {weekStartDate}: WeeklyNote
    └── profile/
        └── info: UserProfile
```

### 7.3 AuthInitializer — 실시간 동기화 허브

`AuthInitializer`는 렌더링 없이(`return null`) 인증 상태와 데이터를 관리합니다:

```
onAuthStateChanged 리스너
├── 로그인 시 → setUser() → 4개 onSnapshot 리스너 등록
│   ├── entries 컬렉션 → useMinistryStore.setState({ entries })
│   ├── plans 컬렉션 → useMinistryStore.setState({ weeklyPlans })
│   ├── notes 컬렉션 → useMinistryStore.setState({ weeklyNotes })
│   └── profile 컬렉션 → useMinistryStore.setState({ profile })
│
└── 로그아웃 시 → setUser(null) → clearData() → 리스너 해제
```

### 7.4 Firebase Config 전략

```typescript
// 환경변수(VITE_FIREBASE_*) 우선 → 없으면 fallback 설정 사용
const firebaseConfig = hasCompleteEnvConfig ? envConfig : fallbackConfig;
```

- 개발: fallback 내장 설정으로 즉시 실행 가능
- 프로덕션: `.env` 파일 또는 호스팅 환경변수 사용 권장

---

## 8. 드래그 앤 드롭 시스템

### 8.1 전체 구조

`DragDropBoard.tsx`는 앱의 핵심 컴포넌트 (886줄)로, 다음 하위 컴포넌트를 포함합니다:

```
DragDropBoard (메인)
├── DndContext (dnd-kit 컨텍스트)
│   ├── 팔레트 영역
│   │   └── DraggableBlock × 2 (심방, 업무)
│   │
│   ├── 시간표 그리드
│   │   └── DroppableTimeSlot × 72 (12시간 × 6요일)
│   │       └── DraggableEntry × N (기존 등록된 엔트리)
│   │
│   └── DragOverlay (드래그 중 고스트 표시)
│
├── MoveOrCopyModal (이동/복사 팝오버)
├── QuickCategoryModal (카테고리 선택)
├── DetailModal (상세 내용 입력)
└── EditModal (수정/삭제)
```

### 8.2 드래그 시나리오

#### 시나리오 A: 새 블록 → 시간표

```
1. 팔레트에서 "심방" 블록 드래그 시작 → handleDragStart()
2. 시간표 슬롯 위로 이동 → 슬롯 하이라이트
3. 슬롯에 드롭 → handleDragEnd()
4. QuickCategoryModal 표시 → 세부유형 선택 (방문/카페/전화)
5. DetailModal 표시 → 상세 내용 입력
6. "등록" 클릭 → addEntry() → Firestore 동기화
7. 슬롯 플래시 애니메이션 + 저장 토스트
```

#### 시나리오 B: 기존 엔트리 → 다른 슬롯

```
1. 기존 엔트리 드래그 시작 → handleDragStart()
2. 다른 슬롯으로 이동 → 슬롯 하이라이트
3. 드롭 → handleDragEnd()
4. 같은 위치면 무시 (date + time 비교)
5. MoveOrCopyModal (드롭 위치에 팝오버 표시)
   ├── "이동" → handleEntryMove(): updateEntry() + deleteEntry()
   └── "복사" → handleEntryCopy(): addEntry() (원본 유지)
6. 슬롯 플래시 + 저장 토스트
```

#### 시나리오 C: 빈 슬롯 클릭 (직접 입력)

```
1. 비어있는 슬롯 클릭 → handleSlotClick()
2. QuickCategoryModal 표시
3. 카테고리 선택 → DetailModal
4. 상세 입력 → 등록
```

### 8.3 센서 설정

```typescript
const pointerSensor = useSensor(PointerSensor, {
  activationConstraint: { distance: 8 }  // 8px 이상 이동해야 드래그 시작
});
const touchSensor = useSensor(TouchSensor, {
  activationConstraint: {
    delay: 200,          // 200ms 누르고 있어야 드래그 시작 (터치)
    tolerance: 5         // 5px 이내 흔들림 허용
  }
});
```

### 8.4 이동/복사 팝오버 위치 계산

```typescript
// 드롭된 슬롯의 DOM 위치를 기준으로 팝오버 좌표 계산
const overNode = over.rect;
const posX = overNode.left + overNode.width / 2;
const posY = overNode.top;

// 화면 밖으로 나가지 않도록 보정 (12px 여백)
if (x + rect.width > viewportWidth - 12) x = viewportWidth - rect.width - 12;
if (y + rect.height > viewportHeight - 12) y = viewportHeight - rect.height - 12;
if (x < 12) x = 12;
if (y < 12) y = 12;
```

### 8.5 슬롯 엔트리 조회 최적화

```typescript
// useMemo로 72개 슬롯을 Map으로 사전 인덱싱 → O(1) 조회
const entriesBySlot = useMemo(() => {
  const map = new Map<string, BoardEntryItem[]>();
  for (const entry of viewEntries) {
    const key = `${entry.date}|${entry.time}`;
    // Map에 추가
  }
  return map;
}, [viewEntries]);

// useCallback으로 안정적인 참조 → DroppableTimeSlot의 React.memo 동작 보장
const getSlotEntries = useCallback((date, time) => {
  return entriesBySlot.get(`${date}|${time}`) ?? EMPTY_SLOT_ENTRIES;
}, [entriesBySlot]);
```

---

## 9. 페이지별 기능 상세

### 9.1 HomePage (`/`)
- `DragDropBoard` 컴포넌트 렌더링
- 주간 시간표 그리드 + 팔레트 + 모달 시스템 포함
- `WeekSelector`로 주간 이동 (이전/다음 주, 오늘)

### 9.2 DashboardPage (`/dashboard`)
- **주간 통계 카드** (4장):
  - 방문심방 건수
  - 카페심방 건수
  - 전화심방 건수
  - 전체 합계 (파란색 강조)
- **주간 기록 리스트**: 해당 주의 엔트리를 최신순으로 표시
- 반응형 그리드: 모바일 2칸, 태블릿/PC 4칸

### 9.3 PlansPage (`/plans`)
- **요일별 계획 입력** (주일, 화~토, 비고)
- **새벽기도 체크**: 월~금 토글 버튼
- **특별 메모**: 자유 텍스트
- `WeeklyPlan` + `WeeklyNote` → Zustand + Firestore 동기화
- 입력 즉시 자동 저장 (onChange → updateWeeklyPlan)

### 9.4 ExportPage (`/export`)
- **프로필 표시**: 이름, 소속, 교회명
- **주간 선택**: WeekSelector
- **다운로드 옵션**: Excel (.xlsx) / HWPX (.hwpx)
- 프로필 미설정 시 → 안내 메시지 표시

### 9.5 HistoryPage (`/history`)
- **전체 기록 검색**: 사역 내용, 세부유형으로 검색
- **카테고리 필터**: 전체 / 심방 / 업무 / 기타
- **검색 하이라이트**: 검색어 매칭 부분 노란색 강조
- **개별 삭제**: hover 시 삭제 버튼 표시
- 표시 건수: `총 N건 중 M건 표시`

### 9.6 SettingsPage (`/settings`)
- **백업 내보내기**: 전체 데이터를 JSON으로 다운로드
  - 파일명: `ministry-backup-YYYY-MM-DD.json`
  - 포맷: `{ version: 1, createdAt, data: { entries, weeklyPlans, weeklyNotes, profile } }`
- **백업 복원**: JSON 파일 업로드 → 검증 후 복원
  - `isBackupPayload()` 타입 가드로 형식 검증
- **데이터 초기화**: 위험 구역 — 전체 삭제
  - 사역 기록, 주간 계획, 메모, 프로필 삭제 건수 표시

---

## 10. 내보내기 시스템

### 10.1 Excel 내보내기 (`excel-export.ts`)

```typescript
generateExcel(
  weekStartDate: Date,
  entries: MinistryEntry[],
  weeklyPlans: WeeklyPlan | undefined,
  weeklyNotes: WeeklyNote | undefined,
  profile: UserProfile,
  returnFile?: boolean
): Promise<File | void>
```

**주요 기능**:
- ExcelJS 라이브러리로 `.xlsx` 워크북 생성
- 교회 사역 보고서 양식에 맞는 레이아웃
- 시간별/요일별 엔트리 자동 배치
- 한국어 요일 표시 (주일, 화~토)
- 프로필 정보 (이름, 소속) 자동 삽입

### 10.2 HWPX 내보내기 (`hwpx-export.ts`)

```typescript
generateHwpx(
  weekStart: Date,
  entries: MinistryEntry[],
  plan: WeeklyPlan | undefined,
  note: WeeklyNote | undefined,
  profile: UserProfile
): Promise<void>
```

**주요 기능**:
- JSZip으로 HWPX (ZIP 기반 한글 문서) 생성
- XML DOM 조작으로 셀 텍스트 삽입
- **스타일 템플릿 복제**: 기존 셀의 `<hp:p>` 스타일을 복사하여 일관된 서식 유지
- **다중 라인 지원**: 여러 엔트리를 한 셀에 줄바꿈으로 표시
- **헬퍼 함수**:
  - `getCellParagraph()`: 행/열 좌표로 셀 참조
  - `findParagraphByText()`: 텍스트 기반 셀 탐색
  - `setCellText()`: 멀티라인 + 스타일 템플릿 적용

---

## 11. UI/UX 디자인 시스템

### 11.1 디자인 토큰 (CSS Custom Properties)

```css
:root {
  --color-primary: #007AFF;      /* Apple 블루 */
  --color-accent: #5AC8FA;       /* 라이트 블루 */
  --color-success: #34C759;      /* 그린 */
  --color-danger: #FF3B30;       /* 레드 */
  --color-warning: #FFCC00;      /* 옐로우 */
  --color-background: #F2F2F7;   /* iOS 배경 그레이 */
  --color-card: #FFFFFF;         /* 카드 배경 */
  --color-text: #1C1C1E;         /* 기본 텍스트 */
  --color-text-secondary: #8E8E93;
  --color-border: rgba(0, 0, 0, 0.1);
}
```

### 11.2 디자인 원칙

| 원칙 | 구현 |
|------|------|
| **iOS 네이티브 감성** | Apple SF 스타일 컬러 팔레트, 라운드 코너 (rounded-3xl) |
| **라이트 모드 전용** | 다크 모드 완전 제거 (v1.5) — 일관된 밝은 테마 |
| **모바일 퍼스트** | 하단 탭바 (모바일) / 좌측 사이드바 (데스크탑) |
| **피드백 우선** | 드롭 후 슬롯 플래시, 저장 토스트, 터치 액티브 스케일 |
| **접근성** | focus-visible 리링, aria-label, sr-only, 키보드 지원 |

### 11.3 반응형 레이아웃 전략

```
모바일 (< 768px):
┌──────────────────────┐
│     콘텐츠 영역       │
│                      │
│                      │
├──────────────────────┤
│ 🏠  📊  📋  📥  ⚙️  │  ← 하단 탭바 (iOS 스타일)
└──────────────────────┘

태블릿/PC (≥ 768px):
┌────┬─────────────────┐
│ 🏠 │                 │
│ 📊 │   콘텐츠 영역    │
│ 📋 │                 │
│ 📥 │                 │
│ ⚙️ │                 │
│    │                 │
│ 👤 │                 │  ← 좌측 사이드바 (프로필 + 로그인)
└────┴─────────────────┘
```

### 11.4 폰트

```css
--font-sans: "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI", 
             Roboto, Helvetica, Arial, sans-serif;
```

- **Pretendard**: 한국어에 최적화된 모던 폰트 (1순위)
- Apple/Windows 시스템 폰트 fallback

### 11.5 커스텀 애니메이션

```css
.animate-fade-in    /* fadeIn: opacity 0→1, translateY 10→0 (0.4s) */
.animate-slide-up   /* slideUp: opacity 0→1, translateY 20→0 (0.3s) */
```

- **prefers-reduced-motion 지원**: 접근성을 위해 모션 축소 설정 시 애니메이션 비활성화

---

## 12. 성능 최적화

### 12.1 적용된 최적화 기법

| 기법 | 위치 | 효과 |
|------|------|------|
| **React.memo** | `DraggableEntry`, `DroppableTimeSlot` | 72개 슬롯 중 변경된 것만 리렌더 |
| **useCallback** | `getSlotEntries`, `handleDragStart/End` 등 | 콜백 참조 안정화 → memo 정상 동작 |
| **useMemo** | `entriesBySlot` Map | 매 렌더마다 72개 슬롯 순회 대신 O(1) 조회 |
| **Zustand Selector** | `useMinistryStore(state => state.entries)` | 필요한 상태만 구독 → 불필요한 리렌더 방지 |
| **Lazy Loading** | 모든 페이지 컴포넌트 | React.lazy() + Suspense로 초기 번들 분할 |
| **상수 참조** | `EMPTY_SLOT_ENTRIES = []` | 빈 배열 새 생성 방지 → memo 깨짐 방지 |

### 12.2 슬롯 렌더링 성능

```
72개 DroppableTimeSlot (12시간 × 6요일)
├── 각 슬롯: React.memo로 감싸여 있음
├── getSlotEntries: useCallback → 슬롯별 엔트리 O(1) 조회
├── entriesBySlot: useMemo → 엔트리 목록 변경 시에만 Map 재생성
└── 결과: 하나의 엔트리 추가/수정 시 → 해당 슬롯만 리렌더
```

---

## 13. 빌드 및 배포

### 13.1 빌드 설정

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
});
```

### 13.2 스크립트

```json
{
  "dev": "vite",                  // HMR 개발 서버
  "build": "tsc -b && vite build", // 타입체크 + 프로덕션 빌드
  "lint": "eslint .",              // 린트 검사
  "preview": "vite preview"        // 빌드 결과 미리보기
}
```

### 13.3 개발 환경 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
# → http://localhost:5173

# 타입 체크
npx tsc --noEmit

# 프로덕션 빌드
npm run build
```

### 13.4 환경변수 (선택사항)

```env
# .env (Firebase 커스텀 설정)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## 14. 향후 확장 포인트

### 14.1 기술적 확장 가능 영역

| 영역 | 방향 |
|------|------|
| **PWA** | Service Worker + manifest.json → 오프라인 지원 + 홈 화면 설치 |
| **푸시 알림** | Firebase Cloud Messaging → 일정 리마인더 |
| **다중 사역자** | Firestore 권한 규칙 → 팀 단위 공유 보드 |
| **통계 시각화** | Chart.js / Recharts → 월간/분기 추세 그래프 |
| **AI 요약** | Gemini / GPT → 주간 보고서 자동 작성 |
| **i18n** | react-i18next → 다국어 지원 (현재 한국어 전용) |

### 14.2 코드 구조 확장 시 고려사항

1. **DragDropBoard.tsx 분리**: 현재 886줄 → 모달 컴포넌트를 별도 파일로 분리 권장
2. **API Layer 추상화**: Firestore 직접 호출 → Repository 패턴으로 분리 시 테스트 용이
3. **테스트 코드**: Vitest + React Testing Library → 핵심 로직 단위 테스트 추가

---

## 부록: 모달 시스템 요약

| 모달 | 트리거 | 역할 | 닫기 |
|------|--------|------|------|
| **QuickCategoryModal** | 빈 슬롯 클릭 / 새 블록 드롭 | 카테고리 선택 (심방/업무) | ESC, 취소 |
| **DetailModal** | 카테고리 선택 후 | 세부유형 + 내용 입력 | ESC, 취소 |
| **MoveOrCopyModal** | 기존 엔트리 드롭 | 이동/복사 선택 (드롭 위치 팝오버) | ESC, 바깥 클릭 |
| **EditModal** | 기존 엔트리 클릭 | 수정/삭제 | ESC, 취소, 인라인 삭제 확인 |

---

> **작성자**: Antigravity AI Assistant  
> **최종 빌드 검증**: `tsc --noEmit` ✅ | `vite build` ✅
