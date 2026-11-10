import { StyleSheet, TextInput } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Dialog } from '../src/ui/Dialog';
import { colors } from '../src/ui/theme';

const actionButtons = () => screen.getAllByRole('button').filter((b) => b.props.accessibilityLabel !== '닫기');

afterEach(() => jest.restoreAllMocks());

describe('Dialog', () => {
  it('renders title and message', async () => {
    await render(<Dialog visible title="지울까요?" message="되돌릴 수 없어요." onDismiss={() => {}} confirm={{ title: '지우기', onPress: () => {} }} />);
    expect(screen.getByText('지울까요?')).toBeTruthy();
    expect(screen.getByText('되돌릴 수 없어요.')).toBeTruthy();
  });

  it('confirm calls confirm.onPress', async () => {
    const onPress = jest.fn();
    await render(<Dialog visible title="t" onDismiss={() => {}} confirm={{ title: '확인', onPress }} />);
    await fireEvent.press(screen.getByRole('button', { name: '확인' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('cancel calls cancel.onPress when given, otherwise onDismiss', async () => {
    const cancel = jest.fn();
    const onDismiss = jest.fn();
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    const { rerender } = await render(<Dialog visible title="t" onDismiss={onDismiss} confirm={{ title: '확인', onPress: () => {} }} cancel={{ onPress: cancel }} />);
    await fireEvent.press(screen.getByRole('button', { name: '취소' }));
    expect(cancel).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    now.mockReturnValue(5000); // 같은 Button 인스턴스가 남아 400ms 중복 누름 방지가 걸리지 않게
    await rerender(<Dialog visible title="t" onDismiss={onDismiss} confirm={{ title: '확인', onPress: () => {} }} cancel={{ title: '닫기 전에' }} />);
    await fireEvent.press(screen.getByRole('button', { name: '닫기 전에' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('scrim calls onDismiss', async () => {
    const onDismiss = jest.fn();
    await render(<Dialog visible title="t" onDismiss={onDismiss} confirm={{ title: '확인', onPress: () => {} }} />);
    await fireEvent.press(screen.getByLabelText('닫기'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('no cancel prop renders only the confirm button', async () => {
    await render(<Dialog visible title="t" onDismiss={() => {}} confirm={{ title: '확인', onPress: () => {} }} />);
    expect(actionButtons()).toHaveLength(1);
  });

  it('cancel title defaults to 취소', async () => {
    await render(<Dialog visible title="t" onDismiss={() => {}} confirm={{ title: '확인', onPress: () => {} }} cancel={{}} />);
    expect(screen.getByRole('button', { name: '취소' })).toBeTruthy();
  });

  it('danger confirm uses the danger fill', async () => {
    await render(<Dialog visible title="t" onDismiss={() => {}} confirm={{ title: '지우기', onPress: () => {}, variant: 'danger' }} />);
    expect(StyleSheet.flatten(screen.getByRole('button', { name: '지우기' }).props.style).backgroundColor).toBe(colors.danger);
  });

  it('double tap on async confirm calls once', async () => {
    let finish: () => void = () => {};
    const onPress = jest.fn(() => new Promise<void>((r) => (finish = r)));
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    await render(<Dialog visible title="t" onDismiss={() => {}} confirm={{ title: '저장', onPress }} />);
    const first = fireEvent.press(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '저장' }).props.accessibilityState).toMatchObject({ busy: true }));
    now.mockReturnValue(5000);
    await fireEvent.press(screen.getByRole('button', { name: '저장' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    await act(async () => {
      finish();
      await first;
    });
  });

  it('confirm can be disabled', async () => {
    const onPress = jest.fn();
    await render(<Dialog visible title="t" onDismiss={() => {}} confirm={{ title: '저장', onPress, disabled: true }} />);
    await fireEvent.press(screen.getByRole('button', { name: '저장' }));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '저장' }).props.accessibilityState).toMatchObject({ disabled: true });
  });

  it('cannot be dismissed while an async confirm is running', async () => {
    let finish: () => void = () => {};
    const onDismiss = jest.fn();
    const cancel = jest.fn();
    await render(<Dialog visible title="t" onDismiss={onDismiss} cancel={{ onPress: cancel }} confirm={{ title: '저장', onPress: () => new Promise<void>((r) => (finish = r)) }} />);
    const first = fireEvent.press(screen.getByRole('button', { name: '저장' }));
    await waitFor(() => expect(screen.getByRole('button', { name: '취소' }).props.accessibilityState).toMatchObject({ disabled: true }));
    await fireEvent.press(screen.getByRole('button', { name: '취소' }));
    await fireEvent.press(screen.getByLabelText('닫기'));
    expect(cancel).not.toHaveBeenCalled();
    expect(onDismiss).not.toHaveBeenCalled();
    await act(async () => {
      finish();
      await first;
    });
    await fireEvent.press(screen.getByLabelText('닫기'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('children render between message and actions', async () => {
    await render(
      <Dialog visible title="이름 변경" onDismiss={() => {}} confirm={{ title: '저장', onPress: () => {} }}>
        <TextInput accessibilityLabel="새 이름" />
      </Dialog>,
    );
    expect(screen.getByLabelText('새 이름')).toBeTruthy();
  });
});
