import { fireEvent, render, screen } from '@testing-library/react-native';
import { RESEARCH_CATEGORY_KEY, ResearchPanel } from '../src/kit/research/ResearchPanel';
import { pickedConceptsStore } from '../src/state/concepts';

jest.mock('react-native-webview', () => ({ WebView: () => null }));
// 개념 조회 패널은 고른 개념(picked)만 보이는 대역 — 누르면 개념 하나를 고른다
jest.mock('../src/kit/concepts/ConceptLookupPanel', () => {
  const { Text } = require('react-native');
  return {
    ConceptLookupPanel: ({ picked, onPickedChange }: any) => (
      <Text onPress={() => onPickedChange([...picked, { id: picked.length + 1, title: '극한' }])}>{`concept-panel:${picked.length}`}</Text>
    ),
  };
});

const fetchers = { fetchTopics: jest.fn(async () => []) } as never;

function setup(stored?: string) {
  const store = { getString: jest.fn((k: string) => (k === RESEARCH_CATEGORY_KEY ? stored : undefined)), set: jest.fn() };
  return { store };
}

describe('ResearchPanel tabs', () => {
  beforeEach(() => pickedConceptsStore.dispatch([]));

  it('shows four tab chips including 개념', async () => {
    const { store } = setup();
    await render(<ResearchPanel fetchers={fetchers} topicSubjects={[]} store={store} onSubmitSearch={jest.fn()} onSelectTopic={jest.fn()} />);
    expect(screen.getAllByRole('tab')).toHaveLength(4);
    for (const label of ['2026', '모의 고사', '주제/묶음', '개념']) expect(screen.getByRole('tab', { name: label })).toBeTruthy();
    expect(screen.getByRole('tab', { name: '2026' }).props.accessibilityState.selected).toBe(true);
  });

  it('a stored concept opens on the 개념 tab', async () => {
    const { store } = setup('concept');
    await render(<ResearchPanel fetchers={fetchers} topicSubjects={[]} store={store} onSubmitSearch={jest.fn()} onSelectTopic={jest.fn()} />);
    expect(screen.getByRole('tab', { name: '개념' }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByText('concept-panel:0')).toBeTruthy();
  });

  it('개념 tab shares picked concepts with the canvas sheet through pickedConceptsStore', async () => {
    const { store } = setup();
    // 캔버스 시트에서 이미 하나 골라 둔 상태
    pickedConceptsStore.dispatch([{ id: 9, title: '미분' } as never]);
    await render(<ResearchPanel fetchers={fetchers} topicSubjects={[]} store={store} onSubmitSearch={jest.fn()} onSelectTopic={jest.fn()} />);
    await fireEvent.press(screen.getByRole('tab', { name: '개념' }));
    expect(store.set).toHaveBeenCalledWith(RESEARCH_CATEGORY_KEY, 'concept');
    expect(screen.getByText('concept-panel:1')).toBeTruthy();
    // 여기서 하나 더 고르면 store에 쌓인다
    await fireEvent.press(screen.getByText('concept-panel:1'));
    expect(pickedConceptsStore.getState()).toHaveLength(2);
    expect(screen.getByText('concept-panel:2')).toBeTruthy();
  });

  it('switching tabs saves the category', async () => {
    const { store } = setup();
    await render(<ResearchPanel fetchers={fetchers} topicSubjects={[]} store={store} onSubmitSearch={jest.fn()} onSelectTopic={jest.fn()} />);
    await fireEvent.press(screen.getByRole('tab', { name: '모의 고사' }));
    expect(store.set).toHaveBeenCalledWith(RESEARCH_CATEGORY_KEY, 'pre');
    expect(screen.getByRole('tab', { name: '모의 고사' }).props.accessibilityState.selected).toBe(true);
  });
});
