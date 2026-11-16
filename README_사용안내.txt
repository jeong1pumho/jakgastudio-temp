작가작업실 JEJU — 2026-10-21 최종 수정 버전

index.html: 최종 원페이지 HTML
assets/: 실제 공간 사진, CI, 투명 배경 파비콘, 지도 정적 이미지

SPACE 사진 교체
- 2행 왼쪽: 책장 원본 (space_bookshelf_display_final.webp)
- 3행 왼쪽: 흰 테이블과 꽃 — 제공하신 가로 구도 보존 (space_flower_table_final.webp)
나머지 이미지, 문구, 버튼, 섹션 구성은 기존 HTML 유지

브랜드 검색 이름(구조화 데이터 name/alternateName)
작가작업실 JEJU / 작가작업실JEJU / 작가작업실 제주 / 작가작업실제주
검색엔진에 노출을 강제할 수 있는 것은 아닙니다. 제목, 본문, 메타데이터, 구조화 데이터 일치에 초점을 두었습니다.

파비콘
- favicon-{16,32,48,180,192,512}.png: 바깥 배경 투명(RGBA)
- favicon.ico: 하위호환

주의사항
1. fonts/README.txt 안내에 따라 사용자 소유의 Kakao Light/Regular/Bold TTF를 assets/fonts에 별도로 넣어 주세요(배포 파일에 포함하지 않음).
2. https://jakgastudio.co.kr/ 은 확정된 배포 도메인이라는 전제의 canonical/JSON-LD 주소입니다. 다른 도메인에 배포하면 HTML의 canonical/og:url/JSON-LD url을 함께 변경해 주세요.
3. 지도는 API가 아닌 정적 이미지 확대/축소/드래그로 유지됩니다.
4. 검색 노출은 검색엔진 색인과 검색 품질 평가에 따라 달라집니다.
