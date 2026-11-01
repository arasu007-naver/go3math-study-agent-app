import type { ReactNode } from 'react';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../ui/theme';

export const EDGE_TAB_WIDTH = 28;
export const EDGE_TAB_HEIGHT = 112;

/** 패널 오른쪽 가장자리에 붙는 세로 탭 버튼: '>' 열기, '<' 닫기 */
export function EdgeTab({
  direction,
  label,
  onPress,
  style,
  children,
}: {
  direction: 'open' | 'close';
  label: string;
  onPress(): void;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={8} style={[styles.tab, style]}>
      {/* 화살표 아이콘(@expo/vector-icons는 expo-asset 네이티브 모듈이 필요해 react-native-svg로 그린다) */}
      <Svg width={22} height={22} viewBox="0 0 24 24">
        <Path
          d={direction === 'open' ? 'M9 5l7 7-7 7' : 'M15 5l-7 7 7 7'}
          stroke={colors.agent}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    position: 'absolute',
    width: EDGE_TAB_WIDTH,
    height: EDGE_TAB_HEIGHT,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
