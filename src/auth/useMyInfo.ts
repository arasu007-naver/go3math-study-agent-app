import type { MyInfo } from '../kit/profile/MyInfoPanel';
import { authStore } from '../state/auth';
import { devGuestStore } from './useAuthGate';

/** 내 정보 패널용: 기존 app-token 사용자 정보(SIGN_IN / MY_INFO) */
export function useMyInfo(): MyInfo {
  const legacy = authStore.useStore();
  const guest = devGuestStore.useStore();
  return {
    name: legacy.name,
    email: legacy.email,
    imageUrl: legacy.imageUrl,
    via: legacy.appToken ? '기존 앱 토큰' : guest ? '개발용 둘러보기' : undefined,
  };
}
