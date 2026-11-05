import { useEffect } from 'react';
import { myInfo } from '../api/rest';
import type { MyInfo } from '../kit/profile/MyInfoPanel';
import { authStore } from '../state/auth';
import { devGuestStore } from './useAuthGate';

/** 내 정보 패널용: 기존 app-token 사용자 정보(SIGN_IN / MY_INFO) */
export function useMyInfo(): MyInfo {
  const legacy = authStore.useStore();
  const guest = devGuestStore.useStore();
  const token = legacy.appToken;

  // 기존 my-info 패널의 updateMyInfo처럼 /user/me로 받는다. 토큰 복원(RESTORE_TOKEN)만으로는 이름·사진이 비어 있어서
  // 토큰이 생기거나 바뀔 때마다 부른다. 실패는 무시(기존과 같음)
  useEffect(() => {
    if (!token) return;
    myInfo(token)
      .then(({ data }) => authStore.dispatch({ type: 'MY_INFO', item: { name: data.name, email: data.email, imageUrl: data.imageUrl } }))
      .catch(() => {});
  }, [token]);

  return {
    name: legacy.name,
    email: legacy.email,
    imageUrl: legacy.imageUrl,
    via: legacy.appToken ? '기존 앱 토큰' : guest ? '개발용 둘러보기' : undefined,
  };
}
