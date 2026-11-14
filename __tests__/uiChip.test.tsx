import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip } from '../src/ui/Chip';
import { colors, shadow } from '../src/ui/theme';

const sheet = StyleSheet.create({ smuggle: { marginTop: 8, borderColor: 'red' } });

describe('Chip', () => {
  it('reports selected and calls onPress', async () => {
    const onPress = jest.fn();
    await render(<Chip label="수학 I" selected onPress={onPress} />);
    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({ selected: true });
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('defaults role to button; accepts tab', async () => {
    const { rerender } = await render(<Chip label="기출" selected={false} onPress={() => {}} />);
    expect(screen.getByRole('button')).toBeTruthy();
    await rerender(<Chip label="기출" selected={false} onPress={() => {}} accessibilityRole="tab" />);
    expect(screen.getByRole('tab')).toBeTruthy();
  });

  it('with onClose shows a close button inside the chip that does not select it', async () => {
    const onPress = jest.fn();
    const onClose = jest.fn();
    await render(<Chip label="11월/10일" accessibilityRole="tab" selected={false} onPress={onPress} onClose={onClose} closeLabel="11월/10일 탭 닫기" />);
    const close = screen.getByRole('button', { name: '11월/10일 탭 닫기' });
    // 닫기 버튼은 칩(탭) 안에 있다
    expect(close.parent).toBe(screen.getByRole('tab'));
    await fireEvent.press(close);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('raised looks like the common button, and a selected one only turns its label accent', async () => {
    const { rerender } = await render(<Chip raised label="미적분" selected={false} onPress={() => {}} />);
    const look = { backgroundColor: colors.rail, borderColor: colors.card, borderWidth: 3, ...shadow.card };
    const labelColor = () => StyleSheet.flatten(screen.getByText('미적분').props.style).color;
    expect(StyleSheet.flatten(screen.getByRole('button').props.style)).toMatchObject(look);
    expect(labelColor()).toBe(colors.text);
    await rerender(<Chip raised label="미적분" selected onPress={() => {}} />);
    expect(StyleSheet.flatten(screen.getByRole('button').props.style)).toMatchObject(look);
    expect(labelColor()).toBe(colors.accent);
  });

  it('disabled and selected', async () => {
    const onPress = jest.fn();
    await render(<Chip label="수학 I" selected disabled onPress={onPress} />);
    expect(screen.getByRole('button').props.accessibilityState).toMatchObject({ selected: true, disabled: true });
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('reports checked, not selected, for checkbox and radio roles', async () => {
    for (const role of ['checkbox', 'radio'] as const) {
      await render(<Chip label="2025" selected onPress={() => {}} accessibilityRole={role} />);
      const state = screen.getByRole(role).props.accessibilityState;
      expect(state).toMatchObject({ checked: true });
      expect(state.selected).toBeUndefined();
    }
  });

  it('uses minHeight 32 and no height', async () => {
    await render(<Chip label="수학 I" selected={false} onPress={() => {}} />);
    const style = StyleSheet.flatten(screen.getByRole('button').props.style);
    expect(style).toMatchObject({ minHeight: 32 });
    expect(style.height).toBeUndefined();
  });
});

export const typeGuards = () => (
  <>
    {/* @ts-expect-error a StyleSheet entry with a color key is not layout-only */}
    <Chip label="x" selected={false} onPress={() => {}} style={sheet.smuggle} />
    {/* @ts-expect-error style is layout-only */}
    <Chip label="x" selected={false} onPress={() => {}} style={{ borderColor: 'red' }} />
  </>
);
