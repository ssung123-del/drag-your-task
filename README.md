# 🎯 드래그 유얼 테스크 (Drag Your Task) v1.3

> **"사역 기록, 이제는 입력하지 말고 드래그하세요."**  
> 드래그 유얼 테스크는 교역자분들의 효율적인 사역 기록과 주간 보고서 작성을 돕는 스마트 비서 앱입니다.

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)

---

## 🆕 최신 업데이트 (v1.3 Highlights)

### 1. 🎨 UI/UX 전면 개편
- **다크 모드 완벽 지원**: 시스템 설정에 따른 눈이 편안한 다크 모드 테마 적용.
- **디자인 통일성 강화**: 버튼 스타일, 색상 팔레트, 컴포넌트 디자인을 통일하여 더욱 세련된 경험 제공.

### 2. 📝 HWPX 내보내기 기능 강화
- **정교한 템플릿 매핑**: 기존 한글 서식(HWPX)의 셀 좌표에 데이터를 정확하게 입력합니다.
- **다중 입력 지원**: 같은 시간대에 여러 사역 일정을 입력해도 누락 없이 모두 기록됩니다.
- **안정성 확보**: 불안정한 '클립보드 복사' 기능을 제거하고, 파일 직접 다운로드 방식을 채택하여 데이터 손실 위험을 없앴습니다.

### 3. 🛠️ 사용성 개선
- **수정 기능 추가**: 등록된 사역 블록을 다시 클릭하여 내용을 간편하게 수정할 수 있습니다.
- **입력 편의성**: 심방/업무 등 카테고리별 입력 필드를 최적화했습니다.

---

## ✨ 핵심 기능 (Core Features)

### 1. 🖱️ 드래그 앤 드롭 사역 기록
- 복잡한 입력창 대신 **심방**, **업무** 블록을 원하는 시간대에 드래그하여 직관적으로 기록합니다.
- dnd-kit 기반의 부드러운 애니메이션과 터치 대응을 지원합니다.

### 2. ☁️ Google 클라우드 자동 동기화
- Firebase 연동을 통해 **Google 로그인** 시 모든 데이터가 서버에 안전하게 저장됩니다.
- 아이폰에서 기록하고 PC에서 즉시 확인하는 실시간 동기화 환경을 제공합니다.

### 3. 📱 멀티 플랫폼 반응형 디자인
- **데스크톱/태블릿**: 넓은 화면을 활용한 좌측 사이드바 인터페이스.
- **모바일**: 한 손 조작에 최적화된 하단 탭 바와 카드형 레이아웃.
- Apple 디자인 가이드를 준수하는 프리미엄 UI/UX.

### 4. 📊 스마트 주간 보고서 (Excel & HWPX)
- 주간 사역 데이터를 분석하여 정해진 양식의 **Excel 및 HWPX 파일**로 즉시 내보내기 가능.
- **HWPX 템플릿 지원**: 기존 한글(HWP) 서식의 스타일(폰트, 문단 모양)을 그대로 유지하며 데이터를 자동 입력합니다.
- 수동 정리가 필요 없는 자동화된 보고 프로세스.

---

## 🛠 기술 스택 (Tech Stack)
- **Frontend**: React (Functional Components, Hooks)
- **State Management**: Zustand (with Persist Middleware)
- **Styling**: Tailwind CSS
- **Backend**: Firebase Store (Firestore), Firebase Auth (Google)
- **Utilities**: Date-fns, Lucide-React, ExcelJS, JSZip, clsx

---

## 🚀 시작하기 (How to Start)

### 로컬 실행
```bash
npm install
npm run dev
```

### 환경 설정
- `.lib/firebase.ts` 파일에 자신의 Firebase 설정값을 입력해야 클라우드 기능을 사용할 수 있습니다.

---

## 📋 사역자 가이드
1. **Google 로그인**: 하단 버튼을 통해 로그인하여 동기화를 시작합니다.
2. **사역 블록 드래그**: 상단의 블록을 타임라인으로 끌어옵니다.
3. **상세 내용 입력**: 나타나는 모달에서 세부 유형과 내용을 입력합니다.
4. **Excel 다운로드**: [내보내기] 탭에서 주간 보고서를 생성합니다.

---

**Designed for Ministry Efficiency**  
Copyright © 2026 Drag Your Task Team. All rights reserved.
