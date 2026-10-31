/**
 * 로그아웃. 기존 앱은 storage.clearAll() + SIGN_OUT이었지만, 새 앱은 로그인 자격만 지운다:
 * 레거시 app-token, Supabase 세션, 개발용 둘러보기 플래그. 펜 설정 등 다른 레거시 키는 유지(§3.5.1).
 */
import { authStore } from '../state/auth';
import { storage } from '../storage';
import { LEGACY_KEYS } from '../storage/types';
import { supabase, supabaseAuthStore } from './supabase';
import { devGuestStore } from './useAuthGate';

export async function logout() {
  if (supabaseAuthStore.getState().session) await supabase.auth.signOut();
  storage.remove(LEGACY_KEYS.appToken);
  authStore.dispatch({ type: 'SIGN_OUT' });
  devGuestStore.dispatch(false);
}
