import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { colors, layout, motion, radius, shadow, space, z } from '../../ui/theme';
import { FOOTER_ITEMS, NOT_READY_HINT, type DockKind } from './DrawerFooter';

/**
 * drawer를 접었을 때 왼쪽에 남는 64px 레일(design-spec P1-4). 기존 가장자리 '>' 탭이 보이던 조건(drawer 닫힘)에서만 보인다.
 * 위: 에이전트 아바타(탭 → drawer 열기, 읽지 않음 점). 아래: 하단 바와 같은 6개 아이콘(탭 → drawer 열고 해당 항목 실행).
 */
export function ChatRail({ unread, onOpen, onItem }: { unread: boolean; onOpen(): void; onItem(kind: DockKind): void }) {
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeIn.duration(motion.base)}
      exiting={reduce ? undefined : FadeOut.duration(motion.fast)}
      style={styles.rail}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unread ? '에이전트 drawer 열기 (읽지 않은 메시지 있음)' : '에이전트 drawer 열기'}
        onPress={onOpen}
        style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
        <Ionicons name="sparkles" size={20} color={colors.accentText} />
        {unread && <View style={styles.dot} />}
      </Pressable>
      <View style={styles.spacer} />
      {FOOTER_ITEMS.map((it) => (
        <Pressable
          key={it.kind}
          disabled={it.disabled}
          onPress={() => onItem(it.kind as DockKind)}
          accessibilityRole="button"
          accessibilityLabel={it.label}
          accessibilityHint={it.disabled ? NOT_READY_HINT : undefined}
          accessibilityState={{ disabled: !!it.disabled }}
          style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
          <Ionicons name={it.icon} size={layout.footerIcon} color={it.disabled ? colors.disabled : colors.muted} />
        </Pressable>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    left: layout.gutter,
    top: layout.gutter,
    bottom: layout.gutter,
    width: layout.chatRail,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    alignItems: 'center',
    paddingVertical: space.md,
    gap: space.xs,
    zIndex: z.drawer,
    ...shadow.float,
  },
  avatar: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  dot: {
    position: 'absolute',
    top: -space.xxs,
    right: -space.xxs,
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.unread,
    borderWidth: 2,
    borderColor: colors.card,
  },
  spacer: { flex: 1 },
  item: { width: layout.hit, height: layout.hit, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.accentSoftPress },
});
