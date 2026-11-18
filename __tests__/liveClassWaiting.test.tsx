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

import TopicLiveClassScreen from '../app/topic-live-class';
import HotlineClassScreen from '../app/hotline-class';
import { storage } from '../src/kit/canvas/note-canvas/legacy';

const unit = { sourceType: 'UNIT', sourceId: 1, scripts: [{ id: 12 }] };
const guideMsg = (g: object) => ({ data: { data: { liveTopicClassMessage: { content: JSON.stringify(g) }, newOnlineClassMessage: { content: JSON.stringify(g) } } } });

beforeEach(() => {
  jest.clearAllMocks();
  mockNoPanel = false;
  mockParams = { topicId: '5', tutorId: 'kim' };
});

describe('TopicLiveClassScreen', () => {
  const setup = (last: any) => {
    mockQueries = {
      STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [unit] } } }),
      LAST_LIVE_TOPIC_MESSAGE: jest.fn(async () => last),
    };
    return render(<TopicLiveClassScreen />);
  };

  it.each([[{ data: { lastLiveTopicMessage: null } }], [{ data: { lastLiveTopicMessage: { content: '' } } }], [{ data: { lastLiveTopicMessage: { content: 'abc' } } }]])(
    'last message 없음 → 대기 화면',
    async (last) => {
      await setup(last);
      await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
      expect(screen.getByText('수업 준비 중입니다')).toBeTruthy();
      expect(screen.getByLabelText('불러오는 중')).toBeTruthy();
      expect(mockSubs.TOPIC_LIVE_MESSAGE_ADDED.skip).toBe(false);
      expect(mockSubs.TOPIC_LIVE_MESSAGE_ADDED.variables).toEqual({ topicId: 5 });
    },
  );

  it('last message 있음 → 대기 화면 없이 guide 전달', async () => {
    const g = { scriptId: 12, studyIdx: 3, step: 'main' };
    await setup({ data: { lastLiveTopicMessage: { content: JSON.stringify(g) } } });
    await waitFor(() => expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g));
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
  });

  it('문제 0개 → 대기 화면, 토스트 없음, 구독 유지, 이후 progress guide → live', async () => {
    mockQueries = { STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [] } } }), LAST_LIVE_TOPIC_MESSAGE: jest.fn(async () => ({ data: {} })) };
    render(<TopicLiveClassScreen />);
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
    expect(screen.getByText('수업 준비 중입니다')).toBeTruthy();
    expect(screen.queryByText('주제 실황 강의가 준비되지 않았습니다')).toBeNull();
    expect(mockSubs.TOPIC_LIVE_MESSAGE_ADDED.skip).toBe(false);
    const g = { scriptId: 12, studyIdx: 0, step: 'main' };
    await act(async () => mockSubs.TOPIC_LIVE_MESSAGE_ADDED.onData(guideMsg(g)));
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g);
  });

  it('응답 전(checking)에는 대기 화면이 없다', async () => {
    await setup(new Promise(() => {}));
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
  });

  it('대기 중 구독 progress guide → live, quiz → 대기 유지', async () => {
    await setup({ data: { lastLiveTopicMessage: null } });
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
    await act(async () => mockSubs.TOPIC_LIVE_MESSAGE_ADDED.onData(guideMsg({ action: 'quiz', quizId: 1, quiz: 'q' })));
    expect(screen.getByTestId('live-class-waiting')).toBeTruthy();
    expect(screen.getByText('QUIZ')).toBeTruthy();
    const g = { scriptId: 12, studyIdx: 0, step: 'main' };
    await act(async () => mockSubs.TOPIC_LIVE_MESSAGE_ADDED.onData(guideMsg(g)));
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g);
  });

  it('이미 live에서 필기 따라가기 응답이 null이어도 대기 화면 없음', async () => {
    const g = { scriptId: 12, studyIdx: 3, step: 'main' };
    const lastFn = jest.fn<Promise<any>, []>(async () => ({ data: { lastLiveTopicMessage: { content: JSON.stringify(g) } } }));
    mockQueries = { STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [unit] } } }), LAST_LIVE_TOPIC_MESSAGE: lastFn };
    render(<TopicLiveClassScreen />);
    await waitFor(() => expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g));
    lastFn.mockImplementation(async () => ({ data: { lastLiveTopicMessage: null } }));
    const calls = lastFn.mock.calls.length;
    await act(async () => mockPanelProps.screenActions.find((a: any) => a.id === 'sync').onPress());
    expect(lastFn.mock.calls.length).toBe(calls + 1);
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
  });

  it('쿼리 실패 → 준비되지 않음 토스트, 대기 화면 없음', async () => {
    mockQueries = {
      STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [unit] } } }),
      LAST_LIVE_TOPIC_MESSAGE: async () => {
        throw new Error('x');
      },
    };
    render(<TopicLiveClassScreen />);
    await waitFor(() => expect(screen.getByText('주제 실황 강의가 준비되지 않았습니다')).toBeTruthy());
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
  });

  it('나가기', async () => {
    await setup({ data: { lastLiveTopicMessage: null } });
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('나가기'));
    expect(mockRouter.back).toHaveBeenCalled();
    mockRouter.canGoBack.mockReturnValueOnce(false);
    await fireEvent.press(screen.getByLabelText('나가기'));
    expect(mockRouter.replace).toHaveBeenCalledWith('/');
  });
});

