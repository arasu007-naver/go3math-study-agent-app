// supabase/functions/naver-auth/index.ts
//
// 네이버 OAuth Callback 전용 Edge Function.
// 네이버 개발자센터의 Callback URL로 이 함수 주소를 등록한다:
//   https://<project-ref>.supabase.co/functions/v1/naver-auth
//
// 브라우저가 헤더 없이 top-level 이동으로 들어오므로 JWT 검증을 꺼야 한다:
//   supabase/config.toml → [functions.naver-auth] verify_jwt = false
//   또는 배포 시: supabase functions deploy naver-auth --no-verify-jwt
//
// 필요한 환경 변수(Secrets):
//   NAVER_CLIENT_ID       : 네이버 애플리케이션 Client ID
//   NAVER_CLIENT_SECRET   : 네이버 애플리케이션 Client Secret
//   FRONTEND_URL          : 리디렉트될 프론트엔드/앱 기본 URL (기본값: com.qoolla.student://auth/callback)
//
// (SUPABASE_URL 및 SUPABASE_SERVICE_ROLE_KEY는 Supabase 플랫폼이 자동 주입)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_REDIRECT_URL =
  Deno.env.get("FRONTEND_URL") ??
  Deno.env.get("APP_REDIRECT_URL") ??
  "com.qoolla.student://auth/callback";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

/**
 * 프론트엔드 또는 앱 딥링크 스킴으로 302 리디렉션 생성
 * (Response.redirect 대신 수동 헤더 설정으로 호환성 확보)
 */
function buildRedirectResponse(
  targetBase: string,
  path: string,
  params: Record<string, string> = {}
): Response {
  let destination: URL;

  // 커스텀 스킴(예: com.qoolla.student://)인 경우와 일반 HTTP(S) URL 구분
  const isCustomScheme =
    targetBase.includes("://") &&
    !targetBase.startsWith("http://") &&
    !targetBase.startsWith("https://");

  if (isCustomScheme) {
    const cleanBase = targetBase.replace(/\/+$/, "");
    // path가 이미 베이스에 포함되어 있으면 중복 방지
    const cleanPath = path.replace(/^\/+/, "");
    const combined =
      cleanBase.endsWith("/auth/callback") || !cleanPath
        ? cleanBase
        : `${cleanBase}/${cleanPath}`;
    destination = new URL(combined);
  } else {
    destination = new URL(path, targetBase);
  }

  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      destination.searchParams.set(k, v);
    }
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: destination.toString(),
      ...corsHeaders,
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state") ?? "";
  const oauthError = url.searchParams.get("error");
  const customRedirect = url.searchParams.get("redirect_to");

  // 리디렉트 기준 URL 결정
  const redirectBase = customRedirect || DEFAULT_REDIRECT_URL;

  const fail = (reason: string) => {
    const isCustomScheme =
      redirectBase.includes("://") &&
      !redirectBase.startsWith("http://") &&
      !redirectBase.startsWith("https://");

    const errorPath = isCustomScheme ? "/auth/callback" : "/auth/auth-code-error";
    return buildRedirectResponse(redirectBase, errorPath, {
      error: reason,
      reason,
      state,
      provider: "naver",
    });
  };

  try {
    if (oauthError) {
      console.warn("Naver OAuth error received:", oauthError);
      return fail("naver_denied");
    }
    if (!code) {
      console.warn("Missing code in Naver callback");
      return fail("missing_credentials");
    }

    // ===== 1. 네이버 토큰 교환 =====
    const naverClientId = Deno.env.get("NAVER_CLIENT_ID");
    const naverClientSecret = Deno.env.get("NAVER_CLIENT_SECRET");

    if (!naverClientId || !naverClientSecret) {
      console.error("NAVER_CLIENT_ID or NAVER_CLIENT_SECRET is not configured");
      return fail("server_misconfigured");
    }

    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: naverClientId,
      client_secret: naverClientSecret,
      code,
      state,
    });

    const tokenRes = await fetch(`https://nid.naver.com/oauth2.0/token?${tokenParams}`, {
      method: "GET",
    });
    const tokenData = await tokenRes.json();

    if (!tokenData?.access_token) {
      console.error("Token exchange failed:", tokenData?.error, tokenData?.error_description);
      return fail("naver_token_failed");
    }

    // ===== 2. 네이버 프로필 조회 =====
    const profileRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profileData = await profileRes.json();
    const naverUser = profileData?.response;

    if (!naverUser?.id) {
      console.error("Profile fetch failed:", profileData?.message);
      return fail("naver_profile_failed");
    }

    // ===== 3. Supabase Admin Client =====
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 네이버 사용자 이메일 (개발자 센터 필수 설정 fallback)
    const email: string = naverUser.email ?? `naver_${naverUser.id}@no-email.invalid`;

    const identity = {
      name: naverUser.name ?? naverUser.nickname ?? null,
      avatar_url: naverUser.profile_image ?? null,
      provider: "naver",
      naver_id: naverUser.id,
    };

    // ===== 4. 사용자 생성 (이미 존재하면 통과) =====
    const { error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
      user_metadata: identity,
      app_metadata: { provider: "naver", providers: ["naver"] },
    });

    if (createError) {
      const alreadyExists =
        (createError as { code?: string }).code === "email_exists" ||
        createError.status === 422 ||
        /already been registered|already registered|duplicate/i.test(createError.message);

      if (!alreadyExists) {
        console.error("User create error:", createError.message);
        return fail("user_create_failed");
      }
      // 이미 등록된 사용자는 로그인 계속 진행
    }

    // ===== 5. Magiclink 토큰 발급 =====
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error("Generate link error:", linkError?.message);
      return fail("link_failed");
    }

    // profiles 테이블이 존재할 경우 auth_provider 기록 (실패해도 로그인 유지)
    if (linkData.user?.id) {
      try {
        const { error: providerError } = await supabaseAdmin
          .from("profiles")
          .update({ auth_provider: "naver" })
          .eq("id", linkData.user.id);

        if (providerError) {
          // profiles 테이블 부재 또는 컬럼 차이 시 무시
          console.warn("auth_provider sync skipped:", providerError.message);
        }
      } catch (_e) {
        // 테이블 미존재 시 무시
      }
    }

    // ===== 6. 프론트엔드 / 앱으로 토큰 전달 리디렉션 =====
    // verifyOtp({ token_hash, type: "magiclink" })를 호출할 수 있도록 파라미터 전달
    return buildRedirectResponse(redirectBase, "/auth/callback", {
      token_hash: linkData.properties.hashed_token,
      type: "magiclink",
      provider: "naver",
      state,
    });
  } catch (err) {
    console.error("Unexpected error:", err instanceof Error ? err.message : err);
    return fail("server_error");
  }
});
