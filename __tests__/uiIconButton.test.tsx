import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { IconButton, iconButtonLook } from '../src/ui/IconButton';
import { colors, layout } from '../src/ui/theme';

const button = () => screen.getByRole('button');
const flat = () => StyleSheet.flatten(button().props.style);
const iconStyle = () => StyleSheet.flatten(screen.getByTestId('icon-button-icon').props.style);
const icon = () => ({ props: { size: iconStyle().fontSize, color: iconStyle().color } });

describe('IconButton', () => {
  it('md is a 44 circle with a 22 icon in subtle', async () => {
    await render(<IconButton icon="close" accessibilityLabel="닫기" onPress={() => {}} />);
    expect(flat()).toMatchObject({ minWidth: layout.hit, minHeight: layout.hit, backgroundColor: 'transparent' });
    expect(icon().props.size).toBe(layout.footerIcon);
    expect(icon().props.color).toBe(colors.subtle);
    expect(button().props.accessibilityLabel).toBe('닫기');
  });

  it('sm is a 32 circle with an 18 icon and a hitSlop up to 44', async () => {
    await render(<IconButton size="sm" icon="close" accessibilityLabel="메모 닫기" onPress={() => {}} />);
    const slop = (layout.hit - layout.controlSm) / 2;
    expect(flat()).toMatchObject({ minWidth: layout.controlSm, minHeight: layout.controlSm });
    expect(icon().props.size).toBe(18);
    expect(button().props.hitSlop).toEqual({ top: slop, bottom: slop, left: slop, right: slop });
  });

  it('selected uses accentSoft with an accentText icon', async () => {
    await render(<IconButton icon="book" accessibilityLabel="책" selected onPress={() => {}} />);
    expect(flat()).toMatchObject({ backgroundColor: colors.accentSoft });
    expect(icon().props.color).toBe(colors.accentText);
    expect(button().props.accessibilityState).toEqual({ selected: true, disabled: false });
  });

  it('pressed uses accentSoftPress; disabled has no press color', () => {
    expect(iconButtonLook(false, false).pressedBg).toBe(colors.accentSoftPress);
    expect(iconButtonLook(true, false).pressedBg).toBe(colors.accentSoftPress);
    expect(iconButtonLook(false, true).pressedBg).toBe('transparent');
  });

  it('disabled greys the icon and never calls onPress', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="book" accessibilityLabel="책" disabled accessibilityHint="준비 중" onPress={onPress} />);
    await fireEvent.press(button());
    expect(onPress).not.toHaveBeenCalled();
    expect(icon().props.color).toBe(colors.disabled);
    expect(button().props.accessibilityState).toEqual({ selected: false, disabled: true });
    expect(button().props.accessibilityHint).toBe('준비 중');
  });

  it('calls onPress', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon="book" accessibilityLabel="책" onPress={onPress} />);
    await fireEvent.press(button());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('keeps layout style keys only', async () => {
    const smuggled = { marginTop: 4, backgroundColor: 'red' } as unknown as { marginTop: number };
    await render(<IconButton icon="book" accessibilityLabel="책" onPress={() => {}} style={smuggled} />);
    expect(flat()).toMatchObject({ marginTop: 4, backgroundColor: 'transparent' });
  });
});

// 타입 가드: npm run typecheck가 확인한다
export const typeGuards = () => (
  <>
    {/* @ts-expect-error accessibilityLabel is required */}
    <IconButton icon="close" onPress={() => {}} />
    {/* @ts-expect-error style is layout-only */}
    <IconButton icon="close" accessibilityLabel="x" onPress={() => {}} style={{ backgroundColor: 'red' }} />
  </>
);
