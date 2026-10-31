import { authStore } from '../state/auth';
import { createStore } from '../state/createStore';
import { supabaseAuthStore } from './supabase';

/** 개발 빌드 전용: 로그인 없이 에이전트 화면 확인(OAuth 설정 전 테스트용). 릴리스에서는 쓰지 않는다. */
export const devGuestStore = createStore((_: boolean, v: boolean) => v, false);

export type AuthGate = 'loading' | 'signedIn' | 'signedOut';

/** 레거시 app-token(업그레이드 사용자) 또는 Supabase 세션이 있으면 로그인 상태 */
export function useAuthGate(): AuthGate {
  const legacy = authStore.useStore();
  const sb = supabaseAuthStore.useStore();
  const guest = devGuestStore.useStore();
  if (legacy.appToken || guest || sb.status === 'signedIn') return 'signedIn';
  if (sb.status === 'loading') return 'loading';
  return 'signedOut';
}
