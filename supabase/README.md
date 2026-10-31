# Supabase Edge Functions — Naver Auth

`go3math-study-agent-app`의 네이버 OAuth 로그인을 처리하는 Supabase Edge Function입니다.
네이버 개발자센터의 Callback URL로부터 인가 코드(`code`)를 수신하고, 네이버 사용자 프로필을 조회한 뒤 Supabase Magiclink(`token_hash`)를 생성하여 앱/웹으로 리디렉트합니다.

---

## 1. 디렉터리 구조

```text
supabase/
├── config.toml                     # Edge Function 전역 설정 (verify_jwt = false)
├── .env.example                    # 환경변수 템플릿
├── README.md                       # 배포 및 연동 가이드
└── functions/
    └── naver-auth/
        ├── index.ts                # Edge Function 메인 핸들러
        ├── deno.json               # Deno import map
        └── .npmrc
```

---

## 2. 네이버 개발자센터 설정

1. [네이버 개발자센터](https://developers.naver.com/apps) 이동
2. 애플리케이션 등록 또는 기존 애플리케이션 선택
3. **사용 API**: `네아로 (네이버 아이디로 로그인)`
   - 필수 제공 항목: **이메일 주소**, **이름**, **별명(닉네임)**
4. **로그인 오픈 API 서비스 환경**:
   - **서비스 URL**: `https://go3math.qoolla.com` (또는 서비스 메인 URL)
   - **네이버 로그인 Callback URL**:
     ```text
     https://<project-ref>.supabase.co/functions/v1/naver-auth
     ```
     *(예: `https://eppoiscttggzgcxtukln.supabase.co/functions/v1/naver-auth`)*

---

## 3. 환경 변수 (Secrets) 설정

### 배포 환경 (Supabase Dashboard 또는 CLI)

```bash
# 네이버 클라이언트 자격증명
supabase secrets set NAVER_CLIENT_ID=your_naver_client_id
supabase secrets set NAVER_CLIENT_SECRET=your_naver_client_secret

# 리디렉트 대상 URL (앱 딥링크 또는 웹 주소)
supabase secrets set FRONTEND_URL=com.qoolla.student://auth/callback
```

> **참고**: `SUPABASE_URL`과 `SUPABASE_SERVICE_ROLE_KEY`는 Supabase Edge Functions 런타임에서 자동으로 주입됩니다.

---

## 4. Edge Function 배포

```bash
# 프로젝트 루트(go3math-study-agent-app) 또는 supabase 디렉터리에서 실행
supabase functions deploy naver-auth --no-verify-jwt
```

- `--no-verify-jwt` 플래그는 필수입니다 (네이버가 Authorization 헤더 없이 브라우저 top-level GET으로 진입하기 때문).
- `supabase/config.toml`에 이미 `verify_jwt = false`가 지정되어 있습니다.

---

## 5. 인증 흐름 (Auth Flow)

1. **로그인 시작**:
   클라이언트(앱/웹)에서 브라우저를 통해 네이버 인가 URL 오픈:
   ```text
   https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/naver-auth&state=${STATE}
   ```
2. **네이버 로그인 완료 후 콜백**:
   네이버가 `https://${SUPABASE_PROJECT_REF}.supabase.co/functions/v1/naver-auth?code=...&state=...`로 리디렉트
3. **Edge Function 처리**:
   - `code`로 네이버 `access_token` 발급
   - 네이버 프로필 API (`/v1/nid/me`) 조회
   - Supabase Admin Client로 사용자 생성 (`auth.admin.createUser`)
   - `auth.admin.generateLink({ type: "magiclink", email })`로 `token_hash` 발급
4. **클라이언트로 리디렉트**:
   `com.qoolla.student://auth/callback?token_hash=...&type=magiclink&provider=naver` (302 Redirect)
5. **클라이언트 세션 수립**:
   앱 콜백에서 `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` 실행 → 로그인 완료!
