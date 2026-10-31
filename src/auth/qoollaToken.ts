/**
 * Supabase 세션 → 기존 Qoolla app-token 교환.
 * 서버(www.qoolla.com /api/hello-supabase)가 Supabase 토큰을 검증하고 MariaDB users에 사용자를 기록(없으면 생성)한 뒤
 * 기존 /api/hello와 같은 app-token을 준다. 그 토큰을 레거시 키 `app-token`에 저장해 기존 API(GraphQL·REST)가 그대로 동작하게 한다.
 */
import type { Session } from '@supabase/supabase-js';
import { LOGIN_URL } from '../config/api.constants';
import { authStore } from '../state/auth';
import { storage } from '../storage';
import { LEGACY_KEYS } from '../storage/types';

const TIMEOUT_MS = 15000; // 기존 helloQoollaService와 같음

export async function exchangeQoollaToken(session: Session): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${LOGIN_URL}/api/hello-supabase`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, Accept: 'application/json' },
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.token) throw new Error(`hello-supabase ${res.status}: ${body?.error ?? 'no token'}`);
    storage.set(LEGACY_KEYS.appToken, body.token);
    authStore.dispatch({
      type: 'SIGN_IN',
      item: { token: body.token, name: body.user?.name, email: body.user?.email, imageUrl: body.user?.imageUrl },
    });
  } finally {
    clearTimeout(timer);
  }
}
