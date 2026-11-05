/**
 * 문제 카드 아래 한 줄(폰 결과 화면) — 오른쪽에 눈(해답 보기)·카메라(풀이 찍어 올리기) 아이콘 버튼.
 * 실제 동작은 콜백으로 받는다. 올리는 중에는 카메라 자리에 스피너를 둔다.
 */
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { colors, layout, radius } from '../../ui/theme';

export function ProblemActionRow({ label, uploading, onAnswer, onCamera }: { label: string; uploading?: boolean; onAnswer(): void; onCamera(): void }) {
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${label} 해답 보기`} onPress={onAnswer} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
        <Ionicons name="eye-outline" size={layout.footerIcon} color={colors.accentText} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} 풀이 사진 올리기`}
        accessibilityState={{ busy: !!uploading, disabled: !!uploading }}
        disabled={uploading}
        onPress={onCamera}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
        {uploading ? <ActivityIndicator color={colors.accent} /> : <Ionicons name="camera-outline" size={layout.footerIcon} color={colors.accentText} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 4 },
  btn: { width: layout.hit, height: layout.hit, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.accentSoft },
});
