import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { colors, motion, radius, space, type, z } from '../../ui/theme';

export const LANDSCAPE_NOTICE = '가로 화면에서는 일부 기능을 사용할 수 없어요. 세로로 돌리면 모두 사용할 수 있어요.';

/**
 * 캔버스 상단 가운데 안내 배너(design-spec P2-5). active(가로 + 제한 목록 있음)가 켜질 때와 ping이 바뀔 때(제한 버튼 탭)
 * motion.toastMs 동안 보인다. 터치를 받지 않으므로 필기를 막지 않는다.
 */
export function LandscapeNotice({ active, ping }: { active: boolean; ping: number }) {
  const reduce = useReducedMotion();
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!active) return setShown(false);
    setShown(true);
    const t = setTimeout(() => setShown(false), motion.toastMs);
    return () => clearTimeout(t);
  }, [active, ping]);

  if (!shown) return null;
  return (
    <View pointerEvents="none" style={styles.wrap}>
      <Animated.View
        entering={reduce ? undefined : FadeIn.duration(motion.base)}
        exiting={reduce ? undefined : FadeOut.duration(motion.fast)}
        accessibilityLiveRegion="polite"
        style={styles.banner}>
        <Ionicons name="phone-portrait-outline" size={16} color={colors.subtle} />
        <Text style={styles.text}>{LANDSCAPE_NOTICE}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: space.md, left: 0, right: 0, alignItems: 'center', zIndex: z.toolbar },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    maxWidth: '90%',
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.pill,
  },
  text: { ...type.caption, color: colors.subtle, flexShrink: 1 },
});
