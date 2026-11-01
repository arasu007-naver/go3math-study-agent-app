import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { colors, layout, motion, radius, shadow, space, type, z } from '../ui/theme';

// 태블릿 drawer 오른쪽에 gutter만큼 띄워 붙는 dock 카드(design-spec P1-4). 제목·닫기 버튼과 위치·크기를 맡고, 내용은 children.
// drawer의 자식이 아니라 형제로 둔다(Android는 부모 밖 자식에 터치가 가지 않음). 위아래는 drawer와 같은 gutter로 맞춘다.
// drawer 뒤 dockDelay만큼 늦게 페이드인한다.
export function DockWrapper({
  title,
  left,
  onClose,
  children,
}: {
  title: string;
  /** dock 왼쪽 끝 = gutter + drawer 폭 + gutter */
  left: number;
  onClose(): void;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const { width } = useWindowDimensions();
  const dockWidth = Math.min(layout.dockMax, width - left - layout.gutter);

  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.delay(motion.dockDelay).duration(motion.base)}
      exiting={reduce ? undefined : FadeOut.duration(motion.fast)}
      accessibilityLabel={`${title} dock`}
      style={[styles.dock, { left, width: dockWidth }]}>
      {/* iOS는 overflow: hidden이 그림자를 자르므로 둥근 모서리 자르기는 안쪽 View가 맡는다 */}
      <View style={styles.clip}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${title} dock 닫기`}
            onPress={onClose}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
            <Ionicons name="close" size={20} color={colors.muted} />
          </Pressable>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    top: layout.gutter,
    bottom: layout.gutter,
    maxWidth: layout.dockMax,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    zIndex: z.dock,
    ...shadow.float,
  },
  clip: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  header: { height: layout.headerH, flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, paddingRight: space.xs, gap: space.sm },
  title: { ...type.title, color: colors.text, flex: 1 },
  iconBtn: { width: layout.hit, height: layout.hit, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.cardMuted },
  content: { flex: 1 },
});
