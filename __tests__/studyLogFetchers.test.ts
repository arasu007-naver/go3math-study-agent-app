import { createStudyLogFetchers } from '../src/adapters/studyLogFetchers';
import { apiV3 } from '../src/api/rest/apiV3';
import { kstLabel, toTimelineTask, weekStartKst } from '../src/kit/study-log/model';
import { authStore } from '../src/state/auth';

jest.mock('../src/api/rest/apiV3', () => {
  const actual = jest.requireActual('../src/api/rest/apiV3');
  return { ...actual, apiV3: jest.fn() };
});

const api = apiV3 as jest.MockedFunction<typeof apiV3>;

beforeEach(() => {
  api.mockReset();
  authStore.dispatch({ type: 'RESTORE_TOKEN', item: { token: 'tok' } } as never);
});

describe('weekStartKst', () => {
  it('KST 월요일 0시 30분이면 그날', () => {
    expect(weekStartKst(new Date('2026-11-15T15:30:00Z'))).toBe('2026-11-16');
  });
  it('KST 일요일 저녁이면 그 주 월요일', () => {
    expect(weekStartKst(new Date('2026-11-15T10:00:00Z'))).toBe('2026-11-09');
  });
});

describe('kstLabel', () => {
  it('오프셋 없는 KST 문자열을 그대로 읽는다', () => {
    expect(kstLabel('2026-11-14T14:02:00')).toBe('11월 14일 14:02');
  });
  it('못 읽으면 빈 문자열', () => {
    expect(kstLabel('nope')).toBe('');
  });
});

describe('createStudyLogFetchers', () => {
  it('listNotes: from으로 조회하고 notes를 돌려준다', async () => {
    api.mockResolvedValueOnce({
      notes: [{ note: { taskId: 4, description: 'd', tutorDescription: 'x' }, taskType: 'topic', task: null, collectionId: 12 }],
    });
    const notes = await createStudyLogFetchers().listNotes('2026-11-09');
    expect(api).toHaveBeenCalledWith('/api/study-notes?from=2026-11-09', 'tok');
    expect(notes).toHaveLength(1);
    expect(notes[0].note.tutorDescription).toBeUndefined();
    expect(notes[0].collectionId).toBe(12);
  });

  it('listActivities: type이 없으면 풀이 업로드로 읽는다', async () => {
    api.mockResolvedValueOnce({
      activities: [
        { id: 1, imageUrl: 'a.png', createdAt: '2026-11-14T14:02:00' },
        { id: 2, type: 'QUIZ_ANSWER', imageUrl: 'b.png', createdAt: '2026-11-14T14:20:00', quizId: 9 },
        { id: 3, type: 'QUIZ_SENT', content: 'x^2', createdAt: '2026-11-14T14:10:00', quizId: 9 },
        { id: 4, type: 'SUBSCRIPTION_RENEW', createdAt: '2026-11-14T15:00:00' },
      ],
    });
    const acts = await createStudyLogFetchers().listActivities(5);
    expect(api).toHaveBeenCalledWith('/api/study-notes/5/activities', 'tok');
    expect(acts.map((a) => a.type)).toEqual(['SOLUTION_UPLOAD', 'QUIZ_ANSWER', 'QUIZ_SENT']); // 모르는 type은 뺀다
    expect(acts[1].quizId).toBe(9);
  });

  it('토큰이 없으면 reject', async () => {
    authStore.dispatch({ type: 'SIGN_OUT' } as never);
    await expect(createStudyLogFetchers().listNotes('2026-11-09')).rejects.toThrow('로그인');
    expect(api).not.toHaveBeenCalled();
  });
});

describe('toTimelineTask', () => {
  it('note.taskId를 id로', () => {
    const t = toTimelineTask({ note: { taskId: 4 }, taskType: 'topic', task: null, collectionId: 12, title: 'T' });
    expect(t).toMatchObject({ id: 4, taskType: 'topic', collectionId: 12, title: 'T', topicTitle: 'T' });
  });
});
