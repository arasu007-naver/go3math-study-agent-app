import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { pickLayout, type LayoutStyle } from './Button';
import { colors, layout, radius, shadow, space, type } from './theme';

export type ChipProps = {
  label: string;
  selected: boolean;
  onPress(): void;
  disabled?: boolean;
  accessibilityRole?: 'button' | 'tab' | 'radio' | 'checkbox';
  /** 공통 버튼 모양(회색 바탕 · 두꺼운 흰 테두리 · 그림자). 선택되면 글자만 주황(주요 버튼 바탕색)이 된다 */
  raised?: boolean;
  /** 있으면 칩 안 오른쪽에 닫기(✕) 버튼을 둔다(닫을 수 있는 탭) */
  onClose?(): void;
  /** 닫기 버튼의 접근성 이름. 없으면 '<label> 닫기' */
  closeLabel?: string;
  style?: LayoutStyle;
};

const SLOP = (layout.hit - layout.controlSm) / 2;

/** 공용 선택·필터 칩(단계 3). 눌리지 않는 라벨은 칩으로 그리지 않는다. */
export function Chip({ label, selected, onPress, disabled = false, accessibilityRole = 'button', raised = false, onClose, closeLabel, style }: ChipProps) {
  const color = disabled ? colors.disabled : raised ? (selected ? colors.accent : colors.text) : selected ? colors.accentText : colors.subtle;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={{ top: SLOP, bottom: SLOP }}
      accessibilityRole={accessibilityRole}
      // 닫기 버튼이 안에 있어도 칩 이름은 라벨만
      accessibilityLabel={onClose ? label : undefined}
      // checkbox·radio는 스크린 리더가 checked를 읽는다
      accessibilityState={accessibilityRole === 'checkbox' || accessibilityRole === 'radio' ? { checked: selected, disabled } : { selected, disabled }}
      style={({ pressed }) => [
        styles.base,
        onClose && styles.closable,
        raised ? styles.raised : selected && styles.selected,
        pressed && !disabled && (raised ? styles.raisedPressed : styles.pressed),
        pickLayout(style),
      ]}
    >
      <Text style={[type.bodyStrong, { color }]}>{label}</Text>
      {onClose && (
        <Pressable onPress={onClose} hitSlop={space.sm} accessibilityRole="button" accessibilityLabel={closeLabel ?? `${label} 닫기`}>
          <Ionicons name="close" size={16} color={color} />
        </Pressable>
      )}
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
  closable: { flexDirection: 'row', gap: space.xs, paddingRight: space.sm },
  selected: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  pressed: { backgroundColor: colors.accentSoftPress },
  // 공용 보조 버튼(Button secondary)과 같은 모양
  raised: { backgroundColor: colors.rail, borderWidth: 3, borderColor: colors.card, ...shadow.card },
  raisedPressed: { backgroundColor: colors.lineStrong },
});
