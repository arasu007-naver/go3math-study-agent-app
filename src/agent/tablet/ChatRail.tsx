import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, layout, motion, radius, shadow, space, z } from '../../ui/theme';
import { NOT_READY_HINT, type DockKind, type FooterKind } from './DrawerFooter';

/** 접힌 툴바 항목(위→아래). 드래그 손잡이 다음, 맨 아래 '열기' 버튼 앞에 놓인다. */
const RAIL_ITEMS: { kind: FooterKind; label: string; icon: keyof typeof Ionicons.glyphMap; disabled?: boolean }[] = [
  { kind: 'notice', label: '공지', icon: 'megaphone-outline' },
  { kind: 'search', label: '검색', icon: 'search-outline' },
  { kind: 'timeline', label: '타임라인', icon: 'time-outline' },
  { kind: 'liveClass', label: '실황 수업', icon: 'radio-outline', disabled: true },
  { kind: 'profile', label: '내 정보', icon: 'person-circle-outline' },
];

const RAIL_W = layout.hit + space.sm;
// 드래그 손잡이 + 항목 + 열기 버튼, 위아래 padding
const RAIL_H = layout.hit * (RAIL_ITEMS.length + 2) + space.xs * 2;

/**
 * drawer를 접었을 때 떠 있는 세로 pill 툴바. 위아래가 둥글고, 맨 위 손잡이를 끌어 화면 안 아무 곳으로나 옮길 수 있다.
 * 항상 마운트해 두고(drawer가 열리면 숨김) 사용자가 옮긴 위치를 drawer를 다시 접어도 유지한다.
 * 항목을 누르면 drawer를 열고 해당 dock을, 맨 아래 열기 버튼은 drawer만 연다(읽지 않음 점 표시).
 */
export function ChatRail({
  visible,
  unread,
  onOpen,
  onItem,
}: {
  visible: boolean;
  unread: boolean;
  onOpen(): void;
  onItem(kind: DockKind): void;
}) {
  const reduce = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const maxX = Math.max(layout.gutter, width - RAIL_W - layout.gutter);
  const maxY = Math.max(layout.gutter, height - RAIL_H - layout.gutter);

  // 처음 위치: 왼쪽 변, 세로 가운데(기존 가장자리 탭 자리)
  const x = useSharedValue<number>(layout.gutter);
  const y = useSharedValue(Math.max(layout.gutter, (height - RAIL_H) / 2));
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  // 회전·폴더블 전환으로 화면이 줄면 화면 안으로 다시 넣는다
  useEffect(() => {
    x.value = Math.min(Math.max(x.value, layout.gutter), maxX);
    y.value = Math.min(Math.max(y.value, layout.gutter), maxY);
  }, [maxX, maxY, x, y]);

  const drag = Gesture.Pan()
    .onStart(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((e) => {
      x.value = Math.min(Math.max(startX.value + e.translationX, layout.gutter), maxX);
      y.value = Math.min(Math.max(startY.value + e.translationY, layout.gutter), maxY);
    });

  const shown = useSharedValue(visible ? 1 : 0);
  useEffect(() => {
    shown.value = reduce ? (visible ? 1 : 0) : withTiming(visible ? 1 : 0, { duration: visible ? motion.base : motion.fast });
  }, [visible, reduce, shown]);

  const style = useAnimatedStyle(() => ({ opacity: shown.value, transform: [{ translateX: x.value }, { translateY: y.value }] }));

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? 'auto' : 'no-hide-descendants'}
      style={[styles.rail, style]}>
      <GestureDetector gesture={drag}>
        <View accessibilityRole="adjustable" accessibilityLabel="툴바 이동" accessibilityHint="끌어서 툴바를 옮깁니다" style={styles.item}>
          <Ionicons name="reorder-three" size={layout.footerIcon} color={colors.disabled} />
        </View>
      </GestureDetector>
      {RAIL_ITEMS.map((it) => (
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
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unread ? '에이전트 drawer 열기 (읽지 않은 메시지 있음)' : '에이전트 drawer 열기'}
        onPress={onOpen}
        style={({ pressed }) => [styles.item, styles.open, pressed && styles.openPressed]}>
        <Ionicons name="chevron-forward" size={layout.footerIcon} color={colors.accentText} />
        {unread && <View style={styles.dot} />}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: RAIL_W,
    height: RAIL_H,
    paddingVertical: space.xs,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    zIndex: z.drawer,
    ...shadow.float,
  },
  item: { width: layout.hit, height: layout.hit, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.accentSoftPress },
  open: { backgroundColor: colors.accentSoft },
  openPressed: { backgroundColor: colors.accentSoftPress },
  dot: {
    position: 'absolute',
    top: space.xxs,
    right: space.xxs,
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.unread,
    borderWidth: 2,
    borderColor: colors.card,
  },
});
