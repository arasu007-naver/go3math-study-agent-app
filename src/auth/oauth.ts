/**
 * 브라우저 OAuth(PKCE) 로그인. Supabase에 켜진 프로바이더(google, 커스텀 provider `custom:kakao`·`custom:naver`)를 시스템 인증 세션으로 열고,
 * 앱 스킴(com.qoolla.student://auth/callback)으로 돌아온 code를 세션으로 교환한다.
 * Apple은 iOS 네이티브 로그인(expo-apple-authentication) → identityToken을 signInWithIdToken으로 교환한다(브라우저·client secret 불필요).
 * §7.3의 "Google 네이티브 SDK + signInWithIdToken"은 클라이언트 ID 확보 후 대체 가능(추가 네이티브 모듈 필요).
 * 전제: Supabase 대시보드 Auth → URL Configuration의 Redirect URLs에 리디렉트 주소가 등록되어 있어야 한다.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'apple' | 'google' | 'kakao' | 'naver';

export const authRedirectUrl = () => Linking.createURL('auth/callback');

// Supabase provider 이름. 콜백은 모두 <project>.supabase.co/auth/v1/callback.
// - 네이버: 커스텀 OAuth provider. UserInfo URL은 naver-userinfo Edge Function(중첩 응답을 평평하게).
// - 카카오: 커스텀 OIDC provider. 이 카카오 앱은 옛 통합 동의항목 `profile`만 있어서, profile_nickname·profile_image를
//   항상 요청하는 Supabase 기본 kakao provider는 KOE205로 실패한다(2026-11-01 확인).
const SUPABASE_PROVIDER = { google: 'google', kakao: 'custom:kakao', naver: 'custom:naver' } as const;

export async function signInWithProvider(provider: OAuthProvider): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (provider === 'apple') return signInWithApple();
  const redirectTo = authRedirectUrl();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: SUPABASE_PROVIDER[provider],
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error || !data?.url) return { ok: false, reason: error?.message ?? 'no auth url' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (__DEV__) console.log('[login] auth session result:', result.type, result.type === 'success' ? result.url.replace(/code=[^&]+/g, 'code=…') : '');
  if (result.type !== 'success') return { ok: false, reason: result.type === 'cancel' || result.type === 'dismiss' ? 'cancelled' : result.type };

  const { queryParams } = Linking.parse(result.url);

  const code = typeof queryParams?.code === 'string' ? queryParams.code : undefined;
  if (!code) {
    const desc = queryParams?.error_description ?? queryParams?.error ?? queryParams?.reason;
    return { ok: false, reason: typeof desc === 'string' ? desc : '인증 응답에 유효한 토큰이 없습니다.' };
  }
  const exchanged = await supabase.auth.exchangeCodeForSession(code);
  return exchanged.error ? { ok: false, reason: exchanged.error.message } : { ok: true };
}

type SignInResult = { ok: true } | { ok: false; reason: string };

/** iOS 전용(기존 앱도 Apple 버튼은 iOS에서만). Supabase Apple provider의 Client IDs에 번들 ID가 있어야 한다. */
async function signInWithApple(): Promise<SignInResult> {
  if (!(await AppleAuthentication.isAvailableAsync())) return { ok: false, reason: '이 기기에서는 Apple 로그인을 쓸 수 없어요.' };
  // Apple에는 해시한 nonce를, Supabase에는 원본 nonce를 넘긴다(Supabase가 해시해 토큰과 비교).
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      nonce: hashedNonce,
    });
  } catch (e) {
    if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return { ok: false, reason: 'cancelled' };
    throw e;
  }
  if (!credential.identityToken) return { ok: false, reason: 'Apple 인증 토큰을 받지 못했어요.' };

  const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: credential.identityToken, nonce: rawNonce });
  if (error) return { ok: false, reason: error.message };

  // Apple은 이름을 최초 로그인 때만 준다 → 그때 Supabase 사용자 메타데이터에 저장(내 정보 패널이 full_name을 읽는다).
  const fullName = credential.fullName ? AppleAuthentication.formatFullName(credential.fullName) : '';
  if (fullName) await supabase.auth.updateUser({ data: { full_name: fullName } });
  return { ok: true };
}