describe('HotlineClassScreen', () => {
  const setup = (units: any[], last: any) => {
    mockQueries = {
      ONLINE_CLASS_OF_TUTOR: jest.fn(async () => ({ data: { onlineClassOfTutor: { units } } })),
      LAST_ONLINE_CLASS_MESSAGE: jest.fn(async () => last),
    };
    return render(<HotlineClassScreen />);
  };

  it('last message null → 대기 + 구독 활성', async () => {
    await setup([unit], { data: { lastOnlineClassMessage: null } });
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
    expect(mockSubs.ONLINE_TUTOR_CLASS_MESSAGE_ADDED.skip).toBe(false);
  });

  it('문제 0개 → 대기', async () => {
    await setup([], { data: {} });
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
  });

  it('last message 실패 → 대기', async () => {
    mockQueries = {
      ONLINE_CLASS_OF_TUTOR: async () => ({ data: { onlineClassOfTutor: { units: [unit] } } }),
      LAST_ONLINE_CLASS_MESSAGE: async () => {
        throw new Error('x');
      },
    };
    await render(<HotlineClassScreen />);
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
  });

  it('last message 있음 → 대기 없음', async () => {
    const g = { scriptId: 12, step: 'main' };
    await setup([unit], { data: { lastOnlineClassMessage: { content: JSON.stringify(g) } } });
    await waitFor(() => expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g));
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
  });

  it('대기 중 units는 loadAgenda만, progress guide는 live', async () => {
    await setup([unit], { data: { lastOnlineClassMessage: null } });
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
    const calls = mockQueries.ONLINE_CLASS_OF_TUTOR.mock.calls.length;
    await act(async () => mockSubs.ONLINE_TUTOR_CLASS_MESSAGE_ADDED.onData(guideMsg({ action: 'units' })));
    expect(mockQueries.ONLINE_CLASS_OF_TUTOR.mock.calls.length).toBe(calls + 1);
    expect(screen.getByTestId('live-class-waiting')).toBeTruthy();
    const g = { scriptId: 12, step: 'main' };
    await act(async () => mockSubs.ONLINE_TUTOR_CLASS_MESSAGE_ADDED.onData(guideMsg(g)));
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g);
  });
});

describe('CLASS_ON_AIR', () => {
  const g = { action: 'CLASS_ON_AIR', scriptId: 12, studyIdx: 0, step: 'main', sourceType: 'UNIT', sourceId: 1 };

  it('topic: 대기 → live, 퀴즈 모달 없이 패널로 전달', async () => {
    mockQueries = { STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [] } } }), LAST_LIVE_TOPIC_MESSAGE: jest.fn(async () => ({ data: {} })) };
    render(<TopicLiveClassScreen />);
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
    await act(async () => mockSubs.TOPIC_LIVE_MESSAGE_ADDED.onData(guideMsg(g)));
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
    expect(screen.queryByText('QUIZ')).toBeNull();
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledTimes(1);
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g);
    // setLastPoint(guide): 캔버스가 로드를 마치면 loaded()가 마지막 지점으로 CLASS_ON_AIR guide를 다시 넘긴다
    mockPanel.onReceiveGuide.mockClear();
    await act(async () => mockPanelProps.loaded());
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g);
    expect(mockPanelProps.initScript).toBe(12);
  });

  it('topic: 마지막 메시지가 CLASS_ON_AIR → live + 패널 전달', async () => {
    mockQueries = {
      STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [unit] } } }),
      LAST_LIVE_TOPIC_MESSAGE: async () => ({ data: { lastLiveTopicMessage: { content: JSON.stringify(g) } } }),
    };
    render(<TopicLiveClassScreen />);
    await waitFor(() => expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g));
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
    expect(screen.queryByText('QUIZ')).toBeNull();
  });

  it('topic: 패널이 아직 없으면 마지막 CLASS_ON_AIR를 syncPoint에 저장', async () => {
    mockNoPanel = true;
    mockQueries = {
      STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [unit] } } }),
      LAST_LIVE_TOPIC_MESSAGE: async () => ({ data: { lastLiveTopicMessage: { content: JSON.stringify(g) } } }),
    };
    render(<TopicLiveClassScreen />);
    await waitFor(() => expect(storage.set).toHaveBeenCalledWith('syncPoint', JSON.stringify(g)));
    expect(mockPanel.onReceiveGuide).not.toHaveBeenCalled();
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
  });

  it('hotline: 패널이 아직 없으면 마지막 CLASS_ON_AIR를 syncPoint에 저장', async () => {
    mockNoPanel = true;
    mockQueries = {
      ONLINE_CLASS_OF_TUTOR: async () => ({ data: { onlineClassOfTutor: { units: [unit] } } }),
      LAST_ONLINE_CLASS_MESSAGE: async () => ({ data: { lastOnlineClassMessage: { content: JSON.stringify(g) } } }),
    };
    render(<HotlineClassScreen />);
    await waitFor(() => expect(storage.set).toHaveBeenCalledWith('syncPoint', JSON.stringify(g)));
    expect(mockPanel.onReceiveGuide).not.toHaveBeenCalled();
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
  });

  it('hotline: 대기 → live, 패널로 한 번 전달', async () => {
    mockQueries = { ONLINE_CLASS_OF_TUTOR: async () => ({ data: { onlineClassOfTutor: { units: [] } } }), LAST_ONLINE_CLASS_MESSAGE: jest.fn(async () => ({ data: {} })) };
    render(<HotlineClassScreen />);
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
    await act(async () => mockSubs.ONLINE_TUTOR_CLASS_MESSAGE_ADDED.onData(guideMsg(g)));
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
    expect(screen.queryByText('QUIZ')).toBeNull();
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledTimes(1);
    expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g);
  });

  it('hotline: 마지막 메시지가 CLASS_ON_AIR → live + 패널 전달', async () => {
    mockQueries = {
      ONLINE_CLASS_OF_TUTOR: async () => ({ data: { onlineClassOfTutor: { units: [unit] } } }),
      LAST_ONLINE_CLASS_MESSAGE: async () => ({ data: { lastOnlineClassMessage: { content: JSON.stringify(g) } } }),
    };
    render(<HotlineClassScreen />);
    await waitFor(() => expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(g));
    expect(screen.queryByTestId('live-class-waiting')).toBeNull();
  });
});

