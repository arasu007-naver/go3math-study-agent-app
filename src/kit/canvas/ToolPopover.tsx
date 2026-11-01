import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { colors, layout, motion, radius, shadow, space, z } from '../../ui/theme';

// FloatingToolbar 바로 위(space.sm)에 뜨는 펜 속성 카드(design-spec P2-1). 캔버스 컨테이너 안의 오버레이라 툴바와 같은 좌표계를 쓴다.
// 카드 바깥(투명 배경)을 누르면 onDismiss — 기존 paper Modal의 바깥 탭 닫기와 같다.
export function ToolPopover({
  visible,
  onDismiss,
  bottom = 0,
  style,
  children,
}: {
  visible: boolean;
  onDismiss(): void;
  /** 툴바 insets.bottom과 같은 값 */
  bottom?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  if (!visible) return null;
  return (
    <View style={styles.root} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} accessibilityLabel="펜 설정 닫기" />
      <Animated.View
        entering={reduce ? undefined : FadeIn.duration(motion.fast)}
        exiting={reduce ? undefined : FadeOut.duration(motion.fast)}
        style={[styles.card, { bottom: bottom + layout.toolbarGap + space.md + layout.toolbarH + space.sm }, style]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: z.modal, alignItems: 'center' },
  card: {
    position: 'absolute',
    maxWidth: '90%',
    padding: space.md,
    gap: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...shadow.float,
  },
});
