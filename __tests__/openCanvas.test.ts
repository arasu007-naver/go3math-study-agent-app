import { router } from 'expo-router';
import { notebookArgs, openHotlineClass, openNotebook, openTopicLiveClass, topicSpec } from '../src/host/widgets';
import { solveStore } from '../src/state/solve';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
const mockMutate = jest.fn();
jest.mock('../src/state/bootstrap', () => ({ apolloClient: { mutate: (...a: unknown[]) => mockMutate(...a) } }));
jest.mock('../src/agent/useAgentSession', () => ({ getAgentSession: () => ({ emit: jest.fn() }) }));

const push = router.push as jest.Mock;
const problems = [{ sourceType: 'exam', sourceId: 1, image: '' }];

beforeEach(() => {
  jest.clearAllMocks();
  solveStore.dispatch(null);
});

// task(study)는 캔버스에 들어올 때가 아니라 첫 풀이를 올릴 때 만든다 — 여는 쪽은 유형(spec)만 넘긴다
describe('open* canvas', () => {
  it('openNotebook opens without creating a task and hands the spec to the canvas', () => {
    const spec = topicSpec(102);
    openNotebook('t', problems, 0, undefined, 102, spec);
    expect(mockMutate).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/notebook');
    expect(solveStore.getState()).toMatchObject({ title: 't', taskId: undefined, topicId: 102, spec });
  });

  it('openNotebook keeps an existing taskId', () => {
    openNotebook('u', problems, 0, 9);
    expect(mockMutate).not.toHaveBeenCalled();
    expect(solveStore.getState()).toMatchObject({ taskId: 9 });
  });

  it('live class canvases open without creating a task', () => {
    openTopicLiveClass(101);
    openHotlineClass('tutor1');
    expect(mockMutate).not.toHaveBeenCalled();
    expect(push).toHaveBeenNthCalledWith(1, { pathname: '/topic-live-class', params: { topicId: '101' } });
    expect(push).toHaveBeenNthCalledWith(2, { pathname: '/hotline-class', params: { tutorId: 'tutor1' } });
  });

  it('search results carry their task type to the canvas', () => {
    expect(notebookArgs({ kind: 'exam_query', query: { major: 1 }, title: '' } as never, problems)[2]).toMatchObject({ taskType: 'selection' });
    expect(notebookArgs({ kind: 'bookmarks', title: '' } as never, problems)[2]).toMatchObject({ taskType: 'bookmark' });
    expect(notebookArgs({ kind: 'topic_live', topicId: 3, title: '' }, problems)[2]).toEqual({ taskType: 'topic-live', task: { topicId: 3 } });
    expect(topicSpec(3)).toEqual({ taskType: 'topic', task: { topicId: 3 } });
    expect(notebookArgs({ kind: 'hotline', tutorId: 't', title: '' }, problems)[2]).toEqual({ taskType: 'hotline', task: { tutorId: 't' } });
  });
});
