import { useEffect, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors, layout, motion, radius, shadow, space, type, z } from '../../ui/theme';
import { EDGE_HANDLE_OUT, EdgeHandle } from '../EdgeHandle';

/**
 * 카드 drawer(design-spec P1-4): 화면 가장자리에서 gutter만큼 띄운 흰 카드. 헤더(제목) / 스크롤 채팅 / 하단 고정 바(footer).
 * 접기는 카드 오른쪽 변 세로 가운데에 걸친 '<' 버튼(EdgeHandle). dock이 열려 있는 동안은 숨긴다.
 * 닫힐 때는 왼쪽 밖으로 spring 이동하고 터치를 받지 않는다(언마운트하지 않아 대화 스크롤 위치가 유지된다).
 */
export function AgentDrawer({
  open,
  width,
  onCollapse,
  hideHandle,
  footer,
  children,
}: {
  open: boolean;
  width: number;
  onCollapse(): void;
  /** dock이 열려 있으면 접기 버튼을 숨긴다 */
  hideHandle?: boolean;
  footer: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  const hidden = -(width + EDGE_HANDLE_OUT + layout.gutter * 2);
  const x = useSharedValue(open ? 0 : hidden);
  useEffect(() => {
    const to = open ? 0 : hidden;
    x.value = reduce ? to : withSpring(to, motion.spring);
  }, [open, hidden, reduce, x]);
  const slide = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <Animated.View pointerEvents={open ? 'box-none' : 'none'} style={[styles.wrap, { width: width + EDGE_HANDLE_OUT }, slide]}>
      <View pointerEvents={open ? 'auto' : 'none'} accessibilityLabel="에이전트 drawer" style={[styles.drawer, { width }]}>
        <View style={styles.header}>
          <Text style={styles.title}>에이전트</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {children}
        </ScrollView>
        {footer}
      </View>
      {!hideHandle && <EdgeHandle label="채팅 접기" onPress={onCollapse} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 카드 + 오른쪽 변에 걸친 접기 버튼(EdgeHandle)이 함께 움직이는 바깥 틀
  wrap: {
    position: 'absolute',
    left: layout.gutter,
    top: layout.gutter,
    bottom: layout.gutter,
    zIndex: z.drawer,
  },
  drawer: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingTop: space.lg,
    paddingHorizontal: space.lg,
    paddingBottom: space.md,
    gap: space.md,
    ...shadow.float,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: layout.hit },
  title: { ...type.title, color: colors.text, flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { gap: space.lg },
});
