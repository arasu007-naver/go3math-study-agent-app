import type { ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '../ui/theme';

// 태블릿 drawer 오른쪽 가운데에 붙는 dock 컨테이너. 제목·닫기 버튼과 위치·크기·슬라이드를 맡고, 내용은 children.
// drawer의 자식이 아니라 형제로 둔다(Android는 부모 밖 자식에 터치가 가지 않음). drawer와 같은 slide 값으로 함께 움직인다.
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
  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-drawerWidth - dockWidth - 16, 0] });

  return (
    <Animated.View
      accessibilityLabel={`${title} dock`}
      style={[styles.dock, { left: drawerWidth, top: (height - dockHeight) / 2, width: dockWidth, height: dockHeight, transform: [{ translateX }] }]}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`${title} 닫기`} onPress={onClose} style={styles.closeBtn}>
          <Text style={styles.closeText}>×</Text>
        </Pressable>
      </View>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: 'absolute',
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
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  title: { fontSize: 13, fontWeight: '700', color: colors.agentText },
  closeBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.agent, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 24, color: colors.text, lineHeight: 26 },
});
