import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, space, type } from './theme';

export type TagProps = { label: string | number; tone?: 'neutral' | 'accent' | 'unread' };

const TONE = {
  neutral: { bg: colors.cardMuted, fg: colors.subtle },
  accent: { bg: colors.accentSoft, fg: colors.accentText },
  unread: { bg: colors.unread, fg: colors.onAccent },
} as const;

/** 눌리지 않는 표시용 태그·숫자 배지(단계 4a, Gate C §8). 숫자는 줄이지 않고 그대로 보인다. */
export function Tag({ label, tone = 'neutral' }: TagProps) {
  const t = TONE[tone];
  return (
    <View testID="tag" style={[styles.base, { backgroundColor: t.bg }, tone === 'unread' && styles.unread]}>
      <Text style={[type.caption, { color: t.fg }]}>{String(label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: space.xxs },
  unread: { minWidth: 20, alignItems: 'center' },
});
