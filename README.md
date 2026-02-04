# NextGate Full Stack Application

> 아마존 SP-API 연동 실시간 대시보드 - Full Backend with Mock Data

## 🎉 완성된 기능

### ✅ Backend (Node.js + Express)
- Express 서버 with RESTful API
- **Mock Amazon SP-API 데이터** (실제 구조와 동일)
- 세션 기반 인증 시스템
- 실시간 데이터 API 엔드포인트:
  - `/api/sales` - 매출 데이터 & 트렌드
  - `/api/orders` - 주문 목록
  - `/api/inventory` - 재고 현황
  - `/api/shipping` - 배송 추적
  - `/api/dashboard/summary` - 전체 요약

### ✅ Frontend
- 프로페셔널 랜딩 페이지 (기존)
- **실시간 대시보드** (새로 추가)
  - Chart.js 차트 (매출 트렌드, 비용 분석)
  - KPI 카드 (매출, 순이익, 주문, 재고)
  - 실시간 데이터 테이블
  - 배송 추적 카드
  - 30초마다 자동 새로고침
- 로그인 시스템

---

## 🚀 빠른 시작

### 1. 서버 시작

```bash
cd /Users/kimjiyeon/.gemini/antigravity/scratch/nextgate-landing

# 개발 모드 (nodemon 사용)
npm run dev

# 또는 일반 모드
npm start
```

### 2. 브라우저에서 접속

**랜딩 페이지**: http://localhost:3000

**로그인 페이지**: http://localhost:3000/login.html

**대시보드**: http://localhost:3000/dashboard/dashboard.html (로그인 후)

### 3. 로그인 정보

```
이메일: admin@nextgate.com
비밀번호: demo123
```

---

## 📁 프로젝트 구조

```
nextgate-landing/
├── backend/
│   ├── server.js          # Express 서버
│   └── mockData.js        # Mock Amazon SP-API 데이터
├── frontend/
│   ├── index.html         # 랜딩 페이지
│   ├── login.html         # 로그인 페이지
│   ├── styles.css
│   ├── script.js
│   └── (images)
├── dashboard/
│   ├── dashboard.html     # 실시간 대시보드
│   ├── dashboard.css
│   └── dashboard.js
├── package.json
├── .env                   # 환경변수
└── README.md
```

---

## 🔌 API 엔드포인트

### 인증
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/status` - 인증 상태 확인

### 데이터 (인증 필요)
- `GET /api/sales` - 매출 데이터
  ```json
  {
    "totalRevenue": "85300.10",
    "netProfit": "59710.07",
    "profitMargin": "70.0",
    "revenueTrend": [...]
  }
  ```

- `GET /api/orders?status=shipped&limit=10` - 주문 목록
- `GET /api/inventory` - 재고 현황
- `GET /api/shipping` - 배송 추적
- `GET /api/dashboard/summary` - 대시보드 요약

---

## 🎨 대시보드 기능

### KPI 카드
- 💵 **총 매출**: 실시간 총 매출액
- 💰 **순이익**: 아마존 수수료, 배송비, 마케팅 비용 차감 후
- 📦 **총 주문**: 현재 총 주문 수
- 📊 **재고 알림**: Low Stock 제품 수

### 차트
- 📈 **매출 트렌드**: 최근 30일 일별 매출 (Chart.js Line)
- 🥧 **비용 분석**: 수수료 breakdown (Chart.js Doughnut)

### 데이터 테이블
- **최근 주문**: 주문번호, 제품명, 금액, 상태, 날짜
- **재고 현황**: SKU, 제품명, 재고량, 상태

### 배송 추적
- 실시간 배송 위치
- 배송 상태 (Processing, In Transit, Delivered)

---

## ⚙️ 환경변수 (.env)

```bash
PORT=3000
NODE_ENV=development
USE_MOCK_DATA=true

# Demo Credentials
ADMIN_EMAIL=admin@nextgate.com
ADMIN_PASSWORD=demo123

# 나중에 실제 Amazon API 연결 시
# LWA_CLIENT_ID=your-client-id
# LWA_CLIENT_SECRET=your-client-secret
# REFRESH_TOKEN=your-refresh-token
# AWS_ACCESS_KEY_ID=your-aws-key
# AWS_SECRET_ACCESS_KEY=your-aws-secret
```

---

## 🔄 Mock Data → Real Data 전환

현재는 **Mock 데이터**를 사용하고 있습니다. 나중에 실제 Amazon SP-API로 전환하려면:

### 1. Amazon SP-API 클라이언트 설치
```bash
npm install amazon-sp-api
```

### 2. `.env` 파일 업데이트
```bash
USE_MOCK_DATA=false
LWA_CLIENT_ID=your-actual-client-id
LWA_CLIENT_SECRET=your-actual-secret
REFRESH_TOKEN=your-refresh-token
# ... AWS credentials
```

### 3. `backend/server.js` 수정
현재 `mockData.js`를 사용하는 부분을 실제 SP-API 호출로 교체

---

## 📊 Mock 데이터 상세

### 주문 데이터
- 5개의 샘플 주문
- 상태: Shipped, Delivered, Pending
- 실제 Amazon Order ID 형식
- 미국 주소 (NY, CA, IL, WA, MA)

### 재고 데이터
- K-뷰티 제품 (스킨케어, 마스크팩)
- K-푸드 스낵
- FBA 재고 수량
- Low Stock / Out of Stock 알림

### 금융 데이터
- 총 매출: $85,300.10
- Amazon 수수료: 15%
- 배송비: 10%
- 마케팅: 5%
- **순이익: $59,710.07 (70% 마진)**

---

## 🚀 배포 (나중에)

### Railway 배포
```bash
# Railway CLI 설치
npm i -g @railway/cli

# 로그인
railway login

# 배포
railway up
```

### Vercel 배포
```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel
```

---

## 🎯 다음 단계

1. ✅ **지금**: Mock 데이터로 대시보드 테스트
2. ⏳ **나중에**: Identity Verification 완료
3. ⏳ **나중에**: Production 앱 승인
4. ⏳ **나중에**: Refresh Token + AWS 설정
5. ⏳ **나중에**: 실제 SP-API 연동

---

## 💡 팁

- 대시보드는 30초마다 자동으로 데이터를 새로고침합니다
- Chrome DevTools로 Network 탭에서 API 호출 확인 가능
- Mock 데이터는 `backend/mockData.js`에서 수정 가능

---

**Made with ❤️ for Korean manufacturers**

🎨 By NextGate Team
