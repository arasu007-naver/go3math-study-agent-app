import { authStore } from '../state/auth';
import { createStore } from '../state/createStore';

/** 개발 빌드 전용: 로그인 없이 에이전트 화면 확인(OAuth 설정 전 테스트용). 릴리스에서는 쓰지 않는다. */
export const devGuestStore = createStore((_: boolean, v: boolean) => v, false);

export type AuthGate = 'loading' | 'signedIn' | 'signedOut';

/** 기존 app-token이 있으면 로그인 상태(시작 시 bootstrap이 저장소에서 동기로 복원한다) */
export function useAuthGate(): AuthGate {
  const legacy = authStore.useStore();
  const guest = devGuestStore.useStore();
  return legacy.appToken || guest ? 'signedIn' : 'signedOut';
}
