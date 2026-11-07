import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { createProblemListFetchers } from '../src/adapters/problemListFetchers';
import { LiveClassListPanel } from '../src/kit/live-class/LiveClassListPanel';
import { ProblemListPanel, type ProblemListFetchers, type ProblemSource } from '../src/kit/problem-list/ProblemListPanel';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: (props: any) => <View testID="webview" {...props} /> };
});
jest.mock('../src/kit/ui/image-dynamic-dims', () => () => null);

describe('LiveClassListPanel', () => {
  it('lists hotline and topic live classes and hands the chosen class as a problem source', async () => {
    const fetchers = {
      fetchHotlineClasses: jest.fn(async () => [{ tutor: { username: 'kim', name: '김선생' }, units: [{}, {}] }]),
      fetchTopicLiveClasses: jest.fn(async () => [{ id: '12', title: '이차함수', description: '꼭짓점', classTime: '19:00' }]),
    };
    const onOpen = jest.fn();
    await render(<LiveClassListPanel fetchers={fetchers} onOpen={onOpen} />);

    await waitFor(() => expect(screen.getByText('김선생 (2 문제)')).toBeTruthy());
    expect(screen.getByText('📝 이차함수')).toBeTruthy();
    expect(screen.getByText('🕑 19:00 예정')).toBeTruthy();

    await fireEvent.press(screen.getByLabelText('김선생 선생님 수업 2문제'));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'hotline', tutorId: 'kim', title: '🧑‍🏫 김선생 선생님 수업' });
    await fireEvent.press(screen.getByLabelText('주제 실황 수업 이차함수'));
    expect(onOpen).toHaveBeenLastCalledWith({ kind: 'topic_live', topicId: 12, title: '📝 이차함수' });
  });

  it('shows empty messages when a list fails or is empty', async () => {
    const fetchers = { fetchHotlineClasses: jest.fn(async () => Promise.reject(new Error('down'))), fetchTopicLiveClasses: jest.fn(async () => []) };
    await render(<LiveClassListPanel fetchers={fetchers} onOpen={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('오늘 진행 중인 선생님 수업이 없습니다.')).toBeTruthy());
    expect(screen.getByText('오늘 예정된 주제 실황 수업이 없습니다.')).toBeTruthy();
  });
});

describe('hotline problem list updates', () => {
  const source: ProblemSource = { kind: 'hotline', tutorId: 'kim', title: '김선생 수업' };
  const p = (id: number) => ({ sourceType: 'UNIT', sourceId: id, image: `https://img/${id}.png` });

  it('ProblemListPanel refetches in place when subscribe signals a change, and unsubscribes on unmount', async () => {
    let notify = () => {};
    const unsubscribe = jest.fn();
    const fetchProblems = jest
      .fn()
      .mockResolvedValueOnce({ title: '김선생 수업', problems: [p(1)] })
      .mockResolvedValueOnce({ title: '김선생 수업', problems: [p(1), p(2)] });
    const fetchers: ProblemListFetchers = {
      fetchProblems,
      subscribe: jest.fn((_s, onChange) => {
        notify = onChange;
        return unsubscribe;
      }),
    };
    const view = await render(<ProblemListPanel fetchers={fetchers} source={source} onSelectProblem={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('1번')).toBeTruthy());
    expect(screen.queryByText('2번')).toBeNull();

    await act(async () => notify());
    await waitFor(() => expect(screen.getByText('2번')).toBeTruthy());
    expect(fetchers.subscribe).toHaveBeenCalledWith(source, expect.any(Function));

    await view.unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('adapter fetches tutor units and only reacts to { action: "units" } guides', async () => {
    let next: (v: unknown) => void = () => {};
    const unsubscribe = jest.fn();
    const client = {
      query: jest.fn(async () => ({ data: { onlineClassOfTutor: { units: [{ sourceType: 'UNIT', sourceId: '5' }] } } })),
      subscribe: jest.fn(() => ({ subscribe: (o: { next: typeof next }) => ((next = o.next), { unsubscribe }) })),
    } as any;
    const fetchers = createProblemListFetchers(client);

    const set = await fetchers.fetchProblems(source);
    expect(client.query).toHaveBeenCalledWith(expect.objectContaining({ variables: { tutorId: 'kim' } }));
    expect(set.problems).toEqual([expect.objectContaining({ sourceType: 'UNIT', sourceId: 5 })]);

    const onChange = jest.fn();
    const stop = fetchers.subscribe!(source, onChange);
    expect(client.subscribe).toHaveBeenCalledWith(expect.objectContaining({ variables: { tutorId: 'kim' } }));
    next({ data: { newOnlineClassMessage: { content: JSON.stringify({ action: 'synch' }) } } });
    next({ data: { newOnlineClassMessage: { content: 'not json' } } });
    expect(onChange).not.toHaveBeenCalled();
    next({ data: { newOnlineClassMessage: { content: JSON.stringify({ action: 'units' }) } } });
    expect(onChange).toHaveBeenCalledTimes(1);
    stop?.();
    expect(unsubscribe).toHaveBeenCalled();

    // 바뀌지 않는 출처는 구독하지 않는다
    expect(fetchers.subscribe!({ kind: 'topic_live', topicId: 1, title: 't' }, onChange)).toBeUndefined();
  });
});
