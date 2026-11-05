import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, usePathname } from 'expo-router';
import { RAIL_ITEMS } from '@/src/agent/tablet/ChatRail';
import { NOT_READY_HINT } from '@/src/agent/tablet/DrawerFooter';
import { getAgentSession } from '@/src/agent/useAgentSession';
import { useAuthGate } from '@/src/auth/useAuthGate';
import { useDeviceMode } from '@/src/layout/deviceMode';
import { isFullScreenRoute } from '@/src/layout/fullScreenRoutes';
import { colors, layout, radius, shadow, space } from '@/src/ui/theme';

// 태블릿: 탭 바 없이 에이전트 홈(index: Stage + ChatRail·dock).
// 폰: 태블릿 ChatRail 항목(History·공지·검색·실황 수업·내 정보) + 채팅이 하단 탭이고, 각 dock 내용이 탭 화면이다.
// 탭 화면 위에는 제목 헤더를 두지 않는다(탭 바 라벨이 제목 역할). 결과 child 화면만 뒤로 버튼 헤더를 둔다.
// 검색·타임라인·채팅 탭은 폴더 Stack이라 결과 화면이 child로 쌓인다. 로그인 전이면 로그인 화면으로.
const ROUTE: Record<(typeof RAIL_ITEMS)[number]['kind'], string> = {
  timeline: 'timeline',
  notice: 'notice',
  search: 'search',
  liveClass: 'live',
  profile: 'profile',
  weeklyStudy: 'live',
};
// 태블릿 dock을 열 때처럼 학습 흐름 메뉴는 에이전트에 알린다(menu_selected)
const MENU_EVENT: Record<string, 'search' | 'notice' | 'timeline' | undefined> = { timeline: 'timeline', notice: 'notice', search: 'search' };

// 폰에서 타임라인 탭 이름(태블릿 ChatRail 라벨은 그대로)
const PHONE_TITLE: Partial<Record<(typeof RAIL_ITEMS)[number]['kind'], string>> = { timeline: 'History' };

// 폰 탭 바: 태블릿 ChatRail처럼 좌우 끝이 둥근 떠 있는 바 + 그림자. 화면 가장자리·아래 광고 자리와 조금 띄운다.
// 바는 화면 위에 떠 있고(absolute) 둘레는 투명해서, 탭 내용이 바 양옆·아래로 비친다
const PHONE_TAB_H = layout.footerH;
const PHONE_TAB_BAR = {
  position: 'absolute' as const,
  // 탭 바 기본 스타일의 start/end: 0이 left/right보다 우선하므로 start/end로 띄운다
  start: layout.gutter,
  end: layout.gutter,
  bottom: space.sm,
  height: PHONE_TAB_H,
  paddingTop: 0,
  paddingBottom: 0,
  borderRadius: radius.pill,
  borderTopWidth: 0,
  backgroundColor: colors.card,
  ...shadow.float,
};

export default function MainLayout() {
  const mode = useDeviceMode();
  const gate = useAuthGate();
  const pathname = usePathname();
  if (gate === 'loading') return null;
  if (gate === 'signedOut') return <Redirect href="/welcome" />;
  const phone = mode === 'phone';
  const icon = (name: keyof typeof Ionicons.glyphMap, disabled?: boolean) =>
    function TabIcon({ color }: { color: string }) {
      return <Ionicons name={name} size={layout.footerIcon} color={disabled ? colors.disabled : color} />;
    };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.muted,
        // 결과 child 화면(문제 목록 등)은 폰 화면 전체를 쓰므로 탭 바를 숨긴다
        tabBarStyle: phone && !isFullScreenRoute(pathname) ? PHONE_TAB_BAR : { display: 'none' },
        headerShown: false,
      }}>
      {/* 태블릿 홈. 폰에서는 탭에 두지 않고 index가 타임라인 탭으로 보낸다 */}
      <Tabs.Screen name="index" options={{ href: phone ? null : undefined }} />
      {RAIL_ITEMS.map((it) => (
        <Tabs.Screen
          key={it.kind}
          name={ROUTE[it.kind]}
          options={{
            title: PHONE_TITLE[it.kind] ?? it.label,
            href: phone ? undefined : null,
            tabBarIcon: icon(it.icon, it.disabled),
            tabBarAccessibilityLabel: it.disabled ? `${it.label}, ${NOT_READY_HINT}` : (PHONE_TITLE[it.kind] ?? it.label),
            ...(it.disabled ? { tabBarLabelStyle: { color: colors.disabled } } : {}),
          }}
          listeners={{
            tabPress: (e) => {
              if (it.disabled) return e.preventDefault();
              const menu = MENU_EVENT[ROUTE[it.kind]];
              if (menu) getAgentSession().emit('menu_selected', { menu });
            },
          }}
        />
      ))}
      <Tabs.Screen
        name="chat"
        options={{ title: '채팅', href: phone ? undefined : null, tabBarIcon: icon('chatbubble-ellipses-outline') }}
      />
    </Tabs>
  );
}
