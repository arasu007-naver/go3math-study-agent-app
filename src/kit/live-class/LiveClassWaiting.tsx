import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Go3MathLoader from '@/src/kit/ui/loading-view';
import { colors, type } from '@/src/ui/theme';

// 실황 수업이 아직 시작하지 않았을 때 캔버스 위를 덮는 대기 화면: 로고 애니메이션 + 문구 + 나가기
export default function LiveClassWaiting({ onExit }: { onExit(): void }) {
  return (
    <View testID="live-class-waiting" style={styles.root}>
      <Go3MathLoader style={styles.loader} />
      <Text style={styles.text}>수업 전입니다.</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel="나가기" onPress={onExit} style={styles.exit}>
        <Text style={styles.exitText}>나가기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, elevation: 100, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  loader: { flex: 0, height: 120 },
  text: { ...type.bodyStrong, color: colors.text, marginTop: 16 },
  exit: { marginTop: 32, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.accent },
  exitText: { ...type.bodyStrong, color: colors.onAccent },
});
