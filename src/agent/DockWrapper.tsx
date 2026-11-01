import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../ui/theme';
import { EDGE_TAB_HEIGHT, EDGE_TAB_WIDTH, EdgeTab } from './EdgeTab';

// 태블릿 drawer 오른쪽 가운데에 붙는 dock 컨테이너. 제목·닫기 버튼과 위치·크기·슬라이드를 맡고, 내용은 children.
// drawer의 자식이 아니라 형제로 둔다(Android는 부모 밖 자식에 터치가 가지 않음). drawer와 같은 slide 값으로 함께 움직인다.
// drawer의 닫기 탭('<') 위를 덮고, dock 자신의 오른쪽 가운데에 닫기 탭('<')을 둔다. 탭이 바깥 컨테이너 안에 들어가도록 컨테이너를 탭 너비만큼 넓힌다.
const DOCK_MAX_WIDTH = 640;
const DOCK_HEIGHT_RATIO = 0.8;

export function DockWrapper({
  title,
  drawerWidth,
  slide,
  onClose,
  children,
}: {
  title: string;
  drawerWidth: number;
  /** drawer 슬라이드 진행값(0 닫힘 → 1 열림) */
  slide: Animated.Value;
  onClose(): void;
  children: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const dockWidth = Math.min(DOCK_MAX_WIDTH, width - drawerWidth - 24);
  const dockHeight = Math.round(height * DOCK_HEIGHT_RATIO);
  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-drawerWidth - dockWidth - EDGE_TAB_WIDTH - 16, 0] });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.container, { left: drawerWidth, top: (height - dockHeight) / 2, width: dockWidth + EDGE_TAB_WIDTH, height: dockHeight, transform: [{ translateX }] }]}>
      <View accessibilityLabel={`${title} dock`} style={[styles.dock, { width: dockWidth }]}>
        <View style={styles.head}>
          <Text style={styles.title}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={`${title} 닫기`} onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>
        </View>
        {/* 패널 배경(흰색 사각형)이 둥근 오른쪽 아래 모서리의 테두리를 덮지 않도록 안쪽 반지름(12 - 테두리 1)으로 잘라 둔다 */}
        <View style={styles.content}>{children}</View>
      </View>
      <EdgeTab direction="close" label={`${title} dock 닫기`} onPress={onClose} style={{ left: dockWidth, top: (dockHeight - EDGE_TAB_HEIGHT) / 2 }} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Android: drawer(elevation 12) 옆, drawer 닫기 탭(elevation 0) 위
  container: { position: 'absolute', elevation: 11 },
  dock: {
    height: '100%',
    paddingTop: 8,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.agent,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 6, height: 0 },
    elevation: 11,
  },
  content: { flex: 1, borderBottomRightRadius: 11, overflow: 'hidden' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  title: { fontSize: 13, fontWeight: '700', color: colors.agentText },
  closeBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.agent, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 24, color: colors.text, lineHeight: 26 },
});
