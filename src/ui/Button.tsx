import { useRef, useState, type ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, layout, radius, space, type } from './theme';

/** 호출부가 넘길 수 있는 스타일은 배치뿐이다. 색·글자·크기는 variant와 size로만 정한다. */
export type LayoutStyle = StyleProp<
  Pick<
    ViewStyle,
    | 'margin'
    | 'marginTop'
    | 'marginBottom'
    | 'marginLeft'
    | 'marginRight'
    | 'marginHorizontal'
    | 'marginVertical'
    | 'flex'
    | 'flexGrow'
    | 'flexShrink'
    | 'flexBasis'
    | 'alignSelf'
  >
>;

export type IoniconName = ComponentProps<typeof Ionicons>['name'];
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';

export type ButtonProps = {
  variant: ButtonVariant;
  size?: 'md' | 'sm';
  title: string;
  icon?: IoniconName;
  onPress(): void | Promise<unknown>;
  disabled?: boolean;
  loading?: boolean;
  debounceMs?: number;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: LayoutStyle;
};

type Look = { bg: string; pressedBg: string; border: string; label: string };

const LOOK: Record<ButtonVariant, Look> = {
  primary: { bg: colors.accent, pressedBg: colors.accentPress, border: 'transparent', label: colors.onAccent },
  secondary: { bg: colors.card, pressedBg: colors.cardMuted, border: colors.lineStrong, label: colors.text },
  danger: { bg: colors.danger, pressedBg: colors.danger, border: 'transparent', label: colors.onAccent },
  text: { bg: 'transparent', pressedBg: colors.accentSoft, border: 'transparent', label: colors.accentText },
};

const DISABLED: Record<ButtonVariant, Look> = {
  primary: { bg: colors.cardMuted, pressedBg: colors.cardMuted, border: 'transparent', label: colors.disabled },
  danger: { bg: colors.cardMuted, pressedBg: colors.cardMuted, border: 'transparent', label: colors.disabled },
  secondary: { bg: colors.card, pressedBg: colors.card, border: colors.disabled, label: colors.disabled },
  text: { bg: 'transparent', pressedBg: 'transparent', border: 'transparent', label: colors.disabled },
};

const SLOP = (layout.hit - layout.controlSm) / 2;

/** 공용 버튼(단계 3). 주요·보조·위험·텍스트 위계를 variant로 고른다. 돌려받은 promise가 끝날 때까지 loading이고, 중복 누름을 막는다. */
export function Button({
  variant,
  size = 'md',
  title,
  icon,
  onPress,
  disabled = false,
  loading = false,
  debounceMs = 400,
  accessibilityLabel,
  accessibilityHint,
  style,
}: ButtonProps) {
  const [pending, setPending] = useState(false);
  const lastPress = useRef(0);
  const busy = loading || pending;
  const inactive = disabled || busy;
  const look = disabled ? DISABLED[variant] : LOOK[variant];
  const sm = size === 'sm';

  const handlePress = async () => {
    if (inactive) return;
    const now = Date.now();
    if (now - lastPress.current < debounceMs) return;
    lastPress.current = now;
    const result = onPress();
    if (!result || typeof (result as Promise<unknown>).then !== 'function') return;
    setPending(true);
    try {
      await result;
    } catch (e) {
      console.warn('[Button] onPress rejected', e);
    } finally {
      setPending(false);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={inactive}
      hitSlop={sm ? { top: SLOP, bottom: SLOP } : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, busy }}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: sm ? layout.controlSm : layout.hit,
          paddingHorizontal: sm ? space.md : space.lg,
          backgroundColor: pressed && !inactive ? look.pressedBg : look.bg,
          borderColor: look.border,
        },
        pressed && !inactive && variant === 'danger' && styles.dangerPressed,
        style,
      ]}
    >
      <View style={[styles.content, busy && styles.hidden]}>
        {icon ? <Ionicons testID="button-icon" name={icon} size={18} color={look.label} /> : null}
        <Text style={[sm ? type.bodyStrong : type.title, { color: look.label }]}>{title}</Text>
      </View>
      {busy ? (
        <View style={styles.spinner} pointerEvents="none">
          <ActivityIndicator size="small" color={look.label} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  content: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  hidden: { opacity: 0 },
  spinner: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  dangerPressed: { opacity: 0.85 },
});
