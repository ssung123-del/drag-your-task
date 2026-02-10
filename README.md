
# ⛪ 사역 비서 앱 (Ministry Secretary App)

21명의 사역자가 각자의 스마트폰에서 사역 일지를 기록하고, 주간 보고서를 엑셀로 자동 생성하는 웹앱입니다.
**서버 없이** 동작하며, 데이터는 각자의 핸드폰에 안전하게 저장됩니다.

## ✨ 주요 기능
1. **📝 간편 기록**: 언제 어디서나 빠르게 사역 내용 입력 (자동 심방/업무 태깅)
2. **📊 주간 통계**: 이번 주 심방 현황 한눈에 파악
3. **📅 주간 계획**: 다음 주 계획 및 특이사항 입력
4. **📥 엑셀 내보내기**: "교역자 주간 사역일지" HWP 양식과 100% 동일한 엑셀 파일 생성
5. **🔒 데이터 안전**: 내 폰에만 저장 + 백업 파일 다운로드 지원

## 🚀 실행 방법 (로컬 개발)

1. 의존성 설치
   ```bash
   npm install
   ```

2. 개발 서버 실행
   ```bash
   npm run dev
   ```
   브라우저에서 `http://localhost:5173` 접속

## 🌍 배포 방법 (GitHub Pages - 무료)

이 앱을 21명의 사역자가 쓸 수 있게 배포하려면:

1. **GitHub 저장소 생성**
   - GitHub에 새 저장소(Repository)를 만듭니다 (예: `ministry-app`).

2. **코드 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   # 원격 저장소 연결 (본인의 주소로 변경)
   git remote add origin https://github.com/YOUR_ID/ministry-app.git
   git push -u origin main
   ```

3. **GitHub Pages 설정**
   - GitHub 저장소 > **Settings** > **Pages** 이동
   - Build and deployment > Source를 **GitHub Actions**로 변경? 
   - **아니요, 더 쉬운 방법**: 
     - `vite.config.ts`에서 `base: '/ministry-app/'` 설정 추가 (저장소 이름이 ministry-app인 경우)
     - `npm run build` 실행
     - `dist` 폴더의 내용을 `gh-pages` 브랜치에 푸시하면 됩니다.
   
   **★ 가장 간단한 방법 (자동화 스크립트 사용):**
   - `package.json`에 `"deploy": "gh-pages -d dist"` 추가
   - `npm install -D gh-pages`
   - `npm run build`
   - `npm run deploy`

4. **URL 공유**
   - 배포가 완료되면 `https://YOUR_ID.github.io/ministry-app` 주소가 생성됩니다.
   - 이 주소를 사역자들에게 공유하세요.

## 📱 스마트폰 홈 화면 추가 (앱처럼 쓰기)
- **아이폰 (Safari)**: 공유 버튼 -> '홈 화면에 추가'
- **안드로이드 (Chrome)**: 메뉴 버튼 -> '홈 화면에 추가'

## ⚠️ 데이터 관리 주의사항
- 데이터는 **각자의 브라우저(localStorage)**에 저장됩니다.
- 브라우저 캐시를 삭제하거나 기기를 변경하면 데이터가 사라질 수 있습니다.
- **설정 > 데이터 백업** 기능을 이용해 주기적으로 JSON 파일을 백업하세요.

Made for 오름교회
