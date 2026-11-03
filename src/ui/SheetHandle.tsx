import { Ionicons } from '@expo/vector-icons';
import { useBottomSheet, type BottomSheetHandleProps } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, radius, shadow, space } from './theme';

/**
 * bottom sheet 위쪽 손잡이(기본 세로 막대 대체). dock 닫기 버튼(EdgeHandle)과 같은 주황 원형 + 흰 아이콘이고, 아래로 내려 닫으므로 아래 화살표.
 * 버튼 세로 가운데를 지나는 주황 가로선(좌우 gutter 안쪽, 2px)을 버튼 뒤에 깐다.
 * 끌어서 내리는 손잡이 역할은 그대로이고, 누르면 시트를 닫는다. BottomSheetModal의 handleComponent로 넘긴다.
 */
export function SheetHandle(_: BottomSheetHandleProps) {
  const { close } = useBottomSheet();
  return (
    <View style={styles.bar}>
      <View style={styles.line} />
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={() => close()} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
        <Ionicons name="chevron-down" size={20} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

const LINE_H = 2;

const styles = StyleSheet.create({
  bar: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.sm },
  line: { position: 'absolute', left: layout.gutter, right: layout.gutter, top: '50%', height: LINE_H, marginTop: -LINE_H / 2, backgroundColor: colors.accent },
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
