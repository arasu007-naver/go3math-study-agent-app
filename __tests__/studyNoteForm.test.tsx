import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { StudyNoteForm } from '../src/kit/study-note/StudyNoteForm';
import { colors, layout } from '../src/ui/theme';

// 양식이 개념 제목을 정리하려고 MathJaxWrapper(cleanMathText)를 가져온다 — WebView 네이티브 모듈은 Jest에 없다
jest.mock('react-native-webview', () => ({ WebView: () => null }));

// 시트 밖에서 그리므로 gorhom 입력칸은 RN TextInput으로 바꾼다
// 스크롤 영역은 testID를 붙여 gorhom 스크롤 뷰를 쓰는지 확인한다
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { TextInput, ScrollView } = require('react-native');
  return {
    BottomSheetTextInput: TextInput,
    BottomSheetScrollView: (p: any) => React.createElement(ScrollView, { ...p, testID: 'sheet-scroll' }),
  };
});
import { appendActivity, emptyActivities, loadActivity, type Activities } from '../src/kit/study-note/activity';
import { draftKey } from '../src/kit/study-note/draft';
import type { StudyNote } from '../src/kit/study-note/model';
import type { StudyNoteFetchers } from '../src/kit/study-note/persist';
import type { KeyValueStore } from '../src/storage/types';

function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    getString: (k) => m.get(k),
    set: (k, v) => void m.set(k, v),
    remove: (k) => void m.delete(k),
  };
}

function setup(over: Partial<StudyNoteFetchers> = {}, props: Partial<React.ComponentProps<typeof StudyNoteForm>> = {}) {
  const fetchers: StudyNoteFetchers = {
    fetchNote: jest.fn(async (): Promise<StudyNote | null> => null),
    register: jest.fn(async () => {}),
    update: jest.fn(async () => {}),
    ...over,
  };
  const store = props.store ?? memoryStore();
  const onDone = jest.fn();
  const ui = (
    <StudyNoteForm taskId={7} mode="self" title="수열" fetchers={fetchers} store={store} onDone={onDone} {...props} />
  );
  return { fetchers, store, onDone, ui };
}

// 이전 학습장 조회가 끝나 스켈레톤이 양식으로 바뀔 때까지 기다린다
const settle = () => waitFor(() => expect(screen.getByText('얼마나 해냈나요?')).toBeTruthy());

