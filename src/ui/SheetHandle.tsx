import { Ionicons } from '@expo/vector-icons';
import { useBottomSheet, type BottomSheetHandleProps } from '@gorhom/bottom-sheet';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, radius, shadow, space } from './theme';

/**
 * bottom sheet 위쪽 손잡이(기본 세로 막대 대체). dock 닫기 버튼(EdgeHandle)과 같은 주황 원형 + 흰 아이콘이고, 아래로 내려 닫으므로 아래 화살표.
 * 버튼 뒤에 회색 가로 손잡이 막대(폭 480 · 두께 18 · 양끝 완전히 둥글게, 좁은 화면에서는 gutter 안쪽까지)를 깔아 끌 수 있는 자리임을 보인다.
 * 시트 위쪽 가로선(테두리)은 두지 않는다.
 * 이 영역을 위아래로 끌면 시트 높이가 단계(snapPoints) 사이로 바뀌고, 버튼을 누르면 시트를 닫는다. BottomSheetModal의 handleComponent로 넘긴다.
 */
export function SheetHandle(_: BottomSheetHandleProps) {
  const { close } = useBottomSheet();
  return (
    <View style={styles.bar}>
      <View testID="sheet-handle-grip" style={styles.gripBox} pointerEvents="none">
        <View style={styles.grip} />
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={() => close()} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
        <Ionicons name="chevron-down" size={20} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

const GRIP_W = 480;
const GRIP_H = 18;

const styles = StyleSheet.create({
  bar: { alignItems: 'center', justifyContent: 'center', paddingVertical: space.sm },
  // 손잡이 막대: 버튼 아래. 가운데 정렬, 폭 480(화면이 좁으면 gutter 안쪽 폭)
  gripBox: { position: 'absolute', left: layout.gutter, right: layout.gutter, top: '50%', height: GRIP_H, marginTop: -GRIP_H / 2, alignItems: 'center' },
  grip: { width: GRIP_W, maxWidth: '100%', height: GRIP_H, borderRadius: radius.pill, backgroundColor: colors.lineStrong },
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
