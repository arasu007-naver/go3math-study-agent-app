import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { colors, space, type } from './theme';

export type StateViewProps = {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  message?: string;
  action?: { title: string; onPress(): void | Promise<unknown> };
};

/**
 * 공용 로딩·빈·오류 상태(단계 3, 진단 D-03). 문구는 무엇이 일어났는지 + 다음에 할 일.
 * 모양을 아는 목록의 로딩은 SkeletonCards를 쓰고, 이것은 모양을 모를 때만 쓴다.
 */
export function StateView({ kind, title, message, action }: StateViewProps) {
  return (
    <View style={styles.root}>
      {kind === 'loading' ? <ActivityIndicator testID="state-spinner" color={colors.accent} /> : null}
      <Text accessibilityRole="header" style={[type.title, styles.title]}>
        {title}
      </Text>
      {message ? <Text style={[type.body, styles.message]}>{message}</Text> : null}
      {action ? (
        <Button
          variant={kind === 'error' ? 'primary' : 'secondary'}
          title={action.title}
          onPress={action.onPress}
          style={styles.action}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', padding: space.xl, gap: space.sm },
  title: { color: colors.text, textAlign: 'center' },
  message: { color: colors.muted, textAlign: 'center' },
  action: { marginTop: space.sm },
});
