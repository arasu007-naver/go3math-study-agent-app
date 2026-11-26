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
jest.mock('../src/host/useSolveFinished', () => ({ useSolveFinished: () => ({ countSolved: jest.fn(), markActed: jest.fn() }) }));
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
  ['hotline', HotlineClassScreen, 'ONLINE_TUTOR_CLASS_MESSAGE_ADDED', { action: 'LIVE_CLASS_CLOSED', tutorId: 't1' }],
  ['topic', TopicLiveClassScreen, 'TOPIC_LIVE_MESSAGE_ADDED', { action: 'LIVE_CLASS_CLOSED', topicId: 5 }],
])('%s 종료 모달', (_n, Screen: any, sub, closed) => {
  let view: any;
  const open = async () => {
    view = render(<Screen />);
    await waitFor(() => expect(mockSubs[sub]).toBeTruthy());
    await act(async () => mockSubs[sub].onData(msg(closed)));
  };

  it('모달 표시, 버튼 하나, 패널 guide 미전달, 중복 수신해도 하나', async () => {
    await open();
    mockPanel.onReceiveGuide.mockClear();
    await act(async () => mockSubs[sub].onData(msg(closed)));
    expect(screen.getAllByText('수업이 종료되었습니다')).toHaveLength(1);
    expect(screen.getAllByText('확인')).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: '확인' })).toHaveLength(1);
    expect(mockPanel.onReceiveGuide).not.toHaveBeenCalledWith(expect.objectContaining({ action: 'LIVE_CLASS_CLOSED' }));
  });

  it('퀴즈 모달이 닫힌다', async () => {
    render(<Screen />);
    await waitFor(() => expect(mockSubs[sub]).toBeTruthy());
    await act(async () => mockSubs[sub].onData(msg({ action: 'quiz', quizId: 1, quiz: 'q' })));
    expect(screen.getByText('QUIZ')).toBeTruthy();
    await act(async () => mockSubs[sub].onData(msg(closed)));
    expect(screen.queryByText('QUIZ')).toBeNull();
    expect(screen.getByText('수업이 종료되었습니다')).toBeTruthy();
  });

  it('확인 → 닫힘 + back / replace', async () => {
    await open();
    await fireEvent.press(screen.getByText('확인'));
    expect(screen.queryByText('수업이 종료되었습니다')).toBeNull();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    await act(async () => mockSubs[sub].onData(msg(closed)));
    mockRouter.canGoBack.mockReturnValueOnce(false);
    await fireEvent.press(screen.getByText('확인'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('onRequestClose는 확인과 같다', async () => {
    await open();
    const find = (n: any): any => (!n || typeof n === 'string' ? null : n.props?.onRequestClose ? n : [].concat(n.children ?? n).map(find).find(Boolean));
    const modal = find(screen.toJSON());
    expect(modal.props.transparent).toBe(true);
    await act(async () => modal.props.onRequestClose());
    expect(screen.queryByText('수업이 종료되었습니다')).toBeNull();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
