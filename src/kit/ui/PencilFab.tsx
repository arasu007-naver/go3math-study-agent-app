import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius, shadow, space } from '../../ui/theme';

/** 오른쪽 아래 떠 있는 연필 버튼(문제 풀이 화면 열기). 캔버스 도구가 아니라 목록 → 풀이 화면 진입 버튼이라 FloatingToolbar에 넣지 않는다. */
export function PencilFab({ onPress, label = '문제 풀이 시작' }: { onPress(): void; label?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path d="M4 20h4L19 9l-4-4L4 16v4z" stroke={colors.onAccent} strokeWidth={2} strokeLinejoin="round" fill="none" />
        <Path d="M13.5 6.5l4 4" stroke={colors.onAccent} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: space.xl,
    bottom: space.xl,
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
  pressed: { backgroundColor: colors.accentPress },
});
