/**
 * 브라우저 OAuth(PKCE) 로그인. Supabase에 켜진 프로바이더(google, kakao)를 시스템 인증 세션으로 열고,
 * 앱 스킴(com.qoolla.student://auth/callback)으로 돌아온 code를 세션으로 교환한다.
 * §7.3의 "Google 네이티브 SDK + signInWithIdToken"은 클라이언트 ID 확보 후 대체 가능(추가 네이티브 모듈 필요).
 * 전제: Supabase 대시보드 Auth → URL Configuration의 Redirect URLs에 리디렉트 주소가 등록되어 있어야 한다.
 */
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export type OAuthProvider = 'google' | 'kakao' | 'naver';

export const authRedirectUrl = () => Linking.createURL('auth/callback');

export async function signInWithProvider(provider: OAuthProvider): Promise<{ ok: true } | { ok: false; reason: string }> {
  const redirectTo = authRedirectUrl();

  let authUrl: string;

  if (provider === 'naver') {
    const naverClientId = process.env.EXPO_PUBLIC_NAVER_CLIENT_ID;
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!naverClientId) {
      return { ok: false, reason: 'EXPO_PUBLIC_NAVER_CLIENT_ID가 설정되지 않았습니다.' };
    }
    if (!supabaseUrl) {
      return { ok: false, reason: 'EXPO_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.' };
    }
    const callbackUrl = `${supabaseUrl.replace(/\/+$/, '')}/functions/v1/naver-auth`;
    const state = Math.random().toString(36).substring(2);
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: naverClientId,
      redirect_uri: callbackUrl,
      state,
    });
    authUrl = `https://nid.naver.com/oauth2.0/authorize?${params.toString()}`;
  } else {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
    if (error || !data?.url) return { ok: false, reason: error?.message ?? 'no auth url' };
    authUrl = data.url;
  }

  const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectTo);
  if (result.type !== 'success') return { ok: false, reason: result.type === 'cancel' || result.type === 'dismiss' ? 'cancelled' : result.type };

  const { queryParams } = Linking.parse(result.url);

  // 1) naver-auth Edge Function이 전달하는 magiclink token_hash
  const tokenHash = typeof queryParams?.token_hash === 'string' ? queryParams.token_hash : undefined;
  if (tokenHash) {
    const verified = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'magiclink' });
    return verified.error ? { ok: false, reason: verified.error.message } : { ok: true };
  }

  // 2) 일반 OAuth(google/kakao)가 전달하는 code
  const code = typeof queryParams?.code === 'string' ? queryParams.code : undefined;
  if (!code) {
    const desc = queryParams?.error_description ?? queryParams?.error ?? queryParams?.reason;
    return { ok: false, reason: typeof desc === 'string' ? desc : '인증 응답에 유효한 토큰이 없습니다.' };
  }
  const exchanged = await supabase.auth.exchangeCodeForSession(code);
  return exchanged.error ? { ok: false, reason: exchanged.error.message } : { ok: true };
}
