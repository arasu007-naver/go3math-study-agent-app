import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { StudyLogFetchers, StudyNoteListItem } from '../src/kit/study-log/model';

jest.mock('react-native-webview', () => ({ WebView: () => null }));
// Image.getSize는 jest-expo 목에서 동작하지 않아 이미지 크기 계산 컴포넌트를 비운다
jest.mock('../src/kit/ui/image-dynamic-dims', () => () => null);
jest.mock('@openspacelabs/react-native-zoomable-view',() => ({ ReactNativeZoomableView: ({ children }: any) => children }));

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
      { id: 3, type: 'QUIZ_SENT', content: '\\(x^2\\) 의 값은?', createdAt: '2026-11-14T14:00:00', quizId: 9 },
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
    expect(screen.getByText('선생님 퀴즈')).toBeTruthy();
    expect(screen.getByText(/의 값은\?/)).toBeTruthy();
    // 사진은 풀이 업로드·퀴즈 답 두 개만(선생님 퀴즈는 사진 없음)
    expect(screen.getAllByRole('imagebutton')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '주제 실황 수업 돌아보기' }).props.accessibilityState.expanded).toBe(true);
    expect(f.listActivities).toHaveBeenCalledTimes(1);
  });

  it('선생님 이미지 퀴즈: 라벨·본문·이미지 버튼을 보이고 누르면 크게 본다', async () => {
    const f = makeFetchers({
      listActivities: jest.fn().mockResolvedValue([
        { id: 31, type: 'QUIZ_SENT', createdAt: '2026-11-19T10:02:00', quizId: 1011, content: '중요한 부분에 표시하시오', imageUrl: 'https://x/c.jpeg', quizType: 'IMAGE', imageSourceType: 'MATH_CONCEPT', imageSourceId: 12 },
      ]),
    });
    await render(<StudyNoteReviewList fetchers={f} refreshKey={0} now={NOW} />);
    await fireEvent.press(await screen.findByRole('button', { name: '주제 실황 수업 돌아보기' }));
    await waitFor(() => expect(screen.getByText('선생님 이미지 퀴즈')).toBeTruthy());
    expect(screen.getByText('중요한 부분에 표시하시오')).toBeTruthy();
    const btn = screen.getByRole('imagebutton', { name: '선생님 이미지 퀴즈 크게 보기' });
    await fireEvent.press(btn);
    await waitFor(() => expect(screen.getByRole('button', { name: '닫기' })).toBeTruthy());
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
    await waitFor(() => expect(screen.getByText('이 학습의 기록이 없어요')).toBeTruthy());
  });

  it('hotline·topic-live 학습장이 각각 실황 수업 제목의 카드로 보인다', async () => {
    const f = makeFetchers({
      listNotes: jest.fn().mockResolvedValue([item({ taskId: 1, taskType: 'hotline' }), item({ taskId: 2, taskType: 'topic-live' })]),
    });
    await render(<StudyNoteReviewList fetchers={f} refreshKey={0} now={NOW} />);
    await waitFor(() => expect(screen.getByText('선생님 실황 수업')).toBeTruthy());
    expect(screen.getByText('주제 실황 수업')).toBeTruthy();
  });
});
