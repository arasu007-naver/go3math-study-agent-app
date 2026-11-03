import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { colors, layout, radius, shadow, space, z } from '../../ui/theme';
import { NOT_READY_HINT, type DockKind, type FooterKind } from './DrawerFooter';

/** 툴바 항목(위→아래). 드래그 손잡이 다음, 맨 아래 채팅 버튼 앞에 놓인다. */
const RAIL_ITEMS: { kind: FooterKind; label: string; icon: keyof typeof Ionicons.glyphMap; disabled?: boolean }[] = [
  { kind: 'timeline', label: '타임라인', icon: 'home-outline' },
  { kind: 'notice', label: '공지', icon: 'megaphone-outline' },
  { kind: 'search', label: '검색', icon: 'search-outline' },
  { kind: 'liveClass', label: '실황 수업', icon: 'radio-outline', disabled: true },
  { kind: 'profile', label: '내 정보', icon: 'person-circle-outline' },
];

export const RAIL_W = layout.hit + space.sm;
const DIVIDER_H = 2;
// 드래그 손잡이 + 구분선(위아래 여백 포함) + 항목 + 채팅 버튼, 위아래 padding
const RAIL_H = layout.hit * (RAIL_ITEMS.length + 2) + DIVIDER_H + space.xs * 4;

/**
 * 늘 떠 있는 세로 pill 툴바. 위아래가 둥글고, 맨 위 손잡이를 끌어 화면 안 아무 곳으로나 옮길 수 있다.
 * 항목을 누르면 해당 dock을 열고(열린 항목을 다시 누르면 닫음), 맨 아래 채팅 버튼은 채팅 dock을 연다(읽지 않음 점 표시).
 */
export function ChatRail({
  active,
  unread,
  onItem,
}: {
  /** 지금 열린 dock(강조 표시) */
  active: DockKind | 'chat' | null;
  unread: boolean;
  onItem(kind: DockKind | 'chat'): void;
}) {
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

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));

  return (
    <Animated.View style={[styles.rail, style]}>
      <GestureDetector gesture={drag}>
        <View accessibilityRole="adjustable" accessibilityLabel="툴바 이동" accessibilityHint="끌어서 툴바를 옮깁니다" style={styles.item}>
          <Ionicons name="reorder-three" size={layout.footerIcon} color={colors.disabled} />
        </View>
      </GestureDetector>
      <View style={styles.divider} />
      {RAIL_ITEMS.map((it) => {
        const on = it.kind === active;
        return (
          <Pressable
            key={it.kind}
            disabled={it.disabled}
            onPress={() => onItem(it.kind as DockKind)}
            accessibilityRole="button"
            accessibilityLabel={it.label}
            accessibilityHint={it.disabled ? NOT_READY_HINT : undefined}
            accessibilityState={{ selected: on, disabled: !!it.disabled }}
            style={({ pressed }) => [styles.item, on && styles.on, pressed && styles.pressed]}>
            <Ionicons name={it.icon} size={layout.footerIcon} color={it.disabled ? colors.disabled : on ? colors.accentText : colors.muted} />
          </Pressable>
        );
      })}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unread ? '채팅 (읽지 않은 메시지 있음)' : '채팅'}
        accessibilityState={{ selected: active === 'chat' }}
        onPress={() => onItem('chat')}
        style={({ pressed }) => [styles.item, styles.chat, pressed && styles.chatPressed]}>
        <Ionicons name={active === 'chat' ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'} size={layout.footerIcon} color={colors.accentText} />
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
  // 드래그 손잡이와 항목 사이 주황 구분선
  divider: { width: layout.hit - space.md, height: DIVIDER_H, marginVertical: space.xs, borderRadius: radius.pill, backgroundColor: colors.accent },
  on: { backgroundColor: colors.accentSoft },
  pressed: { backgroundColor: colors.accentSoftPress },
  chat: { backgroundColor: colors.accentSoft },
  chatPressed: { backgroundColor: colors.accentSoftPress },
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
