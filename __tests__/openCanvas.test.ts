import { router } from 'expo-router';
import { openNotebook, openTopicLiveClass, topicLiveSpec } from '../src/host/widgets';
import { solveStore } from '../src/state/solve';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
const mockMutate = jest.fn();
jest.mock('../src/state/bootstrap', () => ({ apolloClient: { mutate: (...a: unknown[]) => mockMutate(...a) } }));
const mockEmit = jest.fn();
jest.mock('../src/agent/useAgentSession', () => ({ getAgentSession: () => ({ emit: mockEmit }) }));

const push = router.push as jest.Mock;
const problems = [{ sourceType: 'exam', sourceId: 1, image: '' }];

beforeEach(() => {
  jest.clearAllMocks();
  solveStore.dispatch(null);
});
afterEach(() => jest.useRealTimers());

describe('open* canvas', () => {
  it('times out after 2500ms and still opens / navigates', async () => {
    jest.useFakeTimers();
    let resolve!: (v: unknown) => void;
    mockMutate.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    const done = openTopicLiveClass(101, undefined, topicLiveSpec(101));
    await jest.advanceTimersByTimeAsync(2499);
    expect(push).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    await done;
    expect(push).toHaveBeenCalledWith({ pathname: '/topic-live-class', params: { topicId: '101' } });
    expect(mockEmit).toHaveBeenCalledWith('client_error', expect.objectContaining({ where: 'study_note.ensure_task_timeout' }));
    // 늦게 온 성공도 캐시에 들어가 다음 열기는 task를 다시 만들지 않는다
    resolve({ data: { createTask: { id: 55 } } });
    await jest.advanceTimersByTimeAsync(0);
    await openTopicLiveClass(101, undefined, topicLiveSpec(101));
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenLastCalledWith({ pathname: '/topic-live-class', params: { topicId: '101', taskId: '55' } });
  });

  it('second open while the first is pending is ignored (router.push called once)', async () => {
    let resolve!: (v: unknown) => void;
    mockMutate.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    const first = openNotebook('t', problems, 0, undefined, 102, topicLiveSpec(102));
    const second = openTopicLiveClass(103, undefined, topicLiveSpec(103));
    resolve({ data: { createTask: { id: 7 } } });
    await Promise.all([first, second]);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/notebook');
    expect(mockMutate).toHaveBeenCalledTimes(1);
    expect(solveStore.getState()).toMatchObject({ title: 't', taskId: 7, topicId: 102 });
    // 끝나면 가드가 풀린다
    await openNotebook('u', problems, 0, 9);
    expect(push).toHaveBeenCalledTimes(2);
  });

  it('openNotebook still navigates when task creation fails', async () => {
    mockMutate.mockRejectedValueOnce(new Error('network'));
    await openNotebook('t', problems, 0, undefined, 104, topicLiveSpec(104));
    expect(push).toHaveBeenCalledWith('/notebook');
    expect(solveStore.getState()).toMatchObject({ title: 't', taskId: undefined });
    expect(mockEmit).toHaveBeenCalledWith('client_error', expect.objectContaining({ where: 'study_note.ensure_task' }));
  });
});
