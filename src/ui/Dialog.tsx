import { useState, type ReactNode } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Button } from './Button';
import { Sheet } from './Sheet';
import { colors, layout, space, type } from './theme';

export type DialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  children?: ReactNode;
  onDismiss(): void;
  confirm: { title: string; onPress(): void | Promise<unknown>; variant?: 'primary' | 'danger'; disabled?: boolean };
  cancel?: { title?: string; onPress?(): void };
};

/**
 * 공용 확인 대화상자(단계 3, 진단 D-13). Sheet(scrim + 가운데 카드) 위에 제목·설명·입력·버튼을 놓는다.
 * scrim·Android 뒤로 가기는 onDismiss. 취소는 cancel.onPress가 있으면 그것, 없으면 onDismiss.
 * 확인이 돌려준 promise가 끝나기 전에는 닫히지 않는다(저장 중에 취소한 것처럼 보이지 않게).
 */
export function Dialog({ visible, title, message, children, onDismiss, confirm, cancel }: DialogProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width - layout.gutter * 2, layout.dialogMax);
  const [confirming, setConfirming] = useState(false);
  const dismiss = () => {
    if (!confirming) onDismiss();
  };
  const runConfirm = async () => {
    const result = confirm.onPress();
    if (!result || typeof (result as Promise<unknown>).then !== 'function') return;
    setConfirming(true);
    try {
      await result;
    } finally {
      setConfirming(false);
    }
  };
  return (
    <Sheet visible={visible} onDismiss={dismiss} style={[styles.card, { width: cardWidth }]}>
      <Text accessibilityRole="header" style={[type.title, styles.title]}>
        {title}
      </Text>
      {message ? <Text style={[type.body, styles.message]}>{message}</Text> : null}
      {children}
      <View style={styles.actions}>
        {cancel ? (
          <Button variant="secondary" title={cancel.title ?? '취소'} onPress={cancel.onPress ?? onDismiss} disabled={confirming} />
        ) : null}
        <Button variant={confirm.variant ?? 'primary'} title={confirm.title} onPress={runConfirm} disabled={confirm.disabled} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.lg, gap: space.md },
  title: { color: colors.text },
  message: { color: colors.subtle },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.sm },
});
