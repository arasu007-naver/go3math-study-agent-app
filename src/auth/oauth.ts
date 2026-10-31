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

export type OAuthProvider = 'google' | 'kakao';

export const authRedirectUrl = () => Linking.createURL('auth/callback');

export async function signInWithProvider(provider: OAuthProvider): Promise<{ ok: true } | { ok: false; reason: string }> {
  const redirectTo = authRedirectUrl();
  const { data, error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo, skipBrowserRedirect: true } });
  if (error || !data?.url) return { ok: false, reason: error?.message ?? 'no auth url' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return { ok: false, reason: result.type === 'cancel' || result.type === 'dismiss' ? 'cancelled' : result.type };

  const { queryParams } = Linking.parse(result.url);
  const code = typeof queryParams?.code === 'string' ? queryParams.code : undefined;
  if (!code) {
    const desc = queryParams?.error_description ?? queryParams?.error;
    return { ok: false, reason: typeof desc === 'string' ? desc : 'no code in redirect' };
  }
  const exchanged = await supabase.auth.exchangeCodeForSession(code);
  return exchanged.error ? { ok: false, reason: exchanged.error.message } : { ok: true };
}
