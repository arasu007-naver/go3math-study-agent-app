import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickLayout, type IoniconName, type LayoutStyle } from './Button';
import { colors, layout, radius } from './theme';

export type IconButtonProps = {
  icon: IoniconName;
  accessibilityLabel: string;
  onPress(): void;
  size?: 'md' | 'sm';
  selected?: boolean;
  disabled?: boolean;
  accessibilityHint?: string;
  style?: LayoutStyle;
};

const SLOP = (layout.hit - layout.controlSm) / 2;

/** 선택·비활성에 맞는 바탕·아이콘 색. 비활성은 누름 색이 없다. */
export function iconButtonLook(selected: boolean, disabled: boolean) {
  if (disabled) return { bg: 'transparent', pressedBg: 'transparent', icon: colors.disabled };
  if (selected) return { bg: colors.accentSoft, pressedBg: colors.accentSoftPress, icon: colors.accentText };
  return { bg: 'transparent', pressedBg: colors.accentSoftPress, icon: colors.subtle };
}

/**
 * 공용 아이콘 버튼(단계 4a, Gate C §8). md 44 원·아이콘 22, sm 32 원·아이콘 18(hitSlop으로 44).
 * 아이콘 기본색은 subtle: rail 바탕이 비치면 muted가 옅어 보인다.
 */
export function IconButton({
  icon,
  accessibilityLabel,
  onPress,
  size = 'md',
  selected = false,
  disabled = false,
  accessibilityHint,
  style,
}: IconButtonProps) {
  const sm = size === 'sm';
  const box = sm ? layout.controlSm : layout.hit;
  const look = iconButtonLook(selected, disabled);
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={sm ? { top: SLOP, bottom: SLOP, left: SLOP, right: SLOP } : undefined}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.base,
        { minWidth: box, minHeight: box, backgroundColor: pressed && !disabled ? look.pressedBg : look.bg },
        pickLayout(style),
      ]}
    >
      <Ionicons testID="icon-button-icon" name={icon} size={sm ? 18 : layout.footerIcon} color={look.icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill },
});
