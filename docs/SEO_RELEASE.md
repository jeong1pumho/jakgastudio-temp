# 작가작업실 JEJU 검색엔진 최적화 배포 기준

## 운영 정책
- 운영 정규 도메인: `https://www.jakgastudio.com`
- 테스트 사이트: `https://jakgastudio-temp.vercel.app` (robots 및 HTTP 헤더의 noindex 유지)
- 테스트 저장소에서 먼저 변경·검증하고 **명시적 운영 배포 지시**가 있을 때만 운영 저장소에 반영합니다.
- 테스트 DB와 운영 DB가 독립적이므로 동적 NEWS/도서 URL 개수는 서로 다를 수 있습니다. 데이터베이스를 복사하지 않습니다.

## 사이트맵 자동 생성
- `/sitemap.xml`: 정규 기본 URL 11개, 발행된 추천 도서 상세, 공개 NEWS 상세, 향후 공개 모임·특별행사 상세 자동 갱신
- `/programs`는 리디렉션이므로 **미포함** (5개 `/programs/:slug`만 포함)
- 관리자, API, 테스트 도메인, 비공개·삭제 콘텐츠는 미포함
- 동적 콘텐츠의 `lastmod`는 실제 데이터 `updated_at`을 사용; 변경일을 알 수 없는 고정 페이지는 임의 날짜를 생성하지 않음
- 캐시 최대 300초 후 자동 최신 데이터 반영
- 50,000 URL 한도에 근접하면 사일로별 sitemap index로 분리해야 함. 조용히 누락시키지 말 것

## 검색엔진 알림 및 RSS
- `/robots.txt` (운영): `Sitemap: https://www.jakgastudio.com/sitemap.xml`
- `/rss.xml`: 실제 공개 NEWS 본문을 포함하는 RSS 2.0 피드. 별도 서버리스 함수 대신 `/api/sitemap?_format=rss`로 리라이트
- Bing·네이버 등 IndexNow 참여 검색엔진: `lib/indexnow.js`가 **운영 도메인의 인증된 관리자 저장/삭제** 직후 변경 URL 전송. 테스트 도메인은 제출하지 않음
- IndexNow 검증 파일: 사이트 루트 `65642d34b176c5ec2dca3f500044a9ee.txt`
- Google은 IndexNow에 참여하지 않음. Search Console 사이트맵과 URL 검사 사용
- IndexNow 전송은 빠른 수집 요청이며 실제 색인을 보장하지 않음

## 테스트 → 운영 릴리스 필수 점검
1. 테스트 GitHub Actions의 `seo-check.cjs` 검사 성공 확인
2. 테스트 `/sitemap.xml`, `/robots.txt`, `/rss.xml`, IndexNow 검증 파일의 HTTP 200 확인
3. 테스트 사이트맵이 운영 정규 도메인의 URL만 포함하고 `/programs`, `/admin`, 테스트 도메인을 포함하지 않는지 확인
4. 운영 배포 지시 후 **기능 변경 파일**을 운영 저장소에 개별 반영; 운영의 기존 `vercel.json`과 `lib/seo.js`를 통째로 덮어쓰지 않음
5. 운영 GitHub Actions 검사 성공, Vercel 배포 READY, `www.jakgastudio.com` 별칭 연결 확인
6. 운영 `/sitemap.xml` 200 + 공개 NEWS 및 도서 자동 생성 + `/robots.txt` Sitemap 줄 검증
7. 운영 RSS와 IndexNow 키 파일 200, 테스트 noindex 및 운영 index/follow 확인
8. 검색엔진 콘솔 권한이 있을 때 Google / 네이버 / Bing 제출·수집 상태를 확인. 단순 사이트맵 배포만으로 콘솔 제출이 완료됐다고 보고하지 않음

## 검색엔진 관리 화면
- Google Search Console: https://search.google.com/search-console (색인 > Sitemaps)
- 네이버 서치어드바이저: https://searchadvisor.naver.com/ (요청 > 사이트맵 제출, RSS 제출)
- Bing Webmaster Tools: https://www.bing.com/webmasters/ (Sitemaps, IndexNow)
