import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { initialRouterState, routeCommand } from '../src/agent/commandRouter';
import { createProblemListFetchers } from '../src/adapters/problemListFetchers';
import { getMemberMathPreExams, getUnitsOfMathCollection } from '../src/api/rest';
import { BookmarksPanel, ProblemListPanel, type ProblemListFetchers } from '../src/kit/problem-list/ProblemListPanel';
import { authStore } from '../src/state/auth';
import { colors } from '../src/ui/theme';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: (props: any) => <View testID="webview" {...props} /> };
});
jest.mock('../src/api/rest', () => ({ getMemberMathPreExams: jest.fn(), getUnitsOfMathCollection: jest.fn() }));
// Image.getSize는 jest-expo 목에서 동작하지 않아 이미지 크기 계산 컴포넌트를 비운다
jest.mock('../src/kit/ui/image-dynamic-dims', () => () => null);

const query = { queryType: 'selection', major: 'CALCULUS', years: [2026], months: [6], numbers: [21, 22], studyType: 'MATH_DETAILED_PRE_EXAMS' };
const remote = (ids: number[]) => ids.map((id) => ({ id, qPath: `https://img/${id}.png` }));

describe('problem_list command', () => {
  const cmd = (props: unknown) => ({ v: 1, id: 'c1', sessionId: 's', seq: 1, ts: 't', kind: 'show_component', payload: { componentId: 'problem_list', props } });

  it('accepts task and exam_query sources and rejects others', () => {
    expect(routeCommand(initialRouterState, cmd({ source: { kind: 'task', taskId: 7 } }), 'tablet').state.stage).toEqual({
      componentId: 'problem_list',
      props: { source: { kind: 'task', taskId: 7 } },
    });
    expect(routeCommand(initialRouterState, cmd({ source: { kind: 'exam_query', query } }), 'tablet').state.stage?.componentId).toBe('problem_list');
    expect(routeCommand(initialRouterState, cmd({ source: { kind: 'bookmarks' } }), 'tablet').state.stage?.componentId).toBe('problem_list');
    expect(routeCommand(initialRouterState, cmd({ source: { kind: 'ids', ids: [1] } }), 'tablet').ack?.payload).toMatchObject({ ok: false, code: 'invalid_props' });
  });
});

