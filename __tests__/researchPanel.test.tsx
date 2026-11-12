import { fireEvent, render, screen } from '@testing-library/react-native';
import { RESEARCH_CATEGORY_KEY, ResearchPanel } from '../src/kit/research/ResearchPanel';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

const fetchers = { fetchTopics: jest.fn(async () => []) } as never;

function setup(stored?: string) {
  const store = { getString: jest.fn((k: string) => (k === RESEARCH_CATEGORY_KEY ? stored : undefined)), set: jest.fn() };
  return { store };
}

describe('ResearchPanel tabs (spec 4b D2)', () => {
  it('shows three tab chips without 개념', async () => {
    const { store } = setup();
    await render(<ResearchPanel fetchers={fetchers} topicSubjects={[]} store={store} onSubmitSearch={jest.fn()} onSelectTopic={jest.fn()} />);
    expect(screen.getAllByRole('tab')).toHaveLength(3);
    for (const label of ['2026', '모의 고사', '주제/묶음']) expect(screen.getByRole('tab', { name: label })).toBeTruthy();
    expect(screen.queryByText('개념')).toBeNull();
    expect(screen.getByRole('tab', { name: '2026' }).props.accessibilityState.selected).toBe(true);
  });

  it('a stored concept opens on 2026 and is not erased', async () => {
    const { store } = setup('concept');
    await render(<ResearchPanel fetchers={fetchers} topicSubjects={[]} store={store} onSubmitSearch={jest.fn()} onSelectTopic={jest.fn()} />);
    expect(screen.getByRole('tab', { name: '2026' }).props.accessibilityState.selected).toBe(true);
    expect(store.set).not.toHaveBeenCalledWith(RESEARCH_CATEGORY_KEY, expect.anything());
  });

  it('switching tabs saves the category', async () => {
    const { store } = setup();
    await render(<ResearchPanel fetchers={fetchers} topicSubjects={[]} store={store} onSubmitSearch={jest.fn()} onSelectTopic={jest.fn()} />);
    await fireEvent.press(screen.getByRole('tab', { name: '모의 고사' }));
    expect(store.set).toHaveBeenCalledWith(RESEARCH_CATEGORY_KEY, 'pre');
    expect(screen.getByRole('tab', { name: '모의 고사' }).props.accessibilityState.selected).toBe(true);
  });
});
