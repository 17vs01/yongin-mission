# ✝️ 용인시청 공무원선교회 웹앱

출석 관리 + 기도제목 + 게시판이 하나로!

---

## 🚀 시작하기 전에 필요한 것

1. [Node.js](https://nodejs.org) 설치 (v18 이상)
2. [Firebase](https://console.firebase.google.com) 계정

---

## 📦 설치 순서

### 1단계 — Firebase 프로젝트 만들기

1. [Firebase 콘솔](https://console.firebase.google.com) 접속
2. **프로젝트 추가** 클릭
3. 프로젝트 이름: `yongin-mission` (원하는 이름으로)
4. **Authentication** 메뉴 → **시작하기** → **이메일/비밀번호** 사용 설정
5. **Firestore Database** 메뉴 → **데이터베이스 만들기** → **테스트 모드**로 시작
6. **프로젝트 설정** → **내 앱** → 웹 앱 추가 → 설정값 복사

### 2단계 — 환경변수 설정

프로젝트 루트에 `.env` 파일 만들고 아래 내용 입력:

```
VITE_FIREBASE_API_KEY=복사한값
VITE_FIREBASE_AUTH_DOMAIN=복사한값
VITE_FIREBASE_PROJECT_ID=복사한값
VITE_FIREBASE_STORAGE_BUCKET=복사한값
VITE_FIREBASE_MESSAGING_SENDER_ID=복사한값
VITE_FIREBASE_APP_ID=복사한값

VITE_ADMIN_SETUP_CODE=admin1234
```

> ⚠️ `VITE_ADMIN_SETUP_CODE` 는 관리자 가입 시 입력하는 비밀 코드예요. 원하는 값으로 바꾸세요!

### 3단계 — Firestore 보안 규칙 적용

Firebase 콘솔 → Firestore → **규칙** 탭 → `firestore.rules` 파일 내용 붙여넣기 → **게시**

### 4단계 — 앱 실행

```bash
# 패키지 설치
npm install

# 개발 서버 시작
npm run dev
```

브라우저에서 `http://localhost:5173` 접속!

---

## 👤 관리자 계정 만들기

1. 앱에서 **회원가입**
2. **관리자 코드** 입력란에 `.env`에 설정한 코드 입력 (기본: `admin1234`)
3. 가입 완료 → 자동으로 관리자 권한 부여

---

## 📱 주요 기능

| 기능 | 경로 |
|------|------|
| 홈 대시보드 | `/` |
| 출석하기 | `/attend` |
| 공지사항 | `/notice` |
| 자유게시판 | `/freeboard` |
| 기도제목 | `/prayer` |
| 출석 순위 | `/ranking` |
| 관리자 페이지 | `/admin` |

---

## 🖨️ QR 코드 출석 방법

1. 관리자 페이지 → **출석 세션** 탭
2. 세션 제목 입력 후 **세션 생성 + QR 발급** 클릭
3. QR 코드 팝업에서 **인쇄하기** 클릭
4. 출력한 QR 용지를 현장에 부착
5. 회원이 QR 스캔 → 앱 자동 접속 → 출석 완료! ✅

---

## 🌐 배포하기 (Vercel 무료)

```bash
npm install -g vercel
vercel
```

Vercel 대시보드에서 환경변수도 똑같이 입력해주세요!

---

## 📁 폴더 구조

```
src/
├── firebase/         Firebase 설정
├── contexts/         전역 상태 (로그인 정보)
├── components/       공통 컴포넌트 (레이아웃, 네비게이션)
└── pages/            각 화면
    ├── LoginPage
    ├── RegisterPage
    ├── HomePage
    ├── AttendancePage
    ├── NoticePage / NoticeDetailPage
    ├── FreeBoardPage / FreeBoardWritePage / FreeBoardDetailPage
    ├── PrayerPage
    ├── RankingPage
    └── AdminPage
```
