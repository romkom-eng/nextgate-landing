# NextGate - 미국 시장 진출 풀케어 솔루션

> 사장님은 제품만 하세요, 미국 시장은 저희가 전부 하겠습니다.

## 🚀 프로젝트 개요

NextGate는 K-뷰티/식품 제조사를 위한 데이터 기반 북미 진출 통합 인큐베이팅 솔루션입니다. 아마존 입점부터 미국 현지 배송까지, 0원으로 시작하는 글로벌 진출 파트너입니다.

## ✨ 주요 기능

### 4단계 프로세스
1. **샘플 전송** - 제품 사진과 샘플만 보내주시면 준비 끝
2. **AI 리스팅 최적화** - 아마존 SEO에 최적화된 상세페이지 제작
3. **현지 물류 관리** - 미국 현지 본부장이 직접 FBA 창고 입고 및 통관 관리
4. **실시간 수익 확인** - 사장님 전용 대시보드로 실시간 순이익 확인

### 핵심 서비스
- ✅ 실시간 배송 트래커
- ✅ 정산 시뮬레이션
- ✅ 판매 현황 리포트
- ✅ 데이터 기반 재고 보충 알림

## 🎨 디자인 시스템

### 색상 팔레트
- **Main Navy**: `#1a2332` - 신뢰감을 주는 메인 컬러
- **Orange**: `#ff6b35` - 에너지가 느껴지는 포인트 컬러
- **White**: `#ffffff` - 깔끔함을 위한 베이스 컬러

### 타이포그래피
- **영문**: Inter (Google Fonts)
- **한글**: Noto Sans KR (Google Fonts)

## 🛠 기술 스택

- **HTML5** - 시맨틱 마크업과 SEO 최적화
- **CSS3** - 모던 디자인 시스템과 반응형 레이아웃
  - CSS Variables for theming
  - Flexbox & Grid for layouts
  - Smooth animations & transitions
- **Vanilla JavaScript** - 퍼포먼스 최적화된 인터랙션
  - Intersection Observer API for scroll animations
  - Debounced scroll events
  - Smooth scrolling navigation

## 📁 프로젝트 구조

```
nextgate-landing/
├── index.html                               # 메인 HTML 파일
├── styles.css                               # CSS 스타일시트
├── script.js                                # JavaScript 파일
├── dashboard_preview_ui_1770166822715.png   # 대시보드 미리보기 이미지
├── hero_background_image_1770166835934.png  # 히어로 배경 이미지
├── problem_illustration_1770166853319.png   # 문제점 일러스트
└── README.md                                # 프로젝트 문서
```

## 🚀 로컬에서 실행하기

1. 프로젝트 클론
```bash
git clone https://github.com/yourusername/nextgate-landing.git
cd nextgate-landing
```

2. 브라우저에서 열기
- `index.html` 파일을 더블클릭하거나
- Live Server 확장 프로그램 사용 (VS Code)
- 간단한 HTTP 서버 실행:
```bash
python3 -m http.server 8000
# 또는
npx serve
```

3. 브라우저에서 `http://localhost:8000` 접속

## 🌐 GitHub Pages로 배포하기

### 방법 1: GitHub 웹 인터페이스 사용

1. GitHub에 리포지토리 생성
2. 모든 파일 업로드
3. Settings → Pages로 이동
4. Source를 "main" 브랜치로 선택
5. Save 클릭
6. `https://yourusername.github.io/nextgate-landing/`에서 확인

### 방법 2: Git CLI 사용

```bash
# Git 초기화
git init

# 파일 추가
git add .

# 커밋
git commit -m "Initial commit: NextGate landing page"

# GitHub 리포지토리 연결
git remote add origin https://github.com/yourusername/nextgate-landing.git

# 푸시
git branch -M main
git push -u origin main
```

그 후 GitHub Settings에서 Pages 활성화

## 📱 반응형 디자인

- **Desktop**: 1280px 이상 - 풀 레이아웃
- **Tablet**: 768px - 1279px - 적응형 그리드
- **Mobile**: 767px 이하 - 단일 컬럼 레이아웃

## ✅ 브라우저 호환성

- ✅ Chrome (최신)
- ✅ Firefox (최신)
- ✅ Safari (최신)
- ✅ Edge (최신)

## 🎯 주요 섹션

1. **Hero Section** - 메인 가치 제안 및 CTA
2. **Problem Section** - 고객 페인 포인트
3. **Solution Section** - 4단계 서비스 프로세스
4. **Features Section** - 대시보드 미리보기 및 핵심 기능
5. **Trust Section** - 차별화 포인트 및 비교표
6. **Contact Section** - 상담 신청 폼

## 🔧 커스터마이징

### 색상 변경
`styles.css`의 CSS Variables를 수정하세요:

```css
:root {
    --color-navy-main: #1a2332;
    --color-orange-main: #ff6b35;
    /* ... */
}
```

### 컨텐츠 수정
`index.html`에서 각 섹션의 텍스트를 직접 수정하세요.

### 이미지 교체
프로젝트 루트의 이미지 파일을 교체하고 `index.html`의 이미지 경로를 업데이트하세요.

## 📄 라이선스

이 프로젝트는 MIT 라이선스로 배포됩니다.

## 📧 문의

- 이메일: contact@nextgate.com
- 전화: 02-1234-5678

---

**Made with ❤️ for Korean manufacturers**
