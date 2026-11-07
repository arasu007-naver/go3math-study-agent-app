/**
 * Java(Spring) API 호출 — `api-v2` 저장소(배포 이름 api-v3). graphql-api-server·student-web에서 옮겨 오는 기능이 쓴다.
 * 토큰은 기존 app-token(Bearer)을 그대로 쓴다.
 *
 * 옮기는 동안은 Java 쪽이 아직 배포 전이거나 토큰을 거절할 수 있으므로, 호출자는 `isUnavailable(e)`일 때만 기존 경로로 받는다.
 * 400 같은 요청 오류는 Java가 내린 판단이므로 기존 경로로 다시 보내지 않는다.
 */
import { API_V3_URL } from '../../config/api.constants';

const TIMEOUT_MS = 8000;

export class ApiV3Error extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiV3Error';
  }
}

export async function apiV3<T>(path: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${API_V3_URL}${path}`, {
      method: init.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      },
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      signal: controller.signal,
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new ApiV3Error(res.status, (body as { message?: string } | null)?.message ?? `${path} ${res.status}`);
    return body as T;
  } finally {
    clearTimeout(timer);
  }
}

/** 배포 전(404)·토큰 거절(401/403)·서버 장애(5xx)·네트워크 오류 — 기존 경로로 받아도 되는 실패 */
export function isUnavailable(e: unknown): boolean {
  if (!(e instanceof ApiV3Error)) return true;
  return e.status === 401 || e.status === 403 || e.status === 404 || e.status >= 500;
}
