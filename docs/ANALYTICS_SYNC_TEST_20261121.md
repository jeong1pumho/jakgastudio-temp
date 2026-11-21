# 운영 방문 분석 기능 테스트사이트 동기화 (2026-11-21)

**대상**: 테스트 전용 GitHub `jeong1pumho/jakgastudio-temp`, Vercel `jakgastudio-temp`, Supabase `qrbavxempotptnmflqoq`만. 운영사이트/운영 DB 변경 없음.

## 동기화 범위
- 운영의 관리자 Top 메뉴에 `방문 분석` 신규 추가, 7개 기존 관리자 화면 공통 적용.
- 관리자 홈의 Clarity 카드와 상세 `/admin/analytics.html`의 섹션 순서(Clarity → 자체 행동 분석 → GA4) 동일하게 반영.
- `/api/visit-analytics` 및 `/api/cron-clarity`은 기존 `api/admin.js` 함수 재사용(Hobby 12함수 제한 회피).
- `assets/site-visitor.js`의 호스트 가드를 **jakgastudio-temp.vercel.app**으로 변경하고 기존 공개 페이지 4곳에 삽입. test 프로젝트에서만 동의한 방문 데이터 수집.
- 테스트 Supabase에 `visit_daily_counts`, `visit_clarity_snapshots` 및 별도의 `analytics_private` 스키마/RPC 생성. Production의 통계 및 비밀키는 복제하지 않음.
- 테스트 Vercel Production 타깃(테스트 전용 프로젝트)에 `VISIT_ANALYTICS_INGEST_SECRET`, `CRON_SECRET` 별도 생성·등록.
- 운영 Clarity Project ID·API Token은 **테스트사이트에 등록하지 않음**. 별도 테스트용 Microsoft Clarity 프로젝트를 마련하기 전까지는 `연동 대기`로 표시; 테스트 Cron은 외부 Clarity API를 호출하지 않음.
- 기존 테스트 GA4의 `GA4_TEST_MEASUREMENT_ID`, `GA4_TEST_PROPERTY_ID`, `GA4_TEST_CLIENT_EMAIL`, `GA4_TEST_PRIVATE_KEY` 및 `lib/site-analytics.js`, `assets/site-analytics.js`은 그대로 유지.
- SMS 발송 상태 엔드포인트도 테스트 Supabase `qrbavxempotptnmflqoq`를 유지하며 테스트 public noindex 정책 보존.

## 확인 항목
1. Vercel 최신 테스트 배포 READY 및 테스트 도메인 alias.
2. 관리자 홈에 Clarity 카드, Top 메뉴 링크 존재.
3. 방문 분석 페이지의 섹션 순서가 Clarity → 자체 행동 분석 → Google Analytics 4.
4. 방문자 스크립트에 테스트 호스트만 있고 운영 Clarity ID와 운영 Supabase 프로젝트 참조 없음.
5. 테스트 전용 GA4 config 응답 유효, 방문 분석 공개 GET이 관리자 인증 없이 데이터 반환하지 않음.
6. 관리자 로그인 후 보고서 및 자체 이벤트 수신은 실제 사용자의 브라우저·인증 세션으로 별도 종단간 확인이 필요함.

## 향후 테스트→운영 반영 시 주의
단순 전체 덮어쓰기 금지. API와 관리자 UI는 동기화하고, site analytics 호스트·GA4 변수 이름·SMS URL·Vercel noindex 헤더·Supabase 대상 프로젝트·Clarity 비밀키·Cron 환경을 분리할 것.
