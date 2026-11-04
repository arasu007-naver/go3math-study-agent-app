import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, radius, shadow } from '../ui/theme';

/** 버튼이 카드 오른쪽 변 밖으로 나오는 폭. 카드를 감싼 바깥 View를 이만큼 넓혀야 한다. */
export const EDGE_HANDLE_OUT = layout.hit / 2;

/**
 * 카드(drawer·dock) 오른쪽 변 세로 가운데에 걸친 '<' 접기/닫기 버튼. 주황 원형 + 흰 아이콘.
 * Android는 부모 밖 자식에 터치가 가지 않으므로, 카드를 감싼 바깥 View(카드보다 EDGE_HANDLE_OUT만큼 넓음)의 자식으로 둔다.
 */
export function EdgeHandle({ label, onPress }: { label: string; onPress(): void }) {
  return (
    <View pointerEvents="box-none" style={styles.col}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
        <Ionicons name="chevron-back" size={20} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  col: { position: 'absolute', top: 0, bottom: 0, right: 0, justifyContent: 'center' },
  btn: {
    width: layout.hit,
    height: layout.hit,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    ...shadow.float,
  },
  pressed: { backgroundColor: colors.accentPress },
});
