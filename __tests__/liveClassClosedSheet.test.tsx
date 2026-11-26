import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mockRouter = { back: jest.fn(), replace: jest.fn(), canGoBack: jest.fn(() => true) };
let mockParams: Record<string, string> = {};
jest.mock('expo-router', () => ({ get router() { return mockRouter; }, Redirect: () => null, useLocalSearchParams: () => mockParams }));
jest.mock('@react-navigation/native', () => ({ useIsFocused: () => true }));
jest.mock('react-native-safe-area-context', () => ({ SafeAreaView: require('react-native').View }));
jest.mock('@gorhom/bottom-sheet', () => ({}));
jest.mock('../src/kit/canvas/CanvasStudySheet', () => ({ CanvasStudySheet: () => null }));
jest.mock('../src/kit/canvas/CanvasAnswer', () => ({ CanvasAnswer: () => null }));
jest.mock('../src/kit/ui/image-dynamic-dims', () => () => null);
jest.mock('../src/adapters/ensureTask', () => ({ ensureTaskId: jest.fn(), findLiveClassTaskId: jest.fn(async () => 0) }));
jest.mock('../src/adapters/problemListFetchers', () => ({ fetchConcept: jest.fn() }));
const mockShow = jest.fn();
jest.mock('../src/agent/useAgentSession', () => ({ getAgentSession: () => ({ emit: jest.fn(), showLocalSheet: mockShow }) }));
jest.mock('../src/storage', () => ({ storage: { getString: () => undefined, set: jest.fn(), remove: jest.fn() } }));
jest.mock('../src/host/widgets', () => ({ topicLiveSpec: () => ({}), hotlineSpec: () => ({}) }));
jest.mock('../src/kit/live-class/QuizResponseModal', () => ({ __esModule: true, default: ({ quiz }: any) => (quiz ? require('react').createElement(require('react-native').Text, null, 'QUIZ') : null) }));
let mockNoPanel = false;
const mockPanel = { onReceiveGuide: jest.fn(), getCurrentScript: jest.fn() };
jest.mock('../src/kit/canvas/note-canvas/topic-live-canvas', () => {
  const React = require('react');
  return { __esModule: true, default: (props: any) => (React.useImperativeHandle(props.ref, () => (mockNoPanel ? null : mockPanel)), null) };
});
jest.mock('../src/kit/canvas/note-canvas/hotline-class-canvas', () => {
  const React = require('react');
  return { __esModule: true, default: (props: any) => (React.useImperativeHandle(props.ref, () => (mockNoPanel ? null : mockPanel)), null) };
});
jest.mock('../src/kit/canvas/note-canvas/legacy', () => ({ storage: { set: jest.fn(), remove: jest.fn() } }));

let mockQueries: Record<string, any> = {};
let mockSubs: Record<string, any> = {};
jest.mock('@apollo/client/react', () => ({
  useMutation: () => [require('react').useCallback(() => {}, [])],
  useLazyQuery: (doc: any) => {
    const React = require('react');
    return [React.useCallback((opts: any) => mockQueries[doc.__name](opts), [doc])];
  },
  useSubscription: (doc: any, opts: any) => void (mockSubs[doc.__name] = opts),
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
jest.mock('../src/kit/live-class/QuizResponseModal', () => ({ __esModule: true, default: ({ quiz }: any) => (quiz ? require('react').createElement(require('react-native').Text, null, 'QUIZ') : null) }));

import TopicLiveClassScreen from '../app/topic-live-class';
import HotlineClassScreen from '../app/hotline-class';
import { LIVE_CLASS_CLOSED } from '../src/kit/live-class/constants';

const unit = { sourceType: 'UNIT', sourceId: 1, scripts: [{ id: 12 }] };
const msg = (g: object) => ({ data: { data: { liveTopicClassMessage: { content: JSON.stringify(g) }, newOnlineClassMessage: { content: JSON.stringify(g) } } } });

beforeEach(() => {
  jest.clearAllMocks();
  mockNoPanel = false;
  (require('../src/adapters/ensureTask').ensureTaskId as jest.Mock).mockResolvedValue(11);
  mockParams = { topicId: '5', tutorId: 't1' };
  mockQueries = {
    STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [unit] } } }),
    LAST_LIVE_TOPIC_MESSAGE: async () => ({ data: {} }),
    ONLINE_CLASS_OF_TUTOR: async () => ({ data: { onlineClassOfTutor: { units: [unit] } } }),
    LAST_ONLINE_CLASS_MESSAGE: async () => ({ data: {} }),
  };
});

it('상수', () => expect(LIVE_CLASS_CLOSED).toBe('LIVE_CLASS_CLOSED'));

describe.each([
  ['hotline', HotlineClassScreen, 'ONLINE_TUTOR_CLASS_MESSAGE_ADDED', { action: 'LIVE_CLASS_CLOSED', tutorId: 't1' }, '선생님 실황 수업'],
  ['topic', TopicLiveClassScreen, 'TOPIC_LIVE_MESSAGE_ADDED', { action: 'LIVE_CLASS_CLOSED', topicId: 5 }, '주제 실황 수업'],
])('%s 종료 후 학습장 시트', (_n, Screen: any, sub, closed, title) => {
  const open = async () => {
    const view = render(<Screen />);
    await waitFor(() => expect(mockSubs[sub]).toBeTruthy());
    return view;
  };

  it('종료 수신 후 확인 → 언마운트하면 행동이 없어도 시트가 열린다', async () => {
    const view = await open();
    await act(async () => mockSubs[sub].onData(msg(closed)));
    await fireEvent.press(screen.getByText('확인'));
    await act(async () => view.unmount());
    await waitFor(() => expect(mockShow).toHaveBeenCalledTimes(1));
    expect(mockShow).toHaveBeenCalledWith('study_note', { taskId: 11, mode: 'live', title });
  });

  it('두 번 받아도 시트는 한 번만 열린다', async () => {
    const view = await open();
    await act(async () => mockSubs[sub].onData(msg(closed)));
    await act(async () => mockSubs[sub].onData(msg(closed)));
    await act(async () => view.unmount());
    await waitFor(() => expect(mockShow).toHaveBeenCalledTimes(1));
    await act(async () => {});
    expect(mockShow).toHaveBeenCalledTimes(1);
  });

  it('종료를 받지 않고 나가면 시트가 열리지 않는다', async () => {
    const view = await open();
    await act(async () => view.unmount());
    await act(async () => {});
    expect(mockShow).not.toHaveBeenCalled();
  });
});
