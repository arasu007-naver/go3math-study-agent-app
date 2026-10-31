import { Tabs } from 'expo-router';
import { useDeviceMode } from '@/src/layout/deviceMode';
import { colors } from '@/src/ui/theme';

// 폰: 하단 탭. 태블릿: 탭 바 없이 Stage 전체 + drawer(§4.2).
export default function MainLayout() {
  const mode = useDeviceMode();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.text,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: mode === 'tablet' ? { display: 'none' } : undefined,
      }}>
      <Tabs.Screen name="index" options={{ title: '에이전트' }} />
      <Tabs.Screen name="records" options={{ title: '학습기록' }} />
      <Tabs.Screen name="calendar" options={{ title: '달력' }} />
      <Tabs.Screen name="profile" options={{ title: '내 정보' }} />
    </Tabs>
  );
}
