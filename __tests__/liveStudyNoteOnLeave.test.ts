import { openLiveStudyNoteOnLeave } from '../src/host/liveStudyNoteOnLeave';
import { loadActivity } from '../src/kit/study-note/activity';

jest.mock('../src/storage', () => ({ storage: {} }));
jest.mock('../src/agent/useAgentSession', () => ({ getAgentSession: () => ({}) }));

const mem = () => {
  const m = new Map<string, string>();
  return { getString: (k: string) => m.get(k), set: (k: string, v: string) => void m.set(k, v), remove: (k: string) => void m.delete(k) } as any;
};
const activity = { v: 1 as const, concepts: [{ id: 1, title: '일반항' }], quizIds: [] };
const hotline = { taskType: 'hotline' as const, task: { tutorId: 't' } };
const topic = { taskType: 'topic-live' as const, task: { topicId: 3 } };

it('acted=false면 아무것도 하지 않는다', async () => {
  const deps = { ensureTaskId: jest.fn(), store: mem(), showSheet: jest.fn() };
  await openLiveStudyNoteOnLeave({ taskId: 7, spec: hotline, acted: false, activity, title: 'x' }, deps);
  expect(deps.ensureTaskId).not.toHaveBeenCalled();
  expect(deps.showSheet).not.toHaveBeenCalled();
});

it('taskId가 있으면 ensureTaskId 없이 기록을 남기고 시트를 연다', async () => {
  const deps = { ensureTaskId: jest.fn(), store: mem(), showSheet: jest.fn() };
  await openLiveStudyNoteOnLeave({ taskId: 7, spec: hotline, acted: true, activity, title: '선생님 실황 수업' }, deps);
  expect(deps.ensureTaskId).not.toHaveBeenCalled();
  expect(deps.showSheet).toHaveBeenCalledTimes(1);
  expect(deps.showSheet).toHaveBeenCalledWith('study_note', { taskId: 7, mode: 'live', title: '선생님 실황 수업' });
  expect(loadActivity(deps.store, 7).concepts).toEqual([{ id: 1, title: '일반항' }]);
});

it('taskId가 없으면 ensureTaskId로 만든다', async () => {
  const deps = { ensureTaskId: jest.fn().mockResolvedValue(9), store: mem(), showSheet: jest.fn() };
  await openLiveStudyNoteOnLeave({ spec: topic, acted: true, activity, title: '주제 실황 수업' }, deps);
  expect(deps.ensureTaskId).toHaveBeenCalledWith(undefined, topic);
  expect(deps.showSheet).toHaveBeenCalledWith('study_note', { taskId: 9, mode: 'live', title: '주제 실황 수업' });
});

it('task를 만들지 못하면 시트를 열지 않는다', async () => {
  const deps = { ensureTaskId: jest.fn().mockResolvedValue(undefined), store: mem(), showSheet: jest.fn() };
  await openLiveStudyNoteOnLeave({ spec: topic, acted: true, activity, title: 'x' }, deps);
  expect(deps.showSheet).not.toHaveBeenCalled();
});

describe('closing', () => {
  const closing = { description: 'd', concepts: [{ id: 7, title: 'A' }], quizzes: [{ quizId: 9, content: 'q' }] };
  it('개념·퀴즈를 기록에 합치고 시트 props에 더한다', async () => {
    const deps = { ensureTaskId: jest.fn(), store: mem(), showSheet: jest.fn() };
    await openLiveStudyNoteOnLeave({ taskId: 3, spec: hotline, acted: true, activity: { v: 1, concepts: [], quizIds: [] }, title: 'T', closing }, deps);
    const a = loadActivity(deps.store, 3);
    expect(a.concepts).toEqual([{ id: 7, title: 'A' }]);
    expect(a.quizIds).toEqual([9]);
    expect(deps.showSheet).toHaveBeenCalledTimes(1);
    expect(deps.showSheet).toHaveBeenCalledWith('study_note', { taskId: 3, mode: 'live', title: 'T', tutorDescription: 'd', quizContents: [{ quizId: 9, content: 'q' }] });
  });
  it('closing이 null이면 props가 그대로다', async () => {
    const deps = { ensureTaskId: jest.fn(), store: mem(), showSheet: jest.fn() };
    await openLiveStudyNoteOnLeave({ taskId: 3, spec: hotline, acted: true, activity, title: 'T', closing: null }, deps);
    expect(deps.showSheet).toHaveBeenCalledWith('study_note', { taskId: 3, mode: 'live', title: 'T' });
  });
});
