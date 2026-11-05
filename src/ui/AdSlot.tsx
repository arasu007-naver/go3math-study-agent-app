import type { ReactNode } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import mobileAds, { BannerAd, BannerAdSize, MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';
import { SafeAreaProvider, useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from './theme';

// 화면 하단 Google 광고(AdMob 배너). 전체 화면(풀이 캔버스·폰 결과 화면, layout/fullScreenRoutes)을 뺀 모든 화면에서 루트 레이아웃이 Stack 아래에 둔다(AdSlotFrame).
// 기존 앱 `components/banner`(Go3MathBanner)와 같은 광고 단위·크기(FULL_BANNER 468×60)·비개인화 요청. 개발 빌드는 테스트 광고.
const AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.OS === 'ios'
    ? 'ca-app-pub-2632164502661597/5715479965'
    : 'ca-app-pub-2632164502661597/3670603264';

/** BannerAdSize.FULL_BANNER(468×60)의 높이 */
export const AD_BANNER_H = 60;

/** 앱 시작 시 1회 — 기존 App.tsx configureAdMob + initialize(어린이 대상 앱: PG 등급, 동의 연령 미만 태그) */
export async function initMobileAds() {
  await mobileAds().setRequestConfiguration({
    maxAdContentRating: MaxAdContentRating.PG,
    tagForUnderAgeOfConsent: true,
    testDeviceIdentifiers: ['EMULATOR'],
  });
  return mobileAds().initialize();
}

/**
 * 화면(children) 아래에 광고 자리를 둔다. 홈 인디케이터 여백은 광고 자리가 맡는다.
 * 화면 영역을 SafeAreaProvider로 한 번 더 감싸 그 영역 기준 inset(아래 0)을 쓰게 한다 —
 * 네이티브 SafeAreaView도 가장 가까운 provider의 inset을 쓰므로 화면·탭 바가 여백을 한 번 더 두지 않는다.
 */
export function AdSlotFrame({ show, children }: { show: boolean; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const frame = useSafeAreaFrame();
  // show가 바뀌어도 children(Stack)이 다시 마운트되지 않게 트리 모양은 그대로 두고 inset과 광고 자리만 바꾼다
  return (
    <>
      {/* initialMetrics는 네이티브 값이 오기 전 첫 렌더가 비지 않게 하는 추정치 */}
      <SafeAreaProvider style={styles.screen} initialMetrics={{ frame, insets: show ? { ...insets, bottom: 0 } : insets }}>
        {children}
      </SafeAreaProvider>
      {show && (
        <View style={[styles.slot, { height: AD_BANNER_H + insets.bottom, paddingBottom: insets.bottom }]}>
          <BannerAd unitId={AD_UNIT_ID} size={BannerAdSize.FULL_BANNER} requestOptions={{ requestNonPersonalizedAdsOnly: true }} />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  // 기존 배너처럼 흰 바탕 가운데 정렬. 광고가 아직 안 왔거나 못 받아도 자리는 그대로 둔다
  slot: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
});
