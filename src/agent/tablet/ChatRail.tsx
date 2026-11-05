import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
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
export const RAIL_H = layout.hit * (RAIL_ITEMS.length + 2) + DIVIDER_H + space.xs * 4;

// 세로 툴바가 영역 위·아래 변에 이만큼 가까워지면 가로로 바꾼다
export const NEAR_TOP = 32;
export const NEAR_BOTTOM = 24;

/**
 * 끄는 중 다음 방향. top은 툴바 top, height는 툴바가 움직이는 영역 높이(아래 변 = 광고 자리 top, 없으면 앱 아래 변).
 * 세로 → 가로: 툴바 top과 영역 위 변 거리가 NEAR_TOP 이하, 또는 툴바 bottom과 아래 변 거리가 NEAR_BOTTOM 이하.
 * 가로 → 세로: 위 변과의 거리, 아래 변과의 거리가 둘 다 가로 툴바 폭(RAIL_H)보다 커질 때. 바꾸는 기준이 서로 달라 경계에서 깜빡이지 않는다.
 */
export function nextHorizontal(horizontal: boolean, top: number, height: number) {
  'worklet';
  if (!horizontal) return top <= NEAR_TOP || height - (top + RAIL_H) <= NEAR_BOTTOM;
  return !(top > RAIL_H && height - (top + RAIL_W) > RAIL_H);
}

/**
 * 늘 떠 있는 pill 툴바. 맨 앞 손잡이를 끌어 화면 안 아무 곳으로나 옮길 수 있고,
 * 끄는 중 위 변(앱 상단)이나 아래 변(광고 자리 상단) 가까이 가면 가로로, 다시 멀어지면 세로로 바뀐다(nextHorizontal).
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
  const { width, height: windowH } = useWindowDimensions();
  // 툴바가 움직이는 영역 높이(광고 자리가 있으면 그 위까지). 재기 전에는 화면 높이
  const [height, setHeight] = useState(windowH);
  const [horizontal, setHorizontal] = useState(false);
  const horiz = useSharedValue(false);
  // 방향별 이동 범위(가로면 폭·높이가 서로 바뀐다)
  const maxX = Math.max(layout.gutter, width - (horizontal ? RAIL_H : RAIL_W) - layout.gutter);
  const maxY = Math.max(layout.gutter, height - (horizontal ? RAIL_W : RAIL_H) - layout.gutter);

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
      // 방향은 범위로 자르기 전 top으로 정한다(범위 끝에 붙은 채로도 계속 끌면 방향이 바뀌게)
      let top = startY.value + e.translationY;
      const h = nextHorizontal(horiz.value, top, height);
      if (h !== horiz.value) {
        // 아래 변 쪽에서 바뀌면 툴바 bottom을 그대로 둔다(세로↔가로 높이 차만큼 top을 옮김). 위 변 쪽은 top이 그대로
        if (top > height / 2) {
          const shift = h ? RAIL_H - RAIL_W : RAIL_W - RAIL_H;
          startY.value += shift;
          top += shift;
        }
        horiz.value = h;
        runOnJS(setHorizontal)(h);
      }
      const mx = Math.max(layout.gutter, width - (h ? RAIL_H : RAIL_W) - layout.gutter);
      const my = Math.max(layout.gutter, height - (h ? RAIL_W : RAIL_H) - layout.gutter);
      x.value = Math.min(Math.max(startX.value + e.translationX, layout.gutter), mx);
      y.value = Math.min(Math.max(top, layout.gutter), my);
    });

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: y.value }] }));

  return (
    // 영역을 재는 바깥 View. box-none이라 툴바 밖 터치는 아래로 통과한다
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={(e) => setHeight(e.nativeEvent.layout.height)}>
      <Animated.View style={[styles.rail, horizontal && styles.railH, style]}>
        <GestureDetector gesture={drag}>
          <View accessibilityRole="adjustable" accessibilityLabel="툴바 이동" accessibilityHint="끌어서 툴바를 옮깁니다" style={styles.item}>
            <Ionicons name="reorder-three" size={layout.footerIcon} color={colors.disabled} />
          </View>
        </GestureDetector>
        <View style={[styles.divider, horizontal && styles.dividerH]} />
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
    </View>
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
  railH: { flexDirection: 'row', width: RAIL_H, height: RAIL_W, paddingVertical: 0, paddingHorizontal: space.xs },
  item: { width: layout.hit, height: layout.hit, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  // 드래그 손잡이와 항목 사이 주황 구분선
  divider: { width: layout.hit - space.md, height: DIVIDER_H, marginVertical: space.xs, borderRadius: radius.pill, backgroundColor: colors.accent },
  dividerH: { width: DIVIDER_H, height: layout.hit - space.md, marginVertical: 0, marginHorizontal: space.xs },
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
