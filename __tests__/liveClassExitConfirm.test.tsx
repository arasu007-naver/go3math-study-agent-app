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
let mockPanelProps: any = {};
let mockNoPanel = false;
const mockPanel = { onReceiveGuide: jest.fn(), getCurrentScript: jest.fn() };
jest.mock('../src/kit/canvas/note-canvas/topic-live-canvas', () => {
  const React = require('react');
  return { __esModule: true, default: (props: any) => ((mockPanelProps = props), React.useImperativeHandle(props.ref, () => (mockNoPanel ? null : mockPanel)), null) };
});
jest.mock('../src/kit/canvas/note-canvas/hotline-class-canvas', () => {
  const React = require('react');
  return { __esModule: true, default: (props: any) => ((mockPanelProps = props), React.useImperativeHandle(props.ref, () => (mockNoPanel ? null : mockPanel)), null) };
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

import TopicLiveClassScreen from '../app/topic-live-class';
import HotlineClassScreen from '../app/hotline-class';

const unit = { sourceType: 'UNIT', sourceId: 1, scripts: [{ id: 12 }] };
const guide = { scriptId: 12, studyIdx: 3, step: 'main' };
const CONFIRM = '수업 진행 중입니다. 나가시겠습니까?';

beforeEach(() => {
  jest.clearAllMocks();
  mockRouter.canGoBack.mockReturnValue(true);
  mockParams = { topicId: '5', tutorId: 'kim' };
});

const exitAction = () => mockPanelProps.screenActions.find((a: any) => a.id === 'exit');

const cases = [
  {
    name: 'TopicLiveClassScreen',
    Screen: TopicLiveClassScreen,
    live: () => {
      mockQueries = {
        STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [unit] } } }),
        LAST_LIVE_TOPIC_MESSAGE: async () => ({ data: { lastLiveTopicMessage: { content: JSON.stringify(guide) } } }),
      };
    },
    waiting: () => {
      mockQueries = {
        STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [unit] } } }),
        LAST_LIVE_TOPIC_MESSAGE: async () => ({ data: { lastLiveTopicMessage: null } }),
      };
    },
    checking: () => {
      mockQueries = { STUDY_TOPIC: () => new Promise(() => {}), LAST_LIVE_TOPIC_MESSAGE: async () => ({}) };
    },
  },
  {
    name: 'HotlineClassScreen',
    Screen: HotlineClassScreen,
    live: () => {
      mockQueries = {
        ONLINE_CLASS_OF_TUTOR: async () => ({ data: { onlineClassOfTutor: { units: [unit] } } }),
        LAST_ONLINE_CLASS_MESSAGE: async () => ({ data: { lastOnlineClassMessage: { content: JSON.stringify(guide) } } }),
      };
    },
    waiting: () => {
      mockQueries = {
        ONLINE_CLASS_OF_TUTOR: async () => ({ data: { onlineClassOfTutor: { units: [unit] } } }),
        LAST_ONLINE_CLASS_MESSAGE: async () => ({ data: { lastOnlineClassMessage: null } }),
      };
    },
    checking: () => {
      mockQueries = { ONLINE_CLASS_OF_TUTOR: () => new Promise(() => {}), LAST_ONLINE_CLASS_MESSAGE: async () => ({}) };
    },
  },
];

describe.each(cases)('$name 나가기 확인', ({ Screen, live, waiting, checking }) => {
  const enterLive = async () => {
    live();
    await render(<Screen />);
    await waitFor(() => expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(guide));
    await act(async () => {});
  };

  it('처음에는 확인 문구가 없다', async () => {
    await enterLive();
    expect(screen.queryByText(CONFIRM)).toBeNull();
  });

  it('live에서 exit → 확인 문구, 나가지 않음', async () => {
    await enterLive();
    await act(async () => exitAction().onPress());
    expect(screen.getByText(CONFIRM)).toBeTruthy();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('예 → back, 뒤로 갈 수 없으면 replace("/"), 문구 사라짐', async () => {
    await enterLive();
    await act(async () => exitAction().onPress());
    await fireEvent.press(screen.getByText('예'));
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(CONFIRM)).toBeNull();
    mockRouter.canGoBack.mockReturnValue(false);
    await act(async () => exitAction().onPress());
    await fireEvent.press(screen.getByText('예'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    expect(screen.queryByText(CONFIRM)).toBeNull();
  });

  it('아니오 → 문구만 사라지고 나가지 않음', async () => {
    await enterLive();
    await act(async () => exitAction().onPress());
    await fireEvent.press(screen.getByText('아니오'));
    expect(screen.queryByText(CONFIRM)).toBeNull();
    expect(mockRouter.back).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('waiting: 툴바 exit은 확인 없이 바로 나간다', async () => {
    waiting();
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
    await act(async () => exitAction().onPress());
    expect(screen.queryByText(CONFIRM)).toBeNull();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
    mockRouter.canGoBack.mockReturnValue(false);
    await act(async () => exitAction().onPress());
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });

  it('checking: 툴바 exit은 확인 없이 바로 나간다', async () => {
    checking();
    await render(<Screen />);
    await waitFor(() => expect(mockPanelProps.screenActions).toBeTruthy());
    await act(async () => exitAction().onPress());
    expect(screen.queryByText(CONFIRM)).toBeNull();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });

  it('대기 화면의 나가기는 확인 없이 바로 나간다', async () => {
    waiting();
    await render(<Screen />);
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('나가기'));
    expect(screen.queryByText(CONFIRM)).toBeNull();
    expect(mockRouter.back).toHaveBeenCalledTimes(1);
  });
});
