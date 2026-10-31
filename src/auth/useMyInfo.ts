import type { MyInfo } from '../kit/profile/MyInfoPanel';
import { authStore } from '../state/auth';
import { supabaseAuthStore } from './supabase';
import { devGuestStore } from './useAuthGate';

/** 내 정보 패널용: Supabase 세션(소셜 프로필) 우선, 없으면 레거시 app-token 사용자 정보(MY_INFO) */
export function useMyInfo(): MyInfo {
  const sb = supabaseAuthStore.useStore();
  const legacy = authStore.useStore();
  const guest = devGuestStore.useStore();
  const user = sb.session?.user;
  const meta = (user?.user_metadata ?? {}) as Record<string, string | undefined>;
  if (user) {
    return {
      name: meta.full_name ?? meta.name ?? meta.nickname ?? null,
      email: user.email ?? meta.email ?? null,
      imageUrl: meta.avatar_url ?? meta.picture ?? null,
      via: `Supabase (${user.app_metadata?.provider ?? '?'})`,
    };
  }
  return {
    name: legacy.name,
    email: legacy.email,
    imageUrl: legacy.imageUrl,
    via: legacy.appToken ? '기존 앱 토큰' : guest ? '개발용 둘러보기' : undefined,
  };
}
