import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { Chip } from '../src/ui/Chip';

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

  it('uses minHeight 32 and no height', async () => {
    await render(<Chip label="수학 I" selected={false} onPress={() => {}} />);
    const style = StyleSheet.flatten(screen.getByRole('button').props.style);
    expect(style).toMatchObject({ minHeight: 32 });
    expect(style.height).toBeUndefined();
  });
});

export const typeGuards = () => (
  <>
    {/* @ts-expect-error style is layout-only */}
    <Chip label="x" selected={false} onPress={() => {}} style={{ borderColor: 'red' }} />
  </>
);
