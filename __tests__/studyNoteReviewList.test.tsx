import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { StudyLogFetchers, StudyNoteListItem } from '../src/kit/study-log/model';

jest.mock('@openspacelabs/react-native-zoomable-view', () => ({ ReactNativeZoomableView: ({ children }: any) => children }));

import { StudyNoteReviewList } from '../src/kit/study-log/StudyNoteReviewList';
import { clearTopicTitles } from '../src/kit/study-log/topicTitles';

const NOW = () => new Date('2026-11-15T10:00:00Z'); // KST 일요일 → from 2026-11-09

const item = (over: Partial<StudyNoteListItem> & { taskId?: number } = {}): StudyNoteListItem => ({
  note: { taskId: over.taskId ?? 4, description: '일반항', achievementRate: null },
  taskType: 'topic-live',
  task: null,
  collectionId: null,
  ...over,
});

function makeFetchers(over: Partial<StudyLogFetchers> = {}): jest.Mocked<StudyLogFetchers> {
  return {
    listNotes: jest.fn().mockResolvedValue([item()]),
    listActivities: jest.fn().mockResolvedValue([
      { id: 1, type: 'SOLUTION_UPLOAD', imageUrl: 'a.png', createdAt: '2026-11-14T14:02:00' },
      { id: 2, type: 'QUIZ_ANSWER', imageUrl: 'b.png', createdAt: '2026-11-14T14:20:00', quizId: 9 },
    ]),
    ...over,
  } as jest.Mocked<StudyLogFetchers>;
}

beforeEach(() => clearTopicTitles());

describe('StudyNoteReviewList', () => {
  it('이번 주 월요일로 조회하고 카드 종류가 아닌 항목은 뺀다', async () => {
    const f = makeFetchers({ listNotes: jest.fn().mockResolvedValue([item(), item({ taskId: 8, taskType: 'recommended' })]) });
    await render(<StudyNoteReviewList fetchers={f} refreshKey={0} now={NOW} />);
    await waitFor(() => expect(screen.getByText('주제 실황 수업')).toBeTruthy());
    expect(f.listNotes).toHaveBeenCalledWith('2026-11-09');
    expect(screen.getByText('일반항')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /돌아보기/ })).toHaveLength(1);
  });

  it('빈 목록이면 안내', async () => {
    await render(<StudyNoteReviewList fetchers={makeFetchers({ listNotes: jest.fn().mockResolvedValue([]) })} refreshKey={0} now={NOW} />);
    await waitFor(() => expect(screen.getByText('이번 주에 쓴 학습장이 없어요')).toBeTruthy());
  });

  it('조회 실패면 안내', async () => {
    await render(<StudyNoteReviewList fetchers={makeFetchers({ listNotes: jest.fn().mockRejectedValue(new Error('x')) })} refreshKey={0} now={NOW} />);
    await waitFor(() => expect(screen.getByText('학습장을 불러오지 못했어요')).toBeTruthy());
  });

  it('주제·문제 모음 제목', async () => {
    const f = makeFetchers({
      listNotes: jest.fn().mockResolvedValue([
        item({ taskId: 1, taskType: 'topic', collectionId: 12 }),
        item({ taskId: 2, taskType: 'collection', collectionId: 3 }),
        item({ taskId: 3, taskType: 'topic', collectionId: 13, title: '서버 제목' }),
      ]),
    });
    const fetchTopicTitle = jest.fn().mockResolvedValue('수열의 극한');
    await render(<StudyNoteReviewList fetchers={f} refreshKey={0} now={NOW} fetchTopicTitle={fetchTopicTitle} />);
    await waitFor(() => expect(screen.getByText('수열의 극한')).toBeTruthy());
    expect(screen.getByText('문제 모음')).toBeTruthy();
    expect(screen.getByText('서버 제목')).toBeTruthy();
    expect(fetchTopicTitle).toHaveBeenCalledTimes(1);
    expect(fetchTopicTitle).toHaveBeenCalledWith(12);
  });

  it('주제 제목 조회가 실패하면 "주제"', async () => {
    const f = makeFetchers({ listNotes: jest.fn().mockResolvedValue([item({ taskType: 'topic', collectionId: 12 })]) });
    await render(<StudyNoteReviewList fetchers={f} refreshKey={0} now={NOW} fetchTopicTitle={jest.fn().mockRejectedValue(new Error('x'))} />);
    await waitFor(() => expect(screen.getByText('주제')).toBeTruthy());
  });

  it('돌아보기: 처음 펼칠 때 한 번만 조회하고 시각·종류를 보인다', async () => {
    const f = makeFetchers();
    await render(<StudyNoteReviewList fetchers={f} refreshKey={0} now={NOW} />);
    const toggle = await screen.findByRole('button', { name: '주제 실황 수업 돌아보기' });
    expect(toggle.props.accessibilityState.expanded).toBe(false);
    await fireEvent.press(toggle);
    await waitFor(() => expect(screen.getByText('11월 14일 14:02')).toBeTruthy());
    expect(f.listActivities).toHaveBeenCalledWith(4);
    expect(screen.getByText('풀이 업로드')).toBeTruthy();
    expect(screen.getByText('퀴즈 답')).toBeTruthy();
    expect(screen.getByRole('button', { name: '주제 실황 수업 돌아보기' }).props.accessibilityState.expanded).toBe(true);
    expect(f.listActivities).toHaveBeenCalledTimes(1);
  });

  it('목록이 다시 조회돼도 펼친 카드는 펼친 채 기록을 다시 받는다', async () => {
    const f = makeFetchers();
    const { rerender } = await render(<StudyNoteReviewList fetchers={f} refreshKey={0} now={NOW} />);
    await fireEvent.press(await screen.findByRole('button', { name: '주제 실황 수업 돌아보기' }));
    await waitFor(() => expect(screen.getByText('11월 14일 14:02')).toBeTruthy());
    f.listActivities.mockResolvedValueOnce([{ id: 5, type: 'SOLUTION_UPLOAD', imageUrl: 'c.png', createdAt: '2026-11-15T09:00:00' }]);
    await rerender(<StudyNoteReviewList fetchers={f} refreshKey={1} now={NOW} />);
    await waitFor(() => expect(screen.getByText('11월 15일 09:00')).toBeTruthy());
    expect(f.listNotes).toHaveBeenCalledTimes(2);
    expect(f.listActivities).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('button', { name: '주제 실황 수업 돌아보기' }).props.accessibilityState.expanded).toBe(true);
  });

  it('업로드가 없을 때와 실패했을 때', async () => {
    const f = makeFetchers({ listActivities: jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValueOnce([]) });
    await render(<StudyNoteReviewList fetchers={f} refreshKey={0} now={NOW} />);
    await fireEvent.press(await screen.findByRole('button', { name: '주제 실황 수업 돌아보기' }));
    await waitFor(() => expect(screen.getByText('불러오지 못했어요')).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: '다시 시도' }));
    await waitFor(() => expect(screen.getByText('이 학습에서 올린 풀이가 없어요')).toBeTruthy());
  });
});
