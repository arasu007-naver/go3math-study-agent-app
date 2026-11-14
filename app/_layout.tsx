import { useEffect } from 'react';
import { ApolloProvider } from '@apollo/client/react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GlobalLoadingOverlay from '@/src/kit/ui/loading-view/global-overlay';
import { CANVAS_ROUTES, isFullScreenRoute } from '@/src/layout/fullScreenRoutes';
import { apolloClient, bootstrap } from '@/src/state/bootstrap';
import { AdSlotFrame, initMobileAds } from '@/src/ui/AdSlot';
import { TabletLaunchOverlay } from '@/src/ui/TabletLaunchOverlay';

bootstrap();

export default function RootLayout() {
  const pathname = usePathname();
  const showAd = !isFullScreenRoute(pathname);
  // Pretendard 400/600/700(SIL OFL, assets/fonts/OFL.txt). 키는 src/ui/theme.ts fontFamily 값과 같아야 한다.
  // 로드에 실패해도 무한 대기하지 않고 시스템 폰트로 계속한다(미등록 family는 시스템 폰트로 폴백).
  const [fontsLoaded, fontError] = useFonts({
    'Pretendard-Regular': require('../assets/fonts/Pretendard-Regular.otf'),
    'Pretendard-SemiBold': require('../assets/fonts/Pretendard-SemiBold.otf'),
    'Pretendard-Bold': require('../assets/fonts/Pretendard-Bold.otf'),
  });
  useEffect(() => {
    initMobileAds().catch((e) => console.warn('[ads] AdMob init failed:', e));
  }, []);
  useEffect(() => {
    if (fontError) console.warn('[fonts] Pretendard load failed, using system font:', fontError.message);
  }, [fontError]);
  if (!fontsLoaded && !fontError) return null;

  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        {/* 풀이 화면 하단 버튼이 bottom-sheet 모달을 쓴다(note-canvas 팝업은 RN Modal 기반 src/ui/Sheet) */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <BottomSheetModalProvider>
            {/* 전체 화면(캔버스·폰 결과 화면)이 아니면 화면 아래에 광고 자리를 둔다. 화면은 그 위 영역만 쓴다 */}
            <AdSlotFrame show={showAd}>
              <Stack screenOptions={{ headerShown: false }}>
                {/* 캔버스 화면은 세로 고정. 전역 고정은 없으므로(app.config.ts) 나가면 방향 고정이 풀린다 */}
                {CANVAS_ROUTES.map((name) => (
                  <Stack.Screen key={name} name={name} options={{ orientation: 'portrait' }} />
                ))}
              </Stack>
            </AdSlotFrame>
            <GlobalLoadingOverlay />
            <StatusBar style="dark" />
            <TabletLaunchOverlay />
          </BottomSheetModalProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ApolloProvider>
  );
}
