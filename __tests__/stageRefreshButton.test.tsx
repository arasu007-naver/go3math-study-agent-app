import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('../src/host/widgets', () => {
  const { Text } = require('react-native');
  const W = (p: any) => <Text testID="w" onPress={() => p.refresh?.onDone(false)}>{`${p.refresh?.token}`}</Text>;
  return { widgets: { problem_list: W, bookmarks: W, bookmarks_panel: W, problem_preview: W } };
});
import { Stage } from '../src/host/Stage';

const st = (componentId?: string) => ({ stage: componentId ? { componentId, props: {} } : null, connected: true, fallbackText: null }) as any;

describe('Stage refresh button', () => {
  it('shows only for list widgets', async () => {
    for (const id of ['problem_list', 'bookmarks', 'bookmarks_panel']) {
      const { unmount } = await render(<Stage state={st(id)} session={{} as any} />);
      expect(screen.getByTestId('stage-refresh')).toBeTruthy();
      await unmount();
    }
    await render(<Stage state={st('problem_preview')} session={{} as any} />);
    expect(screen.queryByTestId('stage-refresh')).toBeNull();
  });

  it('disables while busy, shows failure text after done(false)', async () => {
    await render(<Stage state={st('problem_list')} session={{} as any} />);
    await fireEvent.press(screen.getByTestId('stage-refresh'));
    expect(screen.getByTestId('w').props.children).toBe('1');
    expect(screen.getByTestId('stage-refresh').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('w'));
    expect(screen.getByText('새로고침하지 못했어요. 잠시 후 다시 시도해 주세요.')).toBeTruthy();
    expect(screen.getByTestId('stage-refresh').props.accessibilityState.disabled).toBe(false);
  });
});
