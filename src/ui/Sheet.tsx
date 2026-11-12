import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { colors, radius, shadow, space } from './theme';

/**
 * 떠 있는 카드 모달(design-spec P3-3). react-native-paper Modal+Portal 대체: RN Modal(transparent) 위 딤(scrim)과 카드.
 * 딤을 누르거나 Android 뒤로 가기(onRequestClose)를 하면 onDismiss — paper Modal의 onDismiss와 같은 의미.
 * 카드 위치·크기는 style로 넘긴다(기본은 화면 가운데).
 */
export function Sheet({
  visible,
  onDismiss,
  style,
  children,
}: {
  visible: boolean;
  onDismiss(): void;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onDismiss} accessibilityRole="button" accessibilityLabel="닫기" />
        {/* 카드만 키보드를 피한다(단계 4a). scrim은 화면 전체에 그대로 둔다 */}
        <KeyboardAvoidingView
          testID="sheet-keyboard-avoider"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          pointerEvents="box-none"
          style={styles.avoider}
        >
          <View style={[styles.card, style]}>{children}</View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
  // 화면 전체를 채워야 absolute로 놓는 카드(캔버스 팝업)의 기준이 그대로다
  avoider: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  card: { padding: space.md, backgroundColor: colors.card, borderRadius: radius.lg, ...shadow.float },
});
