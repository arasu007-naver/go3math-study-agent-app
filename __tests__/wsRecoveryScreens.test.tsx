import { act, render, waitFor } from '@testing-library/react-native';

const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) };
let mockParams: Record<string, string> = {};
let mockFocused = true;
jest.mock('expo-router', () => ({ get router() { return mockRouter; }, Redirect: () => null, useLocalSearchParams: () => mockParams }));
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => mockFocused }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('@gorhom/bottom-sheet', () => ({}));
jest.mock('../src/kit/canvas/CanvasStudySheet', () => ({ CanvasStudySheet: () => null }));
jest.mock('../src/kit/canvas/CanvasAnswer', () => ({ CanvasAnswer: () => null }));
jest.mock('../src/kit/ui/image-dynamic-dims', () => () => null);
jest.mock('../src/adapters/ensureTask', () => ({ ensureTaskId: jest.fn(), findLiveClassTaskId: jest.fn(async () => 0) }));
jest.mock('../src/adapters/problemListFetchers', () => ({ fetchConcept: jest.fn() }));
jest.mock('../src/host/useSolveFinished', () => ({ useSolveFinished: () => ({ countSolved: jest.fn(), markActed: jest.fn() }) }));
jest.mock('../src/host/widgets', () => ({ topicLiveSpec: () => ({}), hotlineSpec: () => ({}) }));
jest.mock('../src/kit/live-class/QuizResponseModal', () => ({ __esModule: true, default: ({ quiz }: any) => (quiz ? require('react').createElement(require('react-native').Text, null, 'QUIZ') : null) }));
const mockPanel = { onReceiveGuide: jest.fn(), getCurrentScript: jest.fn() };
jest.mock('../src/kit/canvas/note-canvas/topic-live-canvas', () => {
  const React = require('react');
  return { __esModule: true, default: (props: any) => (React.useImperativeHandle(props.ref, () => mockPanel), null) };
});
jest.mock('../src/kit/canvas/note-canvas/hotline-class-canvas', () => {
  const React = require('react');
  return { __esModule: true, default: (props: any) => (React.useImperativeHandle(props.ref, () => mockPanel), null) };
});
jest.mock('../src/kit/canvas/note-canvas/legacy', () => ({ storage: { set: jest.fn(), remove: jest.fn() } }));
const mockListeners = new Set<() => void>();
jest.mock('../src/api/graphql/client', () => ({
  onWsReconnected: (l: () => void) => {
    mockListeners.add(l);
    return () => mockListeners.delete(l);
  },
}));

let mockQueries: Record<string, any> = {};
jest.mock('@apollo/client/react', () => ({
  useMutation: () => [require('react').useCallback(() => {}, [])],
  useLazyQuery: (doc: any) => {
    const React = require('react');
    return [React.useCallback((opts: any) => mockQueries[doc.__name](opts), [doc])];
  },
  useSubscription: () => undefined,
}));
jest.mock('../src/api/graphql/queries', () => ({
  STUDY_TOPIC: { __name: 'STUDY_TOPIC' },
  LAST_LIVE_TOPIC_MESSAGE: { __name: 'LAST_LIVE_TOPIC_MESSAGE' },
  ONLINE_CLASS_OF_TUTOR: { __name: 'ONLINE_CLASS_OF_TUTOR' },
  LAST_ONLINE_CLASS_MESSAGE: { __name: 'LAST_ONLINE_CLASS_MESSAGE' },
}));
jest.mock('../src/api/graphql/mutations', () => ({ CREATE_RECORD: { __name: 'CREATE_RECORD' } }));
jest.mock('../src/api/graphql/subscriptions', () => ({
  TOPIC_LIVE_MESSAGE_ADDED: { __name: 'TOPIC_LIVE_MESSAGE_ADDED' },
  ONLINE_TUTOR_CLASS_MESSAGE_ADDED: { __name: 'ONLINE_TUTOR_CLASS_MESSAGE_ADDED' },
}));
jest.mock('../src/kit/live-class/LiveClassStartTime', () => ({ __esModule: true, default: () => null }));

