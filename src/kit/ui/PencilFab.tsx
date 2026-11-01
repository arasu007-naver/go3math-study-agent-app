import { Pressable, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

/** 오른쪽 아래 떠 있는 연필 버튼(문제 풀이 화면 열기) */
export function PencilFab({ onPress, label = '문제 풀이 시작' }: { onPress(): void; label?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path d="M4 20h4L19 9l-4-4L4 16v4z" stroke="#FFFFFF" strokeWidth={2} strokeLinejoin="round" fill="none" />
        <Path d="M13.5 6.5l4 4" stroke="#FFFFFF" strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF8800',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  pressed: { backgroundColor: '#D35400' },
});
