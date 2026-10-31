import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logout } from '@/src/auth/logout';
import { supabaseAuthStore } from '@/src/auth/supabase';
import { devGuestStore } from '@/src/auth/useAuthGate';
import { authStore } from '@/src/state/auth';
import { colors } from '@/src/ui/theme';

// 내 정보 관리(최소): 로그인 방식 확인과 로그아웃. 프로필 변경 등은 M10.
export default function ProfileScreen() {
  const sb = supabaseAuthStore.useStore();
  const legacy = authStore.useStore();
  const guest = devGuestStore.useStore();
  const user = sb.session?.user;
  const via = user ? `Supabase (${user.app_metadata?.provider ?? '?'})` : legacy.appToken ? '기존 앱 토큰' : guest ? '개발용 둘러보기' : '-';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ padding: 24, gap: 12 }}>
        {/* 태블릿은 탭 바가 없으므로 drawer의 "내 정보 관리"로 들어온 뒤 에이전트 화면으로 돌아갈 길이 필요하다 */}
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/')} style={{ minHeight: 44, alignSelf: 'flex-start', justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, color: colors.text }}>‹ 에이전트로 돌아가기</Text>
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>내 정보</Text>
        <Text style={{ fontSize: 14, color: colors.muted }}>로그인: {via}</Text>
        {!!user?.email && <Text style={{ fontSize: 14, color: colors.text }}>{user.email}</Text>}
        <Pressable
          accessibilityRole="button"
          onPress={() => void logout()}
          style={{ minHeight: 44, alignSelf: 'flex-start', paddingHorizontal: 16, borderRadius: 10, borderWidth: 1, borderColor: colors.border, justifyContent: 'center' }}>
          <Text style={{ fontSize: 15, color: colors.text }}>로그아웃</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