import TopicLiveClassScreen from '../app/topic-live-class';
import HotlineClassScreen from '../app/hotline-class';
import { storage } from '../src/kit/canvas/note-canvas/legacy';

const unit = { sourceType: 'UNIT', sourceId: 1, scripts: [{ id: 12 }] };
const msg = (key: string, g: object | null) => ({ data: { [key]: g ? { content: JSON.stringify(g) } : null } });
const emit = () => act(async () => { mockListeners.forEach((l) => l()); await new Promise((r) => setTimeout(r, 20)); });

const cases = [
  { name: 'TopicLiveClassScreen', Screen: TopicLiveClassScreen, last: 'LAST_LIVE_TOPIC_MESSAGE', key: 'lastLiveTopicMessage', list: 'STUDY_TOPIC', listData: { topicForStudy: { units: [unit] } } },
  { name: 'HotlineClassScreen', Screen: HotlineClassScreen, last: 'LAST_ONLINE_CLASS_MESSAGE', key: 'lastOnlineClassMessage', list: 'ONLINE_CLASS_OF_TUTOR', listData: { onlineClassOfTutor: { units: [unit] } } },
];

describe.each(cases)('$name 재연결 따라잡기', ({ Screen, last, key, list, listData }) => {
  const initial = { action: 'refresh', scriptId: 12, studyIdx: 1, step: 'a' };
  const setup = async (next: () => Promise<any>) => {
    let calls = 0;
    mockQueries = {
      [list]: async () => ({ data: listData }),
      [last]: jest.fn(async () => (calls++ === 0 ? { data: msg(key, initial).data } : next())),
    };
    await render(<Screen />);
    await waitFor(() => expect(mockPanel.onReceiveGuide).toHaveBeenCalledTimes(1));
    mockPanel.onReceiveGuide.mockClear();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockListeners.clear();
    mockFocused = true;
    mockParams = { topicId: '5', tutorId: 'kim' };
  });

  it('위치가 달라지면 onReceiveGuide를 한 번 호출한다', async () => {
    const g = { action: 'refresh', scriptId: 12, studyIdx: 2, step: 'b' };
    await setup(async () => msg(key, g));
    await emit();
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledTimes(1);
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g);
  });

  it('위치가 같으면 호출하지 않는다', async () => {
    await setup(async () => msg(key, initial));
    await emit();
    expect(mockPanel.onReceiveGuide).not.toHaveBeenCalled();
  });

  it('snapshot이면 호출하지 않는다', async () => {
    await setup(async () => msg(key, { action: 'snapshot', scriptId: 12, studyIdx: 9, step: 'z' }));
    await emit();
    expect(mockPanel.onReceiveGuide).not.toHaveBeenCalled();
  });

  it('quiz는 모달 없이 refresh 위치 guide로 적용한다', async () => {
    await setup(async () => msg(key, { action: 'quiz', quizId: 3, quiz: 'q', scriptId: 12, studyIdx: 5, step: 'c' }));
    await emit();
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith({ action: 'refresh', scriptId: 12, studyIdx: 5, step: 'c' });
    expect(require('@testing-library/react-native').screen.queryByText('QUIZ')).toBeNull();
  });

  it('조회가 실패해도 뒤로 이동하지 않고 토스트도 없다', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await setup(async () => Promise.reject(new Error('down')));
    await emit();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(require('@testing-library/react-native').screen.queryByText('주제 실황 강의가 준비되지 않았습니다')).toBeNull();
    expect(mockPanel.onReceiveGuide).not.toHaveBeenCalled();
  });

  it('포커스를 잃으면 listener를 등록하지 않는다', async () => {
    mockQueries = { [list]: async () => ({ data: listData }), [last]: jest.fn(async () => msg(key, initial)) };
    mockFocused = false;
    await render(<Screen />);
    expect(mockListeners.size).toBe(0);
    await emit();
    expect(mockQueries[last]).not.toHaveBeenCalled();
    expect(storage.set).not.toHaveBeenCalled();
  });
});
