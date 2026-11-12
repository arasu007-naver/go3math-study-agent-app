import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip } from '../src/ui/Chip';

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
