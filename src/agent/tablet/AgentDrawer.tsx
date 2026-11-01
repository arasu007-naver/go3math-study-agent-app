import { Ionicons } from '@expo/vector-icons';
import { useEffect, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, layout, motion, radius, shadow, space, type, z } from '../../ui/theme';

/**
 * 카드 drawer(design-spec P1-4): 화면 가장자리에서 gutter만큼 띄운 흰 카드. 헤더(제목 + 접기) / 스크롤 채팅 / 하단 고정 바(footer).
 * 닫힐 때는 왼쪽 밖으로 spring 이동하고 터치를 받지 않는다(언마운트하지 않아 대화 스크롤 위치가 유지된다).
 */
export function AgentDrawer({
  open,
  width,
  onCollapse,
  footer,
  children,
}: {
  open: boolean;
  width: number;
  onCollapse(): void;
  footer: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const hidden = -(width + layout.gutter * 2);
  const x = useSharedValue(open ? 0 : hidden);
  useEffect(() => {
    const to = open ? 0 : hidden;
    x.value = reduce ? to : withSpring(to, motion.spring);
  }, [open, hidden, reduce, x]);
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Animated.View pointerEvents={open ? 'auto' : 'none'} accessibilityLabel="에이전트 drawer" style={[styles.drawer, { width }, slide]}>
      <View style={styles.header}>
        <Text style={styles.title}>에이전트</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="채팅 접기" onPress={onCollapse} style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
          <Ionicons name="chevron-back" size={20} color={colors.muted} />
        </Pressable>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {children}
      </ScrollView>
      {footer}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: 'absolute',
    left: layout.gutter,
    top: layout.gutter,
    bottom: layout.gutter,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    gap: space.md,
    zIndex: z.drawer,
    ...shadow.float,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: layout.hit },
  title: { ...type.title, color: colors.text, flex: 1 },
  iconBtn: { width: layout.hit, height: layout.hit, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.cardMuted },
  scroll: { flex: 1 },
  scrollContent: { gap: space.lg },
});
