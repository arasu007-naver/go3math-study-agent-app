import { useEffect, useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { initialMode } from '../layout/deviceMode';

const logo = require('../../assets/images/splash-icon.png'); // 400×342

// Android 태블릿 launch screen 로고(폰 100dp의 3배 = 300dp).
// Android 12+ 시스템 스플래시는 로고를 지름 192dp 원으로 잘라 보이므로 300dp를 그릴 수 없다.
// 그래서 태블릿의 시스템 스플래시는 흰 바탕만 두고(plugins/withTabletSplash.js), 첫 화면이 그려지면
// 같은 흰 바탕 위에 이 오버레이가 큰 로고를 잠깐 보여 준 뒤 사라진다.
const LOGO_WIDTH = 300;
const HOLD_MS = 1000;
const FADE_MS = 300;

export function TabletLaunchOverlay() {
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(() => Platform.OS === 'android' && initialMode(width, height) === 'tablet');
  const opacity = useSharedValue(1);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    if (!visible) return;
    opacity.value = withDelay(HOLD_MS, withTiming(0, { duration: FADE_MS }, (done) => done && runOnJS(setVisible)(false)));
  }, [visible, opacity]);

  if (!visible) return null;
  return (
    <Animated.View pointerEvents="none" style={[styles.root, fade]}>
      <Animated.Image source={logo} resizeMode="contain" style={styles.logo} accessibilityLabel="Go3Math" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' },
  logo: { width: LOGO_WIDTH, height: (LOGO_WIDTH * 342) / 400 },
});
