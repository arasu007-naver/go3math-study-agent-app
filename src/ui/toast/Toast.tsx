import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeInUp,
  FadeOutUp,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { colors, layout, motion, radius, shadow, space, type, z } from '../theme';

/**
 * 앱 공용 토스트 카드(design-spec P3-2). 튜터 토스트 규칙(§4.6)을 그대로 지킨다:
 * 오른쪽 상단, durationMs(기본 6.4초) 뒤 onTimeout, 누르고 있는 동안(onPressIn~onPressOut) 타이머 정지 후 남은 시간부터 재개,
 * 탭하면 onPress. 카드만 터치를 받으므로 부모가 box-none이면 그 밖에서는 필기가 계속된다.
 * 진행 바는 남은 시간을 보여 준다. 동작 줄이기에서는 진행 바와 등장/퇴장 애니메이션 없이 같은 타이머로 닫힌다.
 */
export function Toast({
  title,
  text,
  accessibilityLabel,
  onPress,
  onTimeout,
  durationMs = motion.toastMs,
}: {
  title: string;
  text: string;
  accessibilityLabel?: string;
  onPress(): void;
  onTimeout(): void;
  durationMs?: number;
}) {
  const reduce = useReducedMotion();
  const remaining = useRef(durationMs);
  const startedAt = useRef(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const progress = useSharedValue(1);

  const run = () => {
    startedAt.current = Date.now();
    timer.current = setTimeout(onTimeout, remaining.current);
    progress.value = withTiming(0, { duration: remaining.current, easing: Easing.linear });
  };
  const pause = () => {
    clearTimeout(timer.current);
    remaining.current -= Date.now() - startedAt.current;
    cancelAnimation(progress);
  };

  useEffect(() => {
    run();
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const barStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <Animated.View
      entering={reduce ? undefined : FadeInUp.duration(motion.base)}
      exiting={reduce ? undefined : FadeOutUp.duration(motion.fast)}
      style={styles.toast}>
      {/* iOS는 overflow: hidden이 그림자를 자르므로 진행 바 자르기는 안쪽 View가 맡는다 */}
      <View style={styles.clip}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
          onPressIn={pause}
          onPressOut={run}
          style={styles.press}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{text}</Text>
        </Pressable>
        {!reduce && <Animated.View style={[styles.progress, barStyle]} />}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    top: layout.gutter,
    right: layout.gutter,
    width: layout.toastW,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    zIndex: z.toast,
    ...shadow.float,
  },
  clip: { borderRadius: radius.md, overflow: 'hidden' },
  press: { padding: space.md, gap: space.xs },
  title: { ...type.caption, color: colors.muted },
  body: { ...type.bodyStrong, color: colors.text },
  progress: { position: 'absolute', left: 0, bottom: 0, height: 3, backgroundColor: colors.accent },
});