describe('마지막 메시지가 quiz/imageQuiz → 위치 guide', () => {
  const quizMsg = (action: string) => ({ action, scriptId: 12, studyIdx: 3, step: 'main', quiz: 'Q', quizId: 9, imageUrl: 'u', conceptId: 1 });
  const pos = { action: 'refresh', scriptId: 12, studyIdx: 3, step: 'main' };

  it('hotline: imageQuiz → refresh 위치 guide, 퀴즈 모달 없음', async () => {
    mockQueries = {
      ONLINE_CLASS_OF_TUTOR: async () => ({ data: { onlineClassOfTutor: { units: [unit] } } }),
      LAST_ONLINE_CLASS_MESSAGE: async () => ({ data: { lastOnlineClassMessage: { content: JSON.stringify(quizMsg('imageQuiz')) } } }),
    };
    render(<HotlineClassScreen />);
    await waitFor(() => expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(pos));
    expect(screen.queryByText('QUIZ')).toBeNull();
  });

  it('hotline: 패널 없으면 syncPoint에 위치 guide 저장', async () => {
    mockNoPanel = true;
    mockQueries = {
      ONLINE_CLASS_OF_TUTOR: async () => ({ data: { onlineClassOfTutor: { units: [unit] } } }),
      LAST_ONLINE_CLASS_MESSAGE: async () => ({ data: { lastOnlineClassMessage: { content: JSON.stringify(quizMsg('imageQuiz')) } } }),
    };
    render(<HotlineClassScreen />);
    await waitFor(() => expect(storage.set).toHaveBeenCalledWith('syncPoint', JSON.stringify(pos)));
    expect(screen.queryByText('QUIZ')).toBeNull();
  });

  it('topic: quiz → refresh 위치 guide, 퀴즈 모달 없음', async () => {
    mockQueries = {
      STUDY_TOPIC: async () => ({ data: { topicForStudy: { units: [unit] } } }),
      LAST_LIVE_TOPIC_MESSAGE: async () => ({ data: { lastLiveTopicMessage: { content: JSON.stringify(quizMsg('quiz')) } } }),
    };
    render(<TopicLiveClassScreen />);
    await waitFor(() => expect(mockPanel.onReceiveGuide).toHaveBeenCalledWith(pos));
    expect(screen.queryByText('QUIZ')).toBeNull();
  });

  it('구독 quiz/imageQuiz → 퀴즈 모달만, 패널 onReceiveGuide 없음', async () => {
    mockQueries = { ONLINE_CLASS_OF_TUTOR: async () => ({ data: { onlineClassOfTutor: { units: [] } } }), LAST_ONLINE_CLASS_MESSAGE: async () => ({ data: {} }) };
    render(<HotlineClassScreen />);
    await waitFor(() => expect(screen.getByTestId('live-class-waiting')).toBeTruthy());
    await act(async () => mockSubs.ONLINE_TUTOR_CLASS_MESSAGE_ADDED.onData(guideMsg(quizMsg('quiz'))));
    expect(screen.getByText('QUIZ')).toBeTruthy();
    expect(mockPanel.onReceiveGuide).not.toHaveBeenCalled();
  });
});