describe('StudyNoteForm', () => {
  it('saves achievement and difficulty chips', async () => {
    const { fetchers, onDone, ui } = setup();
    await render(ui);
    await settle();
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('개념'));
    await fireEvent.press(screen.getByText('계산'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect(fetchers.register).toHaveBeenCalledWith(7, { achievementRate: 75, difficulties: 'concept,calc', description: '', expectations: '' });
  });

  it('save is disabled until something is entered', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    expect(screen.getByRole('button', { name: '저장' }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByText('조금'));
    expect(screen.getByRole('button', { name: '저장' }).props.accessibilityState.disabled).toBe(false);
  });

  it('chips expose radio/checkbox roles', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    expect(screen.getByRole('radio', { name: '거의' }).props.accessibilityState.checked).toBe(false);
    expect(screen.getByRole('checkbox', { name: '개념' }).props.accessibilityState.checked).toBe(false);
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('개념'));
    expect(screen.getByRole('radio', { name: '거의' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('checkbox', { name: '개념' }).props.accessibilityState.checked).toBe(true);
  });

  it('prefills an existing note and labels the button 수정', async () => {
    const note: StudyNote = { taskId: 7, description: '일반항', achievementRate: 50 };
    const { fetchers, onDone, ui } = setup({ fetchNote: jest.fn(async () => note) });
    await render(ui);
    await waitFor(() => expect(screen.getByDisplayValue('일반항')).toBeTruthy());
    expect(screen.getByRole('radio', { name: '절반' }).props.accessibilityState.checked).toBe(true);
    await fireEvent.press(screen.getByText('수정'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect(fetchers.update).toHaveBeenCalled();
    expect(fetchers.register).not.toHaveBeenCalled();
  });

  it('live mode shows tutor caption, no next-goal toggle and a short memo label', async () => {
    const { ui } = setup({}, { mode: 'live' });
    await render(ui);
    await settle();
    expect(screen.getByText('선생님 정리')).toBeTruthy();
    expect(screen.getByText('선생님 정리가 아직 없어요')).toBeTruthy();
    expect(screen.queryByText('▸ 다음 목표 (선택)')).toBeNull();
    expect(screen.getByText('한 줄 메모 (선택)')).toBeTruthy();
  });

  it('live mode shows the tutor description when present', async () => {
    const note: StudyNote = { taskId: 7, tutorDescription: '등차수열 정리' };
    const { ui } = setup({ fetchNote: jest.fn(async () => note) }, { mode: 'live' });
    await render(ui);
    await waitFor(() => expect(screen.getByText('등차수열 정리')).toBeTruthy());
    expect(screen.queryByText('선생님 정리가 아직 없어요')).toBeNull();
  });

  it('hint chip appends to description', async () => {
    const { ui } = setup({}, { topicHints: ['일반항'] });
    await render(ui);
    await settle();
    expect(screen.getByText('추천:')).toBeTruthy();
    await fireEvent.press(screen.getByText('일반항'));
    expect(screen.getByDisplayValue('일반항')).toBeTruthy();
    await fireEvent.press(screen.getByText('일반항'));
    expect(screen.getByDisplayValue('일반항 일반항')).toBeTruthy();
  });

  it('hides the hint row without hints', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    expect(screen.queryByText('추천:')).toBeNull();
  });

  it('caps the description at 200 characters', async () => {
    const { fetchers, ui } = setup();
    await render(ui);
    await settle();
    const input = screen.getByLabelText('공부한 내용');
    expect(input.props.maxLength).toBe(200);
    await fireEvent.changeText(input, 'a'.repeat(201));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(fetchers.register).toHaveBeenCalled());
    const saved = (fetchers.register as jest.Mock).mock.calls[0][1];
    expect(saved.description.length).toBeLessThanOrEqual(200);
  });

  it('keeps input and draft when saving fails', async () => {
    const store = memoryStore();
    const register = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(undefined);
    const { onDone, ui } = setup({ register }, { store });
    const view = await render(ui);
    await settle();
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(screen.getByText('저장하지 못했어요. 다시 시도해 주세요.')).toBeTruthy());
    expect(screen.getByText('다시 저장')).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    expect(store.getString(draftKey(7))).toBeTruthy();

    await view.unmount();
    await render(ui);
    await settle();
    expect(screen.getByRole('radio', { name: '거의' }).props.accessibilityState.checked).toBe(true);

    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect(store.getString(draftKey(7))).toBeUndefined();
  });

  it('fetch failure shows notice and empty form', async () => {
    const fetchNote = jest.fn(async (): Promise<StudyNote | null> => {
      throw new Error('net');
    });
    const { fetchers, onDone, ui } = setup({ fetchNote });
    await render(ui);
    await waitFor(() => expect(screen.getByText('이전 메모를 불러오지 못했어요')).toBeTruthy());
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(fetchNote).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onDone).not.toHaveBeenCalled());
    expect(fetchers.register).not.toHaveBeenCalled();
  });

  it('나중에 calls onDone dismissed without saving', async () => {
    const { fetchers, onDone, ui } = setup();
    await render(ui);
    await settle();
    await fireEvent.press(screen.getByText('나중에'));
    expect(onDone).toHaveBeenCalledWith('dismissed');
    expect(fetchers.register).not.toHaveBeenCalled();
    expect(fetchers.update).not.toHaveBeenCalled();
  });
});

