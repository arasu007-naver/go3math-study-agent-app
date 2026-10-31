/**
 * Supabase 클라이언트(명세서 §7.3). 공개(publishable) 키만 쓴다 — 값은 .env / EAS 환경변수의 EXPO_PUBLIC_*.
 * 세션은 앱 저장소(MMKV, 웹은 localStorage)에 `agent:` 접두사 키로 둔다(레거시 키와 분리, §3.5.1).
 */
import 'react-native-url-polyfill/auto';
import { createClient, type Session } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { storage } from '../storage';
import { authStore } from '../state/auth';
import { createStore } from '../state/createStore';
import { exchangeQoollaToken } from './qoollaToken';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? 'https://not-configured.invalid', anonKey ?? 'not-configured', {
  auth: {
    storage: {
      getItem: (k) => storage.getString(k) ?? null,
      setItem: (k, v) => storage.set(k, v),
      removeItem: (k) => storage.remove(k),
    },
    storageKey: 'agent:supabase-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});

// 앱이 전면일 때만 토큰 자동 갱신(Supabase RN 권장 방식)
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export type SupabaseAuthState = { status: 'loading' | 'signedOut' | 'signedIn'; session: Session | null };

export const supabaseAuthStore = createStore(
  (_: SupabaseAuthState, next: SupabaseAuthState) => next,
  { status: 'loading', session: null } as SupabaseAuthState,
);

export function startSupabaseAuth() {
  if (!isSupabaseConfigured) {
    supabaseAuthStore.dispatch({ status: 'signedOut', session: null });
    return;
  }
  supabase.auth.getSession().then(({ data }) =>
    supabaseAuthStore.dispatch({ status: data.session ? 'signedIn' : 'signedOut', session: data.session }),
  );
  supabase.auth.onAuthStateChange((_event, session) => {
    supabaseAuthStore.dispatch({ status: session ? 'signedIn' : 'signedOut', session });
    // 로그인 직후(SIGNED_IN)와 앱 시작(INITIAL_SESSION) 모두: Supabase 세션은 있는데 기존 app-token이 없으면 교환한다.
    if (session && !authStore.getState().appToken) syncQoollaToken(session);
  });
}

let exchanging = false;
function syncQoollaToken(session: Session) {
  if (exchanging) return;
  exchanging = true;
  // onAuthStateChange 콜백 안에서 바로 await하지 않는다(Supabase 권장) — 다음 틱에 실행
  setTimeout(() => {
    exchangeQoollaToken(session)
      .catch((e) => console.warn('[login] qoolla token exchange failed:', (e as Error)?.message ?? e))
      .finally(() => {
        exchanging = false;
      });
  }, 0);
}
