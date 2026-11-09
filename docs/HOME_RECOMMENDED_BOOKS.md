# Home / 추천 도서 — 임시 사이트 전용

배포 대상: `jakgastudio-temp.vercel.app` (`prj_8SUBanJRucDwen3xIjvE1LcYWLwb`).
DB 대상: `qrbavxempotptnmflqoq`. 운영 사이트와 DB는 변경하지 않습니다.

Home은 `api/home.js`에서 실제 도서·행사·일정을 서버 렌더링합니다.
상단 메뉴: `/`, `/books`, `/news`, `/calendar`, `/space`, `/programs`, `/visit`.
`/space`, `/programs`, `/visit`는 최소 안내 페이지이며 상세 디자인은 후속 작업입니다.
임시 사이트는 기존 noindex를 유지합니다. canonical/페이지 제목/설명/실제 링크/사이트맵을 준비했습니다.

## 도서 관리자

`/admin/books.html`, 기존 관리자 로그인 사용.
도서 제목, 추천글, 사진 1–20장, 사진 순서, 공개 여부, 노출 순서를 편집합니다.
사진 추가 시 확대/좌우/상하 조절로 정사각형 크롭 후 업로드합니다.
높은 노출 순서 우선, 동순위는 신규 도서 우선. Home은 공개 도서 최대 3개.
목록에서 2줄 요약, `/books/:uuid`에서 사진과 추천글 전체 표시.
등록된 도서가 없을 때는 실제 빈 상태를 표시하며 가상의 책을 등록하지 않습니다.

Supabase migration: `recommended_books_admin`, table `recommended_books`, bucket `book-media`.
기존 `news_admins` 권한으로만 쓰기 허용, 공개 도서만 익명 읽기 허용.
이미지는 공개 저장소이며 비공개 도서 상태로 전환해도 이미 배포된 사진 URL은 비밀이 아닙니다.
사진 제거/도서 삭제는 게시 연결을 제거합니다. 실수로 삭제된 참조를 복구할 수 있도록 저장소 원본은 자동 삭제하지 않습니다.

주간 일정은 서울 기준 월–일. 기존 월간 캘린더와 동일하게 일·월 정기휴무,
화–토 09–17시 중 일정 및 12–13시를 제외한 자유방문 시간을 계산합니다.
비공개 일정 메모는 조회하지 않습니다.
