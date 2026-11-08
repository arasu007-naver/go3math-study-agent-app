import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { TimelinePanel, describeNote, describeTask, noteModeOf, type TimelineFetchers, type TimelineTask } from '../src/kit/timeline/TimelinePanel';

const fetchers = (impl: TimelineFetchers['fetchTasks']): TimelineFetchers => ({ fetchTasks: impl });

const selection: TimelineTask = {
  id: '11',
  taskType: 'selection',
  task: JSON.stringify({ major: 'CALCULUS', years: [2025, 2026], months: [6, 9], numbers: [21, 22] }),
  visitCnt: 3,
  lastVisitedAt: 1761955200,
};

describe('describeTask', () => {
  it('formats the legacy card text for each task type', () => {
    expect(describeTask(selection)).toEqual({
      title: '📝 기출 검색',
      subtitle: '미적분 / 2025년, 2026년  #3번',
      lines: ['📆 6월, 9월', '🔢 번호: 21, 22'],
    });
    expect(describeTask({ id: 1, taskType: 'topic', topicTitle: '수열의 극한', topicDescription: '기본', visitCnt: 1 }).subtitle).toBe('기본  #1번');
    expect(describeTask({ id: 2, taskType: 'collection', title: '모음', description: '설명', visitCnt: 2 }).title).toBe('📝 모음');
    expect(describeTask({ id: 3, taskType: 'bookmark', task: JSON.stringify({ tutor: { name: '김쌤' }, units: [1, 2] }), visitCnt: 5 }).subtitle).toBe(
      '🥸 김쌤 님의 북마크 수업 / 2문항  #5번',
    );
  });
});

describe('TimelinePanel', () => {
  it('lists cards and reports the chosen task', async () => {
    const onSelectTask = jest.fn();
    const fetchTasks = jest.fn(async () => [selection, { id: 99, taskType: 'recommended' }]);
    render(<TimelinePanel fetchers={fetchers(fetchTasks)} onSelectTask={onSelectTask} />);
    await waitFor(() => expect(screen.getByText('📝 기출 검색')).toBeTruthy());
    expect(fetchTasks).toHaveBeenCalledWith({ page: 0, pageSize: 36 });
    expect(screen.getAllByRole('button')).toHaveLength(1); // recommended는 표시하지 않음
    fireEvent.press(screen.getByLabelText('📝 기출 검색 학습하기'));
    expect(onSelectTask).toHaveBeenCalledWith(selection);
  });

  it('shows the empty placeholder', async () => {
    render(<TimelinePanel fetchers={fetchers(async () => [])} onSelectTask={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('기출 검색이나 주제별 문제 모음 등을 조회한 기록이 없습니다.')).toBeTruthy());
  });

  it('shows the error message when the fetch fails', async () => {
    render(<TimelinePanel fetchers={fetchers(async () => { throw new Error('로그인이 필요해요'); })} onSelectTask={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('학습 기록을 불러오지 못했어요. (로그인이 필요해요)')).toBeTruthy());
  });
});

describe('describeNote / noteModeOf', () => {
  const t = (note: TimelineTask['note']): TimelineTask => ({ id: 1, taskType: 'selection', note });
  it('summarizes the note with the achievement label', () => {
    expect(describeNote(t({ description: '일반항 구하기', achievementRate: 75 }))).toBe('✏️ 일반항 구하기 · 거의');
    expect(describeNote(t({ tutorDescription: '귀납적 정의', description: '나' }))).toBe('✏️ 귀납적 정의');
    expect(describeNote(t({ description: '메모', achievementRate: 30 }))).toBe('✏️ 메모');
    expect(describeNote(t(null))).toBeNull();
    expect(describeNote(t({ description: '' }))).toBeNull();
  });
  it('picks live mode for tutor notes', () => {
    expect(noteModeOf(t({ noteType: 'tutor' }))).toBe('live');
    expect(noteModeOf(t({ tutorDescription: 'x' }))).toBe('live');
    expect(noteModeOf({ id: 1, taskType: 'selection' })).toBe('self');
  });
});

describe('TimelinePanel note button', () => {
  it('shows note summary or placeholder and opens the note', async () => {
    const onOpenNote = jest.fn();
    const withNote: TimelineTask = { ...selection, id: '12', note: { description: '일반항 구하기', achievementRate: 75 } };
    render(<TimelinePanel fetchers={fetchers(async () => [selection, withNote])} onSelectTask={jest.fn()} onOpenNote={onOpenNote} />);
    await waitFor(() => expect(screen.getByText('학습장을 남겨 보세요')).toBeTruthy());
    expect(screen.getByText('✏️ 일반항 구하기 · 거의')).toBeTruthy();
    fireEvent.press(screen.getAllByLabelText('📝 기출 검색 학습장')[0]);
    expect(onOpenNote).toHaveBeenCalledWith(selection);
  });

  it('has no note button without onOpenNote', async () => {
    render(<TimelinePanel fetchers={fetchers(async () => [selection])} onSelectTask={jest.fn()} />);
    await waitFor(() => expect(screen.getByText('📝 기출 검색')).toBeTruthy());
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.queryByText('학습장을 남겨 보세요')).toBeNull();
  });
});
