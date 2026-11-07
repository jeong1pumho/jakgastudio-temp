# 새로운 문자 알림 신청 → 무료 Gmail 통지 (TEST ONLY)

수신 메일: **jakgastudio@gmail.com**

## 구현 및 보안

- 홈페이지에서 SMS 인증이 성공하여 **신규 구독자**가 확정되거나 수신거부 후 다시 명시적으로 가입한 경우에만 알림 이벤트를 생성
- 현장 수기 등록 / 이름 수정 / 기존 활성 구독자가 중복 인증한 경우는 알림 대상 아님
- DB 트리거가 `sms_signup_email_outbox`에 발송 대기 기록을 생성 → Edge Function에서 Resend Email API로 전달
- 이메일에는 개인정보(이름, 전화번호)를 넣지 않고, 관리자 페이지 링크와 신청 시각만 포함
- 메일 장애가 방문자 구독 완료에 영향을 주지 않음. 발송 대기/실패/완료 상태를 관리자에서 확인 가능
- 관리자에서 `미발송 알림 재시도` 지원. Resend idempotency key로 중복 이메일 위험 저감
- outbox RLS 및 anon/authenticated 직접 접근 차단, 관련 기능은 서버의 관리자 권한으로만 호출
- 테스트 환경만 수정. 운영 `jakgastudio.com`과 운영 Supabase는 그대로 유지

## 활성화: 테스트 Supabase Edge Function Secrets

1. [Resend](https://resend.com/)에서 무료 계정 생성
2. Resend에 `jakgastudio.com` 도메인 추가, 제시되는 DNS 레코드로 발신 도메인 확인 (Gmail 수신 주소와 다른 개념)
3. Resend에서 API Key 발급
4. [테스트 Supabase Secrets](https://supabase.com/dashboard/project/qrbavxempotptnmflqoq/functions/secrets)에 다음 2개 등록:
   - `RESEND_API_KEY`: Resend에서 발급한 `re_...` 비밀키
   - `RESEND_FROM_EMAIL`: 확인된 발신 주소, 예를 들어 `작가작업실 JEJU <notify@jakgastudio.com>`
5. 키는 **GitHub나 채팅에 공유하지 않고** Supabase Secrets에서 직접 등록.
6. 테스트 홈페이지에서 새로운 번호로 SMS 인증 신청 → `jakgastudio@gmail.com` 수신 확인
7. 관리자 `/admin/sms.html`의 Gmail 알림 상태에서 발송 결과 및 미발송 재시도 확인

Resend 공식 무료 플랜은 월 3,000건, 하루 100건까지. 발신 도메인 검증 및 DNS 설정이 완료되어야 사용자 지정 발신 주소로 실제 알림이 전송됩니다.

기존 테스트 가입자에게는 과거 가입 사실을 소급해서 알림을 보내지 않습니다.

## 주의

단순히 `RESEND_API_KEY`를 Supabase에 등록하지 않은 상태에서는 발송 대기 이벤트만 생성되고 메일은 발송되지 않습니다. 초기 테스트 전에 메일 연결 설정을 마쳐야 합니다. DNS 확인은 이름 서버 공급업체에서 진행합니다. 기존 SPF 레코드를 덮어쓰지 말고 Resend 안내에 따라 충돌이 없는지 확인하세요.
