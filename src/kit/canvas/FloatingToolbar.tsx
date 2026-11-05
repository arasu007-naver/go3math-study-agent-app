import type { ComponentProps, ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown, useReducedMotion } from 'react-native-reanimated';
import { PlaybackControls } from '../script-player/PlaybackToolbar';
import { colors, fontFamily, layout, motion, radius, shadow, space, z } from '../../ui/theme';

// 캔버스 하단 가운데에 떠 있는 pill 툴바(design-spec P2-1). 펜 속성 버튼·보드 지우기·저장 등 캔버스에 원래 있던 도구만 노출하고,
// 각 버튼은 기존 GoButton이 부르던 함수를 그대로 부른다. 재생 모드는 PlaybackToolbar의 버튼(PlaybackControls)을 담는다.
export type ToolId = 'color' | 'clearBoard' | 'clearMemo' | 'save';

export type FloatingTool = { id: ToolId; icon?: ReactNode; label: string; disabled?: boolean };
/** 캔버스 화면(라우트)이 넘기는 화면 버튼(나가기·목록 등). 그리기 도구 앞에 놓이고 구분선으로 나뉜다. */
export type FloatingAction = { id: string; icon: ReactNode; label: string; onPress(): void; hideLabel?: boolean };

export type FloatingToolbarProps = {
  mode: 'draw' | 'playback';
  actions?: FloatingAction[];
  tools?: FloatingTool[];
  activeTool?: ToolId;
  onSelectTool?: (id: ToolId) => void;
  /** 잉크 색(데이터 값 그대로, 'orange' 포함) — color 버튼의 견본 */
  strokeColor?: string;
  playback?: ComponentProps<typeof PlaybackControls>;
  /** 툴바가 피해야 할 영역: drawer/레일 폭, 하단 탭·홈 인디케이터 등 */
  insets?: { left: number; right: number; bottom: number };
  /** 가로 모드 제한(P2-5) — 숨기지 않고 비활성으로 보인다 */
  restricted?: ReadonlySet<string>;
  /** 제한된 버튼을 눌렀을 때(안내 배너 다시 보이기) */
  onRestrictedPress?: () => void;
};

const NO_INSETS = { left: 0, right: 0, bottom: 0 };

export function FloatingToolbar({
  mode,
  actions = [],
  tools = [],
  activeTool,
  onSelectTool,
  strokeColor,
  playback,
  insets = NO_INSETS,
  restricted,
  onRestrictedPress,
}: FloatingToolbarProps) {
  const reduce = useReducedMotion();
  return (
    <Animated.View
      entering={reduce ? undefined : FadeInDown.duration(motion.base)}
      exiting={reduce ? undefined : FadeOutDown.duration(motion.fast)}
      pointerEvents="box-none"
      style={[styles.wrap, { left: insets.left, right: insets.right, bottom: insets.bottom }]}>
      {/* 보이는 캔버스가 툴바보다 좁으면 가로 스크롤로 잘리지 않게 한다 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.bar}>
          {actions.map((a) => {
            const hasLabel = !a.hideLabel && a.id !== 'exit' && Boolean(a.label);
            return (
              <Pressable
                key={a.id}
                onPress={a.onPress}
                accessibilityRole="button"
                accessibilityLabel={a.label}
                style={({ pressed }) => [
                  styles.btn,
                  hasLabel ? styles.btnWithLabel : styles.btnIconOnly,
                  pressed && styles.btnPressed,
                ]}>
                <View style={styles.iconSlot}>{a.icon}</View>
                {hasLabel && (
                  <Text style={styles.btnLabel} numberOfLines={1}>
                    {a.label}
                  </Text>
                )}
              </Pressable>
            );
          })}
          {actions.length > 0 && <View style={styles.divider} />}
          {mode === 'draw'
            ? tools.map((t) => {
                const blocked = restricted?.has(t.id) ?? false;
                const on = activeTool === t.id;
                return (
                  <Pressable
                    key={t.id}
                    onPress={() => (blocked ? onRestrictedPress?.() : onSelectTool?.(t.id))}
                    disabled={t.disabled}
                    accessibilityRole="button"
                    accessibilityLabel={t.label}
                    accessibilityHint={blocked ? '가로 화면에서는 사용할 수 없습니다' : undefined}
                    accessibilityState={{ selected: on, disabled: t.disabled || blocked }}
                    style={({ pressed }) => [
                      styles.btn,
                      styles.btnWithLabel,
                      on && styles.btnOn,
                      pressed && styles.btnPressed,
                      (t.disabled || blocked) && styles.btnOff,
                    ]}>
                    <View style={styles.iconSlot}>
                      {t.id === 'color' ? <View style={[styles.swatch, { backgroundColor: strokeColor }]} /> : t.icon}
                    </View>
                    <Text style={[styles.btnLabel, on && styles.btnLabelOn]} numberOfLines={1}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })
            : playback && <PlaybackControls {...playback} />}
        </View>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', alignItems: 'center', zIndex: z.toolbar },
  // overflow visible: iOS에서 bar 그림자가 ScrollView 경계에 잘리지 않게(Android elevation은 padding 안에 들어간다)
  scroll: { flexGrow: 0, maxWidth: '100%', overflow: 'visible' },
  // 위아래 여백 0: 툴바 높이 = 버튼 높이, 캔버스 맨 아래에 붙인다(2026-11-02 요청). 그림자는 scroll의 overflow visible로 그린다
  scrollContent: { paddingHorizontal: space.sm, paddingVertical: 0 },
  bar: {
    height: layout.toolbarH,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.sm,
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    ...shadow.float,
  },
  btn: {
    height: layout.toolbarH - 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnIconOnly: {
    width: layout.hit,
    paddingHorizontal: 0,
  },
  btnWithLabel: {
    minWidth: layout.hit,
    paddingHorizontal: space.xs,
    paddingVertical: 2,
    gap: 1,
  },
  iconSlot: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: fontFamily.semibold,
    fontWeight: '600',
    color: colors.subtle,
    textAlign: 'center',
  },
  btnLabelOn: {
    color: colors.accentText,
  },
  btnOn: { backgroundColor: colors.accentSoft },
  btnPressed: { backgroundColor: colors.accentSoftPress },
  btnOff: { opacity: 0.38 },
  divider: { width: StyleSheet.hairlineWidth * 2, height: 24, backgroundColor: colors.line, marginHorizontal: space.xs },
  swatch: { width: 20, height: 20, borderRadius: radius.pill, borderWidth: 2, borderColor: colors.card, ...shadow.card },
});
