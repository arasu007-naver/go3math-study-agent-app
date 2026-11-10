import { Pressable, StyleSheet, Text } from 'react-native';
import type { LayoutStyle } from './Button';
import { colors, layout, radius, space, type } from './theme';

export type ChipProps = {
  label: string;
  selected: boolean;
  onPress(): void;
  disabled?: boolean;
  accessibilityRole?: 'button' | 'tab' | 'radio' | 'checkbox';
  style?: LayoutStyle;
};

const SLOP = (layout.hit - layout.controlSm) / 2;

/** 공용 선택·필터 칩(단계 3). 눌리지 않는 라벨은 칩으로 그리지 않는다. */
export function Chip({ label, selected, onPress, disabled = false, accessibilityRole = 'button', style }: ChipProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: SLOP, bottom: SLOP }}
      accessibilityRole={accessibilityRole}
      accessibilityState={{ selected, disabled }}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && !disabled && styles.pressed,
        style,
      ]}
    >
      <Text style={[type.bodyStrong, { color: disabled ? colors.disabled : selected ? colors.accentText : colors.subtle }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.controlSm,
    paddingHorizontal: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'transparent', // 선택 때 테두리가 생겨도 크기가 바뀌지 않게
    backgroundColor: colors.cardMuted,
  },
  selected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pressed: { backgroundColor: colors.accentSoftPress },
});
