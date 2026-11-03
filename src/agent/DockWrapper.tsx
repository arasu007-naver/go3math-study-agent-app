import type { ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, FadeOut, useReducedMotion } from 'react-native-reanimated';
import { colors, layout, motion, radius, shadow, space, type, z } from '../ui/theme';
import { EDGE_HANDLE_OUT, EdgeHandle } from './EdgeHandle';

// 태블릿 drawer 오른쪽에 붙는 dock 카드(design-spec P1-4). 제목과 위치·크기를 맡고, 내용은 children.
// 닫기는 카드 오른쪽 변 세로 가운데에 걸친 '<' 버튼(EdgeHandle). 바깥 View를 버튼이 나오는 만큼 넓히고 카드는 그만큼 안쪽에 둔다.
// drawer의 자식이 아니라 형제로 둔다(Android는 부모 밖 자식에 터치가 가지 않음). 위아래는 drawer와 같은 gutter로 맞춘다.
// drawer 뒤 dockDelay만큼 늦게 페이드인한다.
export function DockWrapper({
  title,
  left,
  onClose,
  children,
}: {
  title: string;
  /** dock 왼쪽 끝 = gutter + drawer 폭 + gutter (dock이 열려 있으면 drawer 접기 버튼은 숨겨진다) */
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
      pointerEvents="box-none"
      style={[styles.dock, { left, width: dockWidth }]}>
      <View style={styles.card}>
        {/* iOS는 overflow: hidden이 그림자를 자르므로 둥근 모서리 자르기는 안쪽 View가 맡는다 */}
        <View style={styles.clip}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
          </View>
          <View style={styles.content}>{children}</View>
        </View>
      </View>
      <EdgeHandle label={`${title} dock 닫기`} onPress={onClose} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
    top: layout.gutter,
    bottom: layout.gutter,
    maxWidth: layout.dockMax,
    zIndex: z.dock,
  },
  card: { flex: 1, marginRight: EDGE_HANDLE_OUT, backgroundColor: colors.card, borderRadius: radius.lg, ...shadow.float },
  clip: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  header: { height: layout.headerH, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg },
  title: { ...type.title, color: colors.text, flex: 1 },
  content: { flex: 1 },
});
