import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Button, buttonLook } from '../src/ui/Button';
import { colors } from '../src/ui/theme';

const sheet = StyleSheet.create({ smuggle: { marginTop: 8, backgroundColor: 'red' } });

const button = () => screen.getByRole('button');
const flat = () => StyleSheet.flatten(button().props.style);

afterEach(() => jest.restoreAllMocks());

describe('Button', () => {
  it('defaults the accessibility label to the title', async () => {
    await render(<Button variant="primary" title="저장" onPress={() => {}} />);
    expect(button().props.accessibilityLabel).toBe('저장');
  });

  it('ignores presses and reports busy while the promise is pending', async () => {
    // RNTL은 누름 처리기가 끝나기를 기다리므로, 테스트가 직접 끝내는 promise를 쓴다.
    let finish: () => void = () => {};
    const onPress = jest.fn(() => new Promise<void>((r) => (finish = r)));
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    await render(<Button variant="primary" title="저장" onPress={onPress} />);
    const first = fireEvent.press(button());
    await waitFor(() => expect(button().props.accessibilityState).toMatchObject({ busy: true }));
    now.mockReturnValue(5000);
    await fireEvent.press(button());
    expect(onPress).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
      await first;
    });
    await waitFor(() => expect(button().props.accessibilityState).toMatchObject({ busy: false }));
  });

  it('leaves loading when the promise rejects', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    const onPress = jest.fn().mockRejectedValueOnce(new Error('net')).mockResolvedValueOnce(undefined);
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    await render(<Button variant="primary" title="저장" onPress={onPress} />);
    await fireEvent.press(button());
    await waitFor(() => expect(button().props.accessibilityState).toMatchObject({ busy: false }));
    now.mockReturnValue(5000);
    await fireEvent.press(button());
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('debounces presses within debounceMs', async () => {
    const onPress = jest.fn();
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    await render(<Button variant="secondary" title="다음" onPress={onPress} />);
    await fireEvent.press(button());
    now.mockReturnValue(1200);
    await fireEvent.press(button());
    expect(onPress).toHaveBeenCalledTimes(1);
    now.mockReturnValue(1500);
    await fireEvent.press(button());
    expect(onPress).toHaveBeenCalledTimes(2);
  });

  it('never calls onPress when disabled', async () => {
    const onPress = jest.fn();
    await render(<Button variant="primary" title="저장" onPress={onPress} disabled />);
    await fireEvent.press(button());
    expect(onPress).not.toHaveBeenCalled();
    expect(button().props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('shows the loading prop', async () => {
    const onPress = jest.fn();
    await render(<Button variant="primary" title="저장" onPress={onPress} loading />);
    await fireEvent.press(button());
    expect(onPress).not.toHaveBeenCalled();
    expect(button().props.accessibilityState).toMatchObject({ busy: true });
  });

  it('uses minHeight, not height', async () => {
    const { rerender } = await render(<Button variant="text" title="x" onPress={() => {}} />);
    expect(flat()).toMatchObject({ minHeight: 44 });
    expect(flat().height).toBeUndefined();
    await rerender(<Button variant="text" size="sm" title="x" onPress={() => {}} />);
    expect(flat()).toMatchObject({ minHeight: 32 });
    expect(flat().height).toBeUndefined();
  });

  it('drops non-layout style keys at runtime', async () => {
    const smuggled = { marginTop: 4, backgroundColor: 'red' } as unknown as { marginTop: number };
    await render(<Button variant="primary" title="x" onPress={() => {}} style={smuggled} />);
    expect(flat()).toMatchObject({ marginTop: 4, backgroundColor: colors.accent });
  });

  it('renders the icon', async () => {
    await render(<Button variant="primary" icon="add" title="추가" onPress={() => {}} />);
    expect(screen.getByTestId('button-icon')).toBeTruthy();
  });
});

describe('Button danger tone', () => {
  // RNTL v14에는 UNSAFE_getByType이 없어 누름 색은 buttonLook으로 확인한다
  const pressedBg = (variant: 'secondary' | 'text') => buttonLook(variant, 'danger', false).pressedBg;
  const labelColor = (title: string) => StyleSheet.flatten(screen.getByText(title).props.style).color;

  it('text + danger uses the danger label and dangerSoft press', async () => {
    await render(<Button variant="text" tone="danger" title="로그아웃" onPress={() => {}} />);
    expect(labelColor('로그아웃')).toBe(colors.danger);
    expect(flat()).toMatchObject({ backgroundColor: 'transparent' });
    expect(pressedBg('text')).toBe(colors.dangerSoft);
  });

  it('secondary + danger uses card bg with danger border and label', async () => {
    await render(<Button variant="secondary" tone="danger" title="해제" onPress={() => {}} />);
    expect(flat()).toMatchObject({ backgroundColor: colors.card, borderColor: colors.danger });
    expect(labelColor('해제')).toBe(colors.danger);
    expect(pressedBg('secondary')).toBe(colors.dangerSoft);
  });

  it('disabled ignores the tone', async () => {
    await render(<Button variant="secondary" tone="danger" title="해제" onPress={() => {}} disabled />);
    expect(flat()).toMatchObject({ backgroundColor: colors.card, borderColor: colors.disabled });
    expect(labelColor('해제')).toBe(colors.disabled);
  });

  it('tone default equals no tone', async () => {
    const { rerender } = await render(<Button variant="secondary" tone="default" title="a" onPress={() => {}} />);
    const withTone = flat();
    await rerender(<Button variant="secondary" title="a" onPress={() => {}} />);
    expect(flat()).toEqual(withTone);
  });
});

// 타입 가드: npm run typecheck가 확인한다(쓰이지 않는 @ts-expect-error는 오류).
export const typeGuards = () => (
  <>
    {/* @ts-expect-error variant is required */}
    <Button title="x" onPress={() => {}} />
    {/* @ts-expect-error style is layout-only */}
    <Button variant="primary" title="x" onPress={() => {}} style={{ backgroundColor: 'red' }} />
    {/* @ts-expect-error a StyleSheet entry with a color key is not layout-only */}
    <Button variant="primary" title="x" onPress={() => {}} style={sheet.smuggle} />
    {/* @ts-expect-error no color override */}
    <Button variant="primary" title="x" onPress={() => {}} color="red" />
    {/* @ts-expect-error tone is only for secondary and text */}
    <Button variant="primary" tone="danger" title="x" onPress={() => {}} />
    {/* @ts-expect-error tone is only for secondary and text */}
    <Button variant="danger" tone="danger" title="x" onPress={() => {}} />
  </>
);
