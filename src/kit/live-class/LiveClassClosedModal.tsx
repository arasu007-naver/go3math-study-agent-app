import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, type } from '../../ui/theme';

// 실황 수업 종료 안내 — '확인' 하나뿐이고 배경을 눌러도 닫히지 않는다. Android 뒤로가기도 '확인'과 같다
export default function LiveClassClosedModal({ visible, onConfirm }: { visible: boolean; onConfirm: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onConfirm}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.message}>수업이 종료되었습니다</Text>
          <TouchableOpacity style={styles.button} onPress={onConfirm} accessibilityRole="button">
            <Text style={styles.buttonText}>확인</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  card: { minWidth: 280, padding: 24, borderRadius: 12, backgroundColor: '#FFFFFF', alignItems: 'center' },
  message: { ...type.bodyStrong, color: colors.text },
  button: { marginTop: 24, paddingHorizontal: 28, paddingVertical: 10, borderRadius: 8, backgroundColor: colors.accent },
  buttonText: { ...type.bodyStrong, color: colors.onAccent },
});