describe('StudyNoteForm - 불러오는 중·저장 중', () => {
  const flat = (node: any) => StyleSheet.flatten(node.props.style);
  function deferred<T>() {
    let resolve!: (v: T) => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  }

  it('이전 학습장을 조회하는 동안은 양식 대신 스켈레톤을 보여 준다', async () => {
    const d = deferred<StudyNote | null>();
    const { ui } = setup({ fetchNote: jest.fn(() => d.promise) }, { topicHints: ['일반항'] });
    await render(ui);
    expect(screen.getByText('학습장 · 수열')).toBeTruthy();
    expect(screen.getByLabelText('불러오는 중')).toBeTruthy();
    expect(screen.queryByText('얼마나 해냈나요?')).toBeNull();
    expect(screen.queryByLabelText('공부한 내용')).toBeNull();
    expect(screen.queryByText('추천:')).toBeNull();
    expect(screen.getByRole('button', { name: '저장' }).props.accessibilityState).toMatchObject({ disabled: true, busy: false });

    await act(async () => d.resolve({ taskId: 7, description: '점화식', achievementRate: 50 }));
    await settle();
    expect(screen.queryByLabelText('불러오는 중')).toBeNull();
    expect(screen.getByDisplayValue('점화식')).toBeTruthy();
    expect(screen.getByRole('radio', { name: '절반' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('button', { name: '수정' })).toBeTruthy();
  });

  it('조회하는 동안에도 나중에로 닫을 수 있다', async () => {
    const d = deferred<StudyNote | null>();
    const { onDone, ui } = setup({ fetchNote: jest.fn(() => d.promise) });
    await render(ui);
    await fireEvent.press(screen.getByText('나중에'));
    expect(onDone).toHaveBeenCalledWith('dismissed');
  });

  it('조회에 실패하면 스켈레톤을 걷고 안내와 양식을 보여 준다', async () => {
    const d = deferred<StudyNote | null>();
    const { ui } = setup({ fetchNote: jest.fn(() => d.promise) });
    await render(ui);
    await act(async () => d.reject(new Error('net')));
    await settle();
    expect(screen.queryByLabelText('불러오는 중')).toBeNull();
    expect(screen.getByText('이전 메모를 불러오지 못했어요')).toBeTruthy();
  });

  it('초안이 있어도 조회가 끝난 뒤에 초안으로 연다', async () => {
    const store = memoryStore();
    store.set(draftKey(7), JSON.stringify({ achievement: 75, difficulties: [], description: '쓰던 글', expectations: '' }));
    const d = deferred<StudyNote | null>();
    const { ui } = setup({ fetchNote: jest.fn(() => d.promise) }, { store });
    await render(ui);
    expect(screen.getByLabelText('불러오는 중')).toBeTruthy();
    await act(async () => d.resolve({ taskId: 7, description: '서버 글' }));
    await settle();
    expect(screen.getByDisplayValue('쓰던 글')).toBeTruthy();
    expect(screen.getByRole('button', { name: '수정' })).toBeTruthy();
  });

  it('저장하는 동안 저장 버튼은 주요 버튼 색 그대로 로딩 표시를 보인다', async () => {
    const d = deferred<void>();
    const { onDone, ui } = setup({ register: jest.fn(() => d.promise) });
    await render(ui);
    await settle();
    await fireEvent.press(screen.getByText('거의'));
    // 누름은 저장이 끝날 때까지 끝나지 않는다 — 기다리지 않고 저장 중 상태를 본다
    const pressing = fireEvent.press(screen.getByText('저장'));
    const button = () => screen.getByRole('button', { name: '저장' });
    await waitFor(() => expect(button().props.accessibilityState).toMatchObject({ busy: true }));
    expect(flat(button())).toMatchObject({ backgroundColor: colors.accent });
    expect(onDone).not.toHaveBeenCalled();
    await act(async () => d.resolve());
    await pressing;
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
  });
});

describe('StudyNoteForm - 활동 기록', () => {
  const acts = (over: Partial<Activities>): Activities => ({ ...emptyActivities(), ...over });
  const LOCAL = acts({ concepts: [{ id: 2, title: '일반항' }], quizIds: [46] });
  const SERVER = acts({ concepts: [{ id: 1, title: '점화식' }], quizIds: [45] });
  const withLocal = (a: Activities = LOCAL) => {
    const store = memoryStore();
    appendActivity(store, 7, a);
    return store;
  };
  const sent = (fn: unknown) => (fn as jest.Mock).mock.calls[0][1];

  it('조회한 개념을 topicHints 뒤에 칩으로 보여 주고, 누르면 입력칸에 들어간다', async () => {
    const { ui } = setup({}, { store: withLocal(), topicHints: ['수열'] });
    await render(ui);
    await settle();
    expect(screen.getByText('추천:')).toBeTruthy();
    const labels = screen.getAllByText(/^(수열|일반항)$/).map((t) => t.props.children);
    expect(labels).toEqual(['수열', '일반항']);
    await fireEvent.press(screen.getByText('일반항'));
    expect(screen.getByLabelText('공부한 내용').props.value).toBe('일반항');
  });

  it('topicHints 없이 조회한 개념만 있어도 추천 줄이 보인다', async () => {
    const { ui } = setup({}, { store: withLocal() });
    await render(ui);
    await settle();
    expect(screen.getByText('추천:')).toBeTruthy();
    expect(screen.getByRole('button', { name: '일반항' })).toBeTruthy();
  });

  // 개념 제목(rawTitle)은 HTML 엔티티·수식 표기를 담을 수 있다 — 개념 조회 패널과 같은 글자로 보여 주고 써넣는다
  it('개념 제목은 정리한 글자로 보여 주고 입력칸에도 그렇게 들어간다', async () => {
    const { ui } = setup({}, { store: withLocal(acts({ concepts: [{ id: 3, title: '수열 &amp; 급수' }] })) });
    await render(ui);
    await settle();
    expect(screen.queryByText('수열 &amp; 급수')).toBeNull();
    await fireEvent.press(screen.getByText('수열 & 급수'));
    expect(screen.getByLabelText('공부한 내용').props.value).toBe('수열 & 급수');
  });

  it('topicHints와 같은 제목의 개념은 칩 하나로 보여 준다', async () => {
    const { ui } = setup({}, { store: withLocal(), topicHints: ['일반항'] });
    await render(ui);
    await settle();
    expect(screen.getAllByRole('button', { name: '일반항' })).toHaveLength(1);
  });

  it('서버와 로컬의 퀴즈를 합쳐 개수를 보여 준다', async () => {
    const note: StudyNote = { taskId: 7, activities: JSON.stringify(SERVER) };
    const { ui } = setup({ fetchNote: jest.fn(async () => note) }, { store: withLocal() });
    await render(ui);
    await waitFor(() => expect(screen.getByText('수업 퀴즈 2개')).toBeTruthy());
    expect(screen.getByRole('button', { name: '점화식' })).toBeTruthy();
  });

  it('퀴즈가 없으면 퀴즈 줄이 없다', async () => {
    const { ui } = setup({}, { store: withLocal(acts({ concepts: LOCAL.concepts })) });
    await render(ui);
    await settle();
    expect(screen.queryByText(/수업 퀴즈/)).toBeNull();
  });

  it('서버 activities가 깨져 있어도 열리고 저장할 수 있다', async () => {
    const note: StudyNote = { taskId: 7, activities: 'not json' };
    const { fetchers, onDone, ui } = setup({ fetchNote: jest.fn(async () => note) });
    await render(ui);
    await waitFor(() => expect(screen.getByText('수정')).toBeTruthy());
    expect(screen.queryByText('추천:')).toBeNull();
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('수정'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect('activities' in sent(fetchers.update)).toBe(false);
  });

  it('저장하면 서버와 로컬을 합친 activities를 보내고 로컬 기록을 지운다', async () => {
    const store = withLocal();
    const note: StudyNote = { taskId: 7, activities: JSON.stringify(SERVER) };
    const { fetchers, onDone, ui } = setup({ fetchNote: jest.fn(async () => note) }, { store });
    await render(ui);
    await waitFor(() => expect(screen.getByText('수정')).toBeTruthy());
    await fireEvent.press(screen.getByText('일반항'));
    await fireEvent.press(screen.getByText('수정'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    const input = sent(fetchers.update);
    expect(input.description).toBe('일반항');
    expect(JSON.parse(input.activities)).toEqual({
      v: 1,
      concepts: [{ id: 1, title: '점화식' }, { id: 2, title: '일반항' }],
      quizIds: [45, 46],
    });
    expect(loadActivity(store, 7)).toEqual(emptyActivities());
  });

  it('새 노트도 로컬 기록을 activities로 보낸다', async () => {
    const store = withLocal();
    const { fetchers, onDone, ui } = setup({}, { store });
    await render(ui);
    await settle();
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect(JSON.parse(sent(fetchers.register).activities)).toEqual(LOCAL);
    expect(loadActivity(store, 7)).toEqual(emptyActivities());
  });

  it('기록이 전혀 없으면 activities 키를 보내지 않는다', async () => {
    const { fetchers, onDone, ui } = setup();
    await render(ui);
    await settle();
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect('activities' in sent(fetchers.register)).toBe(false);
  });

  it('나중에는 로컬 기록을 남긴다', async () => {
    const store = withLocal();
    const { onDone, ui } = setup({}, { store });
    await render(ui);
    await settle();
    await fireEvent.press(screen.getByText('나중에'));
    expect(onDone).toHaveBeenCalledWith('dismissed');
    expect(loadActivity(store, 7)).toEqual(LOCAL);
  });

  it('조회에 실패했어도 저장할 때 다시 조회한 서버 기록과 합쳐 보낸다', async () => {
    const store = withLocal();
    const note: StudyNote = { taskId: 7, activities: JSON.stringify(SERVER) };
    const fetchNote = jest.fn<Promise<StudyNote | null>, [number]>().mockRejectedValueOnce(new Error('net')).mockResolvedValue(note);
    const { fetchers, onDone, ui } = setup({ fetchNote }, { store });
    await render(ui);
    await waitFor(() => expect(screen.getByText('이전 메모를 불러오지 못했어요')).toBeTruthy());
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect(fetchNote).toHaveBeenCalledTimes(2);
    expect(fetchers.register).not.toHaveBeenCalled();
    expect(JSON.parse(sent(fetchers.update).activities)).toEqual({
      v: 1,
      concepts: [{ id: 1, title: '점화식' }, { id: 2, title: '일반항' }],
      quizIds: [45, 46],
    });
  });

  it('저장에 실패하면 로컬 기록이 남는다', async () => {
    const store = withLocal();
    const note: StudyNote = { taskId: 7 };
    const update = jest.fn().mockRejectedValue(new Error('x'));
    const { onDone, ui } = setup({ fetchNote: jest.fn(async () => note), update }, { store });
    await render(ui);
    await waitFor(() => expect(screen.getByText('수정')).toBeTruthy());
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('수정'));
    await waitFor(() => expect(screen.getByText('저장하지 못했어요. 다시 시도해 주세요.')).toBeTruthy());
    expect(onDone).not.toHaveBeenCalled();
    expect(loadActivity(store, 7)).toEqual(LOCAL);
  });
});

describe('StudyNoteForm - shared components (stage 4a)', () => {
  const flat = (node: any) => StyleSheet.flatten(node.props.style);

  it('scrolls inside the bottom sheet with gorhom BottomSheetScrollView (review I2)', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    const scroll = screen.getByTestId('sheet-scroll');
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('chips are the shared Chip at controlSm height', async () => {
    const { ui } = setup({}, { topicHints: ['일반항'] });
    await render(ui);
    await settle();
    expect(flat(screen.getByRole('radio', { name: '거의' }))).toMatchObject({ minHeight: layout.controlSm, borderRadius: expect.any(Number) });
    expect(flat(screen.getByRole('checkbox', { name: '개념' }))).toMatchObject({ minHeight: layout.controlSm });
    expect(flat(screen.getByRole('button', { name: '일반항' }))).toMatchObject({ minHeight: layout.controlSm });
  });

  it('나중에 and the goal toggle are text buttons; the toggle reports expanded', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    expect(flat(screen.getByRole('button', { name: '나중에' }))).toMatchObject({ backgroundColor: 'transparent', minHeight: layout.hit });
    const toggle = screen.getByRole('button', { name: '▸ 다음 목표 (선택)' });
    expect(flat(toggle)).toMatchObject({ backgroundColor: 'transparent', minHeight: layout.controlSm });
    expect(toggle.props.accessibilityState).toMatchObject({ expanded: false });
    await fireEvent.press(toggle);
    expect(screen.getByRole('button', { name: '▸ 다음 목표 (선택)' }).props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByLabelText('다음 목표')).toBeTruthy();
  });

  it('저장 is a primary button, disabled until an achievement is chosen', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    expect(flat(screen.getByRole('button', { name: '저장' }))).toMatchObject({ backgroundColor: colors.cardMuted });
    await fireEvent.press(screen.getByText('거의'));
    expect(flat(screen.getByRole('button', { name: '저장' }))).toMatchObject({ backgroundColor: colors.accent });
  });
});

describe('StudyNoteForm - 실황 Quiz·조회 내용', () => {
  const acts = (over: Partial<Activities>): Activities => ({ ...emptyActivities(), ...over });
  const storeWith = (a: Activities) => {
    const store = memoryStore();
    appendActivity(store, 7, a);
    return store;
  };
  const live = (a: Activities, fetchSentQuizzes?: jest.Mock) =>
    setup({}, { mode: 'live', store: storeWith(a), fetchSentQuizzes });

  it('받은 퀴즈 본문을 Quiz 영역에 보여 주고, 받지 않은 퀴즈는 숨긴다', async () => {
    const fetchSentQuizzes = jest.fn(async () => [
      { quizId: 1011, content: '등차수열 &amp; 일반항' },
      { quizId: 1011, content: '중복' },
      { quizId: 999, content: '받지 않음' },
    ]);
    const { ui } = live(acts({ quizIds: [1011, 1012] }), fetchSentQuizzes);
    await render(ui);
    await settle();
    const sec = await screen.findByTestId('study-note-quiz-section');
    await waitFor(() => expect(within(sec).getByText('등차수열 & 일반항')).toBeTruthy());
    expect(within(sec).getByText('Quiz')).toBeTruthy();
    expect(within(sec).getByText('Quiz #1012')).toBeTruthy();
    expect(within(sec).getByText('수업 퀴즈 2개')).toBeTruthy();
    expect(screen.queryByText('받지 않음')).toBeNull();
    expect(screen.queryByText('중복')).toBeNull();
    expect(fetchSentQuizzes).toHaveBeenCalledWith(7);
  });

  it('조회가 실패하면 Quiz #id로 보이고 저장은 된다', async () => {
    const fetchSentQuizzes = jest.fn(async () => {
      throw new Error('x');
    });
    const { fetchers, onDone, ui } = live(acts({ quizIds: [1011] }), fetchSentQuizzes);
    await render(ui);
    await settle();
    expect(within(await screen.findByTestId('study-note-quiz-section')).getByText('Quiz #1011')).toBeTruthy();
    await fireEvent.press(screen.getByText('조금'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect(JSON.parse((fetchers.register as jest.Mock).mock.calls[0][1].activities)).toEqual({ v: 1, concepts: [], quizIds: [1011] });
  });

  it('조회 내용 영역에 개념 제목을 정리해 보여 준다', async () => {
    const { ui } = live(acts({ concepts: [{ id: 1, title: '일반항 &amp; 합' }] }), jest.fn());
    await render(ui);
    await settle();
    const sec = screen.getByTestId('study-note-concepts-section');
    expect(within(sec).getByText('조회 내용')).toBeTruthy();
    expect(within(sec).getByText('일반항 & 합')).toBeTruthy();
    expect(screen.queryByTestId('study-note-quiz-section')).toBeNull();
  });

  it('비어 있으면 두 영역이 없고, self에서는 조회하지 않는다', async () => {
    const f = jest.fn(async () => []);
    const a = live(acts({}), f);
    await render(a.ui);
    await settle();
    expect(screen.queryByTestId('study-note-quiz-section')).toBeNull();
    expect(screen.queryByTestId('study-note-concepts-section')).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it('self에서는 영역도 조회도 없다', async () => {
    const f = jest.fn(async () => []);
    const { ui } = setup({}, { mode: 'self', store: storeWith(acts({ quizIds: [1], concepts: [{ id: 1, title: '가' }] })), fetchSentQuizzes: f });
    await render(ui);
    await settle();
    expect(screen.queryByTestId('study-note-quiz-section')).toBeNull();
    expect(screen.queryByTestId('study-note-concepts-section')).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });
});
