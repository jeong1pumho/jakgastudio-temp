# 작가작업실 JEJU 테스트용 Supabase 분리 기록

- 테스트 웹: https://jakgastudio-temp.vercel.app/
- 테스트 Supabase: `qrbavxempotptnmflqoq` (Tokyo, `ap-northeast-1`)
- 운영 Supabase: `dolgltddpnxzwlqigtjw` — **수정·삭제하지 않음**
- 테스트 Vercel 환경변수: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` (Vercel 비밀값에만 저장)
- 메인 저장소의 실제 데이터는 서로 연동되지 않음

## 최초 데이터

2026-11-01 기준 공개된 NEWS 게시물 4건과 공개 사진 33장을 테스트 DB 및 별도 Storage(`news-media`)에 한 번 복제했습니다. 복제 이후 운영용 게시물을 변경해도 테스트에는 자동 반영되지 않습니다.

## 보안

- `public.news_posts`, `public.news_admins` 모두 RLS 적용
- 익명 사용자는 게시물 조회만 가능, 글쓰기와 사진 업로드는 관리자 권한 필요
- 이미지 복사 과정의 임시 익명 업로드 정책은 제거됨
- 테스트 사이트 검색로봇 차단(`noindex`) 유지
- 운영 사이트의 환경변수·데이터·관리자 계정·인증 설정은 유지
- 실제 운영 관리자 계정과 비밀번호는 테스트 프로젝트에 복제하지 않음

## 관리자 초기화 (별도 절차)

신규 Supabase Auth 프로젝트에는 관리자 계정이 없습니다. 테스트 프로젝트의 Authentication → Users에서 테스트 관리자를 별도로 생성한 다음 `public.news_admins`에 신규 사용자 UUID를 등록해야 관리자 로그인과 NEWS 저장이 가능합니다. 비밀번호·서비스 역할 키는 GitHub에 저장하지 마세요.

## 복원 주의

테스트 DB와 Storage는 GitHub 소스 ZIP에 포함되지 않습니다. Supabase 별도 백업이 필요합니다. 이후 추가 기능은 먼저 이 테스트 프로젝트에 개발·검증하고, 운영 반영 지시가 있을 때만 운영 프로젝트로 마이그레이션합니다.
