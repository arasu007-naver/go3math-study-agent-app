/**
 * 통일된 로딩 뷰: 가운데에 주황색 "Go3 Math" SVG가 커졌다 작아졌다(scale) 반복한다.
 * 기존 앱의 index(scale) · tablet · qoolla-logo-activity-indicator(좌우 흔들림) · fetching-animation을 이것 하나로 대체.
 */
import { useEffect } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useDeviceMode } from '../../../layout/deviceMode';

export const LOGO_COLOR = 'orange';
// 원본 패스 좌표(454×86)에 stroke 9의 절반만큼 여백을 둬서 가장자리가 잘리지 않게 한다.
const VIEWBOX = { x: -5, y: -5, w: 464, h: 96 };
const LOGO_PATH =
  'M 249.375 21.75 L 249.375 84.5 L 239.125 84.5 L 239.125 21.75 L 219.25 21.75 L 219.25 84.5 L 209.75 84.5 L 209.75 12.875 L 278.875 12.875 L 278.875 84.5 L 268.875 84.5 L 268.875 21.75 L 249.375 21.75 Z M 17.875 46 L 17.875 37.125 L 39.625 37.125 L 39.625 84.5 L 0 84.5 L 0 12.875 L 39.625 12.875 L 39.625 22.25 L 10 22.25 L 10 75.5 L 30.125 75.5 L 30.125 46 L 17.875 46 Z M 444 84.5 L 454 84.5 L 454 28.125 L 423.875 28.125 L 423.875 0 L 414.375 0 L 414.375 84.5 L 423.875 84.5 L 423.875 37.125 L 444 37.125 L 444 84.5 Z M 132.375 60 L 151.75 60 L 151.75 75.125 L 131.625 75.125 L 131.625 67.875 L 122.125 67.875 L 122.125 84.5 L 161.875 84.5 L 161.875 52.5 L 147.375 52.5 L 161.625 38 L 161.625 28.25 L 122.125 28.125 L 122.125 37.5 L 146.75 37.5 L 132.375 52.5 L 132.375 60 Z M 299.5 51.25 L 328.875 51.25 L 328.875 37.125 L 299.25 37.125 L 299.25 28.125 L 338.875 28.125 L 338.875 84.5 L 299.5 84.5 L 299.5 51.25 Z M 393.875 75.5 L 393.875 84.5 L 370.875 84.5 L 370.875 37.125 L 359.375 37.125 L 359.375 28.125 L 370.875 28.125 L 370.875 11.5 L 380.375 11.5 L 380.375 28.125 L 393.875 28.125 L 393.875 37.125 L 380.375 37.125 L 380.375 75.5 L 393.875 75.5 Z M 99.75 84.5 L 60.125 84.5 L 60.125 28.125 L 99.75 28.125 L 99.75 84.5 Z M 90.375 75.5 L 90.375 37.375 L 70.125 37.5 L 70.125 75.5 L 90.375 75.5 Z M 328.875 75.25 L 328.875 60.375 L 308.75 60.375 L 308.75 75.25 L 328.875 75.25 Z';

export function Go3MathLogo({ width, color = LOGO_COLOR }: { width: number; color?: string }) {
  return (
    <Svg width={width} height={(width * VIEWBOX.h) / VIEWBOX.w} viewBox={`${VIEWBOX.x} ${VIEWBOX.y} ${VIEWBOX.w} ${VIEWBOX.h}`} fill={color}>
      <Path d={LOGO_PATH} stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export type Go3MathLoaderProps = {
  /** 로고 폭(px). 기본: 폰 200, 태블릿 320 */
  width?: number;
  /** scale 최소·최대 */
  minScale?: number;
  maxScale?: number;
  /** 한 방향(작아짐 또는 커짐) 시간 ms */
  duration?: number;
  /** 바깥 컨테이너 스타일(기본: 부모를 채우고 가운데 정렬, 흰 바탕) */
  style?: StyleProp<ViewStyle>;
};

export default function Go3MathLoader({ width, minScale = 0.8, maxScale = 1.1, duration = 800, style }: Go3MathLoaderProps) {
  const isTablet = useDeviceMode() === 'tablet';
  const scale = useSharedValue(minScale);

  useEffect(() => {
    scale.value = minScale;
    scale.value = withRepeat(withTiming(maxScale, { duration, easing: Easing.inOut(Easing.quad) }), -1, true);
    return () => cancelAnimation(scale);
  }, [scale, minScale, maxScale, duration]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={[styles.root, style]} accessibilityRole="progressbar" accessibilityLabel="불러오는 중">
      <Animated.View style={animated}>
        <Go3MathLogo width={width ?? (isTablet ? 320 : 200)} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
});
