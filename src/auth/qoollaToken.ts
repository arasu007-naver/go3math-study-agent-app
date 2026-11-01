/**
 * 소셜 토큰 → 기존 Qoolla app-token (기존 앱 helloQoollaService와 같음).
 * www.qoolla.com `/api/hello`에 { provider, password: <소셜 토큰> }을 보내면 서버가 MariaDB users에서 사용자를 찾거나 만들고
 * app-token을 준다. 그 토큰을 레거시 키 `app-token`에 저장해 기존 API(GraphQL·REST)가 그대로 동작하게 한다.
 */
import { LOGIN_URL } from '../config/api.constants';
import { authStore } from '../state/auth';
import { storage } from '../storage';
import { LEGACY_KEYS } from '../storage/types';

const TIMEOUT_MS = 15000; // 기존 helloQoollaService와 같음

export async function helloQoolla(token: string, provider: string): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${LOGIN_URL}/api/hello`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ provider, password: token }),
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok || !body?.token || !body?.user) throw new Error(`hello ${res.status}: ${body?.error ?? 'no token'}`);
    storage.set(LEGACY_KEYS.appToken, body.token);
    authStore.dispatch({
      type: 'SIGN_IN',
      item: { token: body.token, name: body.user.name, email: body.user.email, imageUrl: body.user.imageUrl },
    });
  } finally {
    clearTimeout(timer);
  }
}
