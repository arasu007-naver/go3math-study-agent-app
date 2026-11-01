import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, layout, motion, radius, shadow, space, type } from '../../ui/theme';

/** dock 패널 종류(기존 값). 하단 바의 실황 수업·주간 공부는 재사용할 카드가 아직 없어 비활성 칸으로만 둔다(사용자 결정 2026-11-02). */
export type DockKind = 'timeline' | 'search' | 'notice' | 'profile';
export type FooterKind = DockKind | 'liveClass' | 'weeklyStudy';

export const FOOTER_ITEMS: { kind: FooterKind; label: string; short: string; icon: keyof typeof Ionicons.glyphMap; disabled?: boolean }[] = [
  { kind: 'notice', label: '공지', short: '공지', icon: 'megaphone-outline' },
  { kind: 'search', label: '검색', short: '검색', icon: 'search-outline' },
  { kind: 'timeline', label: '타임라인', short: '타임라인', icon: 'time-outline' },
  { kind: 'liveClass', label: '실황 수업', short: '실황', icon: 'radio-outline', disabled: true },
  { kind: 'weeklyStudy', label: '주간 공부', short: '주간', icon: 'calendar-outline', disabled: true },
  { kind: 'profile', label: '내 정보', short: '내 정보', icon: 'person-circle-outline' },
];
export const NOT_READY_HINT = '준비 중입니다';
const FULL_LABEL_MIN_SEG = 56;

/**
 * drawer 하단 고정 바(design-spec P1-6): 6칸 한 줄 세그먼트. 대화 영역(ScrollView) 밖에 있어 스크롤해도 위치가 바뀌지 않는다.
 * 활성 칸은 흰 pill 하나가 spring으로 옮겨 간다. 칸 폭이 56 이상이면 전체 라벨, 아니면 짧은 라벨(스크린리더는 항상 전체 라벨).
 */
export function DrawerFooter({ active, onPress }: { active: DockKind | null; onPress(kind: DockKind): void }) {
  const reduce = useReducedMotion();
  const [barW, setBarW] = useState(0);
  const segW = barW ? (barW - space.xxs * 2) / FOOTER_ITEMS.length : 0;
  const full = segW >= FULL_LABEL_MIN_SEG;
  const activeIdx = FOOTER_ITEMS.findIndex((it) => it.kind === active);

  const x = useSharedValue(0);
  useEffect(() => {
    if (activeIdx < 0 || !segW) return;
    const to = space.xxs + activeIdx * segW;
    x.value = reduce ? to : withSpring(to, motion.spring);
  }, [activeIdx, segW, reduce, x]);
  const pillStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View style={styles.bar} accessibilityRole="tablist" onLayout={(e) => setBarW(e.nativeEvent.layout.width)}>
      {activeIdx >= 0 && segW > 0 && <Animated.View pointerEvents="none" style={[styles.pill, { width: segW }, pillStyle]} />}
      {FOOTER_ITEMS.map((it) => {
        const on = it.kind === active;
        const tint = it.disabled ? colors.disabled : on ? colors.accentText : colors.muted;
        return (
          <Pressable
            key={it.kind}
            disabled={it.disabled}
            onPress={() => onPress(it.kind as DockKind)}
            accessibilityRole="tab"
            accessibilityLabel={it.label}
            accessibilityHint={it.disabled ? NOT_READY_HINT : undefined}
            accessibilityState={{ selected: on, disabled: !!it.disabled }}
            hitSlop={{ top: space.xs, bottom: space.xs }}
            style={({ pressed }) => [styles.seg, pressed && !on && styles.segPressed]}>
            <Ionicons name={it.icon} size={layout.footerIcon} color={tint} />
            <Text style={[styles.label, { color: tint }]} numberOfLines={1} ellipsizeMode="clip" maxFontSizeMultiplier={1.2}>
              {full ? it.label : it.short}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', marginHorizontal: -space.sm, backgroundColor: colors.cardMuted, borderRadius: radius.md, padding: space.xxs },
  pill: { position: 'absolute', left: 0, top: space.xxs, bottom: space.xxs, borderRadius: radius.sm, backgroundColor: colors.card, ...shadow.card },
  seg: {
    flex: 1,
    minWidth: 0,
    minHeight: layout.footerH - space.sm,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xxs,
    paddingHorizontal: space.xxs,
  },
  segPressed: { backgroundColor: colors.accentSoftPress },
  label: { ...type.tabLabel, textAlign: 'center' },
});
