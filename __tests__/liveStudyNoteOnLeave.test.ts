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