describe('problemListFetchers (legacy goNoteTab sources)', () => {
  const client = (task: unknown) => ({ query: jest.fn(async () => ({ data: { taskOfId: task } })) }) as any;

  beforeEach(() => authStore.dispatch({ type: 'RESTORE_TOKEN', item: { token: 'app-jwt' } }));
  afterEach(() => {
    authStore.dispatch({ type: 'SIGN_OUT' });
    jest.mocked(getMemberMathPreExams).mockReset();
    jest.mocked(getUnitsOfMathCollection).mockReset();
  });

  it('exam_query searches with the app token', async () => {
    jest.mocked(getMemberMathPreExams).mockResolvedValue({ data: { data: { result: remote([1, 2]) } } } as any);
    const set = await createProblemListFetchers(client(null)).fetchProblems({ kind: 'exam_query', query });
    expect(getMemberMathPreExams).toHaveBeenCalledWith('app-jwt', expect.objectContaining({ major: 'CALCULUS' }));
    expect(set.problems).toEqual([
      { sourceType: 'UNIT', sourceId: 1, image: 'https://img/1.png' },
      { sourceType: 'UNIT', sourceId: 2, image: 'https://img/2.png' },
    ]);
  });

  it('selection task searches with its stored query', async () => {
    jest.mocked(getMemberMathPreExams).mockResolvedValue({ data: { data: { result: remote([5]) } } } as any);
    const set = await createProblemListFetchers(client({ id: 3, taskType: 'selection', task: JSON.stringify(query), visitCnt: 1 })).fetchProblems({ kind: 'task', taskId: 3 });
    expect(getMemberMathPreExams).toHaveBeenCalledWith('app-jwt', expect.objectContaining({ numbers: [21, 22] }));
    expect(set).toMatchObject({ title: '📝 기출 검색', problems: [{ sourceId: 5 }] });
  });

  it('collection task loads the collection units', async () => {
    jest.mocked(getUnitsOfMathCollection).mockResolvedValue({ data: { data: { result: { units: remote([8, 9]) } } } } as any);
    const set = await createProblemListFetchers(client({ id: 4, taskType: 'collection', collectionId: '12', title: '극한 모음' })).fetchProblems({ kind: 'task', taskId: 4 });
    expect(getUnitsOfMathCollection).toHaveBeenCalledWith(12);
    expect(set.title).toBe('📝 극한 모음');
    expect(set.problems.map((p) => p.sourceId)).toEqual([8, 9]);
  });

  it('bookmark task uses its stored units', async () => {
    const task = { id: 6, taskType: 'bookmark', task: JSON.stringify({ regDate: '2026-10-01', units: [{ sourceType: 'PREMISE', sourceId: 33 }] }) };
    const set = await createProblemListFetchers(client(task)).fetchProblems({ kind: 'task', taskId: 6 });
    expect(set.problems).toEqual([{ sourceType: 'PREMISE', sourceId: 33, image: expect.stringMatching(/\/premise\/33\.png$/) }]);
  });

  it('bookmarks source loads my bookmarks (MY_BOOKMARKS)', async () => {
    const bookmarks = [{ sourceType: 'UNIT', sourceId: 51, image: 'https://img/51.png', essayId: null, tries: [] }];
    const c = { query: jest.fn(async () => ({ data: { bookmarks } })) } as any;
    const set = await createProblemListFetchers(c).fetchProblems({ kind: 'bookmarks' });
    expect(set).toEqual({ title: '🔖 내 책갈피', problems: [{ sourceType: 'UNIT', sourceId: 51, image: 'https://img/51.png' }] });
  });

  it('topic task loads the topic units by collectionId', async () => {
    const units = JSON.stringify([{ sourceType: 'UNIT', sourceId: 41 }, { sourceType: 'MATH_ESSAY', sourceId: 7 }]);
    const c = {
      query: jest.fn(async ({ variables }: any) =>
        variables.taskId ? { data: { taskOfId: { id: 9, taskType: 'topic', collectionId: '15', topicTitle: '수열' } } } : { data: { getUnitsInTopic: units } },
      ),
    } as any;
    const set = await createProblemListFetchers(c).fetchProblems({ kind: 'task', taskId: 9 });
    expect(c.query).toHaveBeenLastCalledWith(expect.objectContaining({ variables: { topicId: 15 } }));
    expect(set.title).toBe('📝 수열');
    expect(set.problems).toEqual([
      { sourceType: 'UNIT', sourceId: 41, image: expect.stringMatching(/41\.png$/) },
      { sourceType: 'MATH_ESSAY', sourceId: 7, image: expect.stringMatching(/7\.png$/) },
    ]);
  });

  it('fails without a token or for an unknown task', async () => {
    authStore.dispatch({ type: 'SIGN_OUT' });
    await expect(createProblemListFetchers(client(null)).fetchProblems({ kind: 'exam_query', query })).rejects.toThrow('로그인이 필요해요');
    await expect(createProblemListFetchers(client(null)).fetchProblems({ kind: 'task', taskId: 1 })).rejects.toThrow('학습 기록을 찾을 수 없어요');
  });
});

describe('ProblemListPanel', () => {
  it('shows numbered problem cards and reports the chosen one', async () => {
    const problems = [
      { sourceType: 'UNIT', sourceId: 1, image: 'https://img/1.png' },
      { sourceType: 'UNIT', sourceId: 2, image: 'https://img/2.png' },
    ];
    const fetchers: ProblemListFetchers = { fetchProblems: jest.fn(async () => ({ title: '📝 기출 검색', subtitle: '미적분 / 2026년', problems })) };
    const onSelectProblem = jest.fn();
    await render(<ProblemListPanel fetchers={fetchers} source={{ kind: 'task', taskId: 3 }} onSelectProblem={onSelectProblem} />);
    await waitFor(() => expect(screen.getByText('📝 기출 검색')).toBeTruthy());
    expect(screen.getByText('미적분 / 2026년')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('2번 문제'));
    expect(onSelectProblem).toHaveBeenCalledWith({ index: 1, problem: problems[1] });
  });

  it('shows the error message when loading fails', async () => {
    const fetchers: ProblemListFetchers = { fetchProblems: async () => { throw new Error('로그인이 필요해요'); } };
    await render(<ProblemListPanel fetchers={fetchers} source={{ kind: 'task', taskId: 3 }} onSelectProblem={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('문제를 불러오지 못했어요. (로그인이 필요해요)')).toBeTruthy());
  });
});

