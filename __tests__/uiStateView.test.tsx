import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors } from '../src/ui/theme';
import { StateView } from '../src/ui/StateView';

describe('StateView', () => {
  it('shows the title for each kind', async () => {
    for (const kind of ['loading', 'empty', 'error'] as const) {
      await render(<StateView kind={kind} title={`제목 ${kind}`} />);
      expect(screen.getByText(`제목 ${kind}`)).toBeTruthy();
    }
  });

  it('loading shows a spinner, empty and error do not', async () => {
    const { rerender } = await render(<StateView kind="loading" title="불러오는 중" />);
    expect(screen.getByTestId('state-spinner')).toBeTruthy();
    await rerender(<StateView kind="empty" title="비어 있어요" />);
    expect(screen.queryByTestId('state-spinner')).toBeNull();
    await rerender(<StateView kind="error" title="불러오지 못했어요" />);
    expect(screen.queryByTestId('state-spinner')).toBeNull();
  });

  it('error action is a primary button that calls onPress', async () => {
    const onPress = jest.fn();
    await render(<StateView kind="error" title="불러오지 못했어요" action={{ title: '다시 시도', onPress }} />);
    expect(StyleSheet.flatten(screen.getByRole('button', { name: '다시 시도' }).props.style).backgroundColor).toBe(colors.accent);
    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('empty action calls onPress', async () => {
    const onPress = jest.fn();
    await render(<StateView kind="empty" title="아직 기록이 없어요" action={{ title: '문제 풀러 가기', onPress }} />);
    await fireEvent.press(screen.getByRole('button', { name: '문제 풀러 가기' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('no action renders no button', async () => {
    await render(<StateView kind="error" title="불러오지 못했어요" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('message renders when given', async () => {
    await render(<StateView kind="empty" title="비어 있어요" message="새 공지가 오면 여기에 보여요." />);
    expect(screen.getByText('새 공지가 오면 여기에 보여요.')).toBeTruthy();
  });
});
