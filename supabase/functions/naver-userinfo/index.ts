// supabase/functions/naver-userinfo/index.ts
//
// Supabase 커스텀 OAuth provider `custom:naver`의 UserInfo URL로 쓰는 프록시.
// 네이버 프로필 API(/v1/nid/me)는 사용자 정보를 `response` 안에 감싸 돌려줘서 Supabase가 id를 찾지 못한다
// ("error missing provider id"). 이 함수가 Supabase가 보낸 네이버 access token(Authorization 헤더)으로
// 프로필을 조회해 OIDC 표준 필드(sub, email, name, picture)로 평평하게 바꿔 돌려준다.
//
// Supabase Auth 서버가 Supabase JWT 없이 호출하므로 JWT 검증을 끈다:
//   supabase/config.toml → [functions.naver-userinfo] verify_jwt = false

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const authorization = req.headers.get("authorization");
  if (!authorization) return json({ error: "missing_authorization" }, 401);

  const res = await fetch("https://openapi.naver.com/v1/nid/me", { headers: { Authorization: authorization } });
  const body = await res.json().catch(() => null);
  const u = body?.response;
  if (!res.ok || !u?.id) {
    console.warn("naver userinfo failed:", res.status, body?.resultcode, body?.message);
    return json({ error: "naver_userinfo_failed", message: body?.message ?? null }, res.ok ? 502 : res.status);
  }

  return json({
    sub: u.id,
    id: u.id,
    email: u.email ?? null,
    email_verified: Boolean(u.email), // 네이버가 확인한 계정 이메일
    name: u.name ?? u.nickname ?? null,
    nickname: u.nickname ?? null,
    picture: u.profile_image ?? null,
    avatar_url: u.profile_image ?? null,
  });
});