describe('ProblemListPanel pencil FAB', () => {
  const problems = [1, 2, 3].map((id) => ({ sourceType: 'UNIT', sourceId: id, image: `https://img/${id}.png` }));
  const fetchers: ProblemListFetchers = { fetchProblems: async () => ({ title: '📝 모음', problems }) };

  it('opens the canvas from the last chosen problem, else the first', async () => {
    const onSolve = jest.fn();
    await render(<ProblemListPanel fetchers={fetchers} source={{ kind: 'task', taskId: 1 }} onSelectProblem={jest.fn()} onSolve={onSolve} />);
    await waitFor(() => expect(screen.getByLabelText('문제 풀이 시작')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('문제 풀이 시작'));
    expect(onSolve).toHaveBeenLastCalledWith({ index: 0, set: { title: '📝 모음', problems } });
    await fireEvent.press(screen.getByLabelText('3번 문제'));
    await fireEvent.press(screen.getByLabelText('문제 풀이 시작'));
    expect(onSolve).toHaveBeenLastCalledWith({ index: 2, set: { title: '📝 모음', problems } });
  });

  it('has no FAB without onSolve', async () => {
    await render(<ProblemListPanel fetchers={fetchers} source={{ kind: 'task', taskId: 1 }} onSelectProblem={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('📝 모음')).toBeTruthy());
    expect(screen.queryByLabelText('문제 풀이 시작')).toBeNull();
  });
});

describe('ProblemListPanel selection border and buttons', () => {
  const problems = [
    { sourceType: 'UNIT', sourceId: 10, image: 'https://img/10.png' },
    { sourceType: 'UNIT', sourceId: 20, image: 'https://img/20.png' },
  ];

  it('selects the first item by default on entry and applies selected border', async () => {
    const fetchers: ProblemListFetchers = {
      fetchProblems: jest.fn(async () => ({ title: '📝 문제 목록', problems })),
    };
    await render(<ProblemListPanel fetchers={fetchers} source={{ kind: 'task', taskId: 1 }} onSelectProblem={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('📝 문제 목록')).toBeTruthy());

    const firstCard = screen.getByLabelText('1번 문제');
    const secondCard = screen.getByLabelText('2번 문제');

    expect(firstCard.props.accessibilityState.selected).toBe(true);
    expect(secondCard.props.accessibilityState.selected).toBe(false);

    // Verify cardOn style contains accent border
    const firstStyle = Array.isArray(firstCard.props.style) ? Object.assign({}, ...firstCard.props.style) : firstCard.props.style;
    expect(firstStyle.borderColor).toBe(colors.accent);
    expect(firstStyle.borderWidth).toBe(2);
  });

  it('renders "해답" and "책갈피" buttons on right for problem list and handles interactions', async () => {
    const addBookmark = jest.fn(async () => {});
    const fetchers: ProblemListFetchers = {
      fetchProblems: jest.fn(async () => ({ title: '📝 문제 목록', problems })),
      addBookmark,
    };
    const onSelectProblem = jest.fn();
    await render(<ProblemListPanel fetchers={fetchers} source={{ kind: 'task', taskId: 1 }} onSelectProblem={onSelectProblem} />);
    await waitFor(() => expect(screen.getByText('📝 문제 목록')).toBeTruthy());

    const answerButtons = screen.getAllByText('해답');
    const bookmarkButtons = screen.getAllByText('책갈피');
    expect(answerButtons.length).toBe(2);
    expect(bookmarkButtons.length).toBe(2);

    // 2번 '책갈피' -> 책갈피되고 2번이 현재 문제가 된다
    fireEvent.press(bookmarkButtons[1]);
    await waitFor(() => expect(addBookmark).toHaveBeenCalledWith('UNIT', 20));
    expect(onSelectProblem).toHaveBeenLastCalledWith({ index: 1, problem: problems[1] });
    expect(screen.getByLabelText('2번 문제').props.accessibilityState.selected).toBe(true);
    await new Promise((r) => setTimeout(r, 450));

    // Click bookmark button for 1st problem
    fireEvent.press(screen.getAllByText('책갈피')[0]);
    await waitFor(() => expect(addBookmark).toHaveBeenCalledWith('UNIT', 10));
    expect(screen.getAllByText('책갈피됨').length).toBe(2);
    expect(screen.getByLabelText('1번 문제').props.accessibilityState.selected).toBe(true);

    // 1번 '해답' -> 말풍선(WebView)이 뜨고 버튼은 '닫기', 문제 카드는 둘 다 그대로
    fireEvent.press(answerButtons[0]);
    await waitFor(() => expect(screen.getByText('닫기')).toBeTruthy());
    expect(screen.getByTestId('answer-bubble')).toBeTruthy();
    expect(screen.getByTestId('webview').props.source.uri).toContain('10');
    expect(screen.getByLabelText('1번 문제')).toBeTruthy();

    await new Promise((r) => setTimeout(r, 450));
    // 2번 '해답' -> 말풍선이 2번 문항으로 옮겨 간다(하나만 열린다)
    fireEvent.press(screen.getByText('해답'));
    await waitFor(() => expect(screen.getByTestId('webview').props.source.uri).toContain('20'));
    expect(screen.getAllByTestId('answer-bubble').length).toBe(1);
    // 해답을 연 문항이 현재 문제가 된다
    expect(onSelectProblem).toHaveBeenLastCalledWith({ index: 1, problem: problems[1] });
    expect(screen.getByLabelText('2번 문제').props.accessibilityState.selected).toBe(true);
    expect(screen.getByLabelText('1번 문제').props.accessibilityState.selected).toBe(false);

    await new Promise((r) => setTimeout(r, 450));
    // '닫기' -> 말풍선이 닫힌다
    fireEvent.press(screen.getByText('닫기'));
    await waitFor(() => expect(screen.queryByTestId('answer-bubble')).toBeNull());
    expect(screen.getAllByText('해답').length).toBe(2);
  });

  it('closes the answer bubble when another problem becomes the selected one (책갈피)', async () => {
    const fetchers: ProblemListFetchers = {
      fetchProblems: jest.fn(async () => ({ title: '📝 문제 목록', problems })),
      addBookmark: jest.fn(async () => {}),
    };
    await render(<ProblemListPanel fetchers={fetchers} source={{ kind: 'task', taskId: 1 }} onSelectProblem={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('📝 문제 목록')).toBeTruthy());

    fireEvent.press(screen.getAllByText('해답')[0]);
    await waitFor(() => expect(screen.getByTestId('answer-bubble')).toBeTruthy());

    // 2번 '책갈피' -> 2번이 현재 문제가 되므로 1번 해답 말풍선은 닫힌다
    fireEvent.press(screen.getAllByText('책갈피')[1]);
    await waitFor(() => expect(screen.getByLabelText('2번 문제').props.accessibilityState.selected).toBe(true));
    expect(screen.queryByTestId('answer-bubble')).toBeNull();
  });

  it('closes the answer bubble when a refetch puts a different problem at the selected place', async () => {
    let onChange = () => {};
    const fetchProblems = jest
      .fn()
      .mockResolvedValueOnce({ title: '수업', problems })
      .mockResolvedValueOnce({ title: '수업', problems: [problems[1]] });
    const fetchers: ProblemListFetchers = {
      fetchProblems,
      subscribe: (_src, cb) => {
        onChange = cb;
        return () => {};
      },
    };
    await render(<ProblemListPanel fetchers={fetchers} source={{ kind: 'hotline', tutorId: 't', title: '수업' }} onSelectProblem={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('수업')).toBeTruthy());

    fireEvent.press(screen.getAllByText('해답')[0]);
    await waitFor(() => expect(screen.getByTestId('answer-bubble')).toBeTruthy());

    // 선생님이 1번을 빼서 1번 자리에 다른 문제가 온다 -> 이전 해답 말풍선은 닫힌다
    onChange();
    await waitFor(() => expect(screen.queryByLabelText('2번 문제')).toBeNull());
    expect(screen.queryByTestId('answer-bubble')).toBeNull();
  });

  it('renders "해답" and "책갈피 해제" buttons on right for BookmarksPanel and handles removal', async () => {
    const removeBookmark = jest.fn(async () => {});
    const fetchers: ProblemListFetchers = {
      fetchProblems: jest.fn(async () => ({ title: '🔖 내 책갈피', problems })),
      removeBookmark,
    };
    const onSelectProblem = jest.fn();
    await render(<BookmarksPanel fetchers={fetchers} onSelectProblem={onSelectProblem} />);
    await waitFor(() => expect(screen.getByText('🔖 내 책갈피')).toBeTruthy());

    // First card selected by default in BookmarksPanel
    const firstCard = screen.getByLabelText('1번 문제');
    expect(firstCard.props.accessibilityState.selected).toBe(true);
    const firstStyle = Array.isArray(firstCard.props.style) ? Object.assign({}, ...firstCard.props.style) : firstCard.props.style;
    expect(firstStyle.borderColor).toBe(colors.accent);

    const answerButtons = screen.getAllByText('해답');
    const removeButtons = screen.getAllByText('책갈피 해제');
    expect(answerButtons.length).toBe(2);
    expect(removeButtons.length).toBe(2);

    // 2번 '책갈피 해제' -> 누른 문항이 현재 문제가 되고 책갈피가 풀린다
    fireEvent.press(removeButtons[1]);
    expect(onSelectProblem).toHaveBeenLastCalledWith({ index: 1, problem: problems[1] });
    await waitFor(() => expect(removeBookmark).toHaveBeenCalledWith('UNIT', 20));

    // After removal, only 1 problem remains
    await waitFor(() => expect(screen.queryByLabelText('2번 문제')).toBeNull());
    expect(screen.getByLabelText('1번 문제')).toBeTruthy();
  });
});
