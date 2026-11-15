import { emptyActivities, loadActivity, type Activities } from '../src/kit/study-note/activity';
import { openStudyNoteOnLeave } from '../src/phone/studyNoteOnLeave';

jest.mock('../src/adapters/ensureTask', () => ({ ensureTaskId: jest.fn() }));
jest.mock('../src/agent/useAgentSession', () => ({ getAgentSession: jest.fn() }));
jest.mock('../src/storage', () => ({ storage: {} }));

const spec = { taskType: 'bookmark' as const, task: { units: [] } };
const concepts: Activities = { ...emptyActivities(), concepts: [{ id: 1, title: '일반항' }] };

function setup(ensured: number | null = 9) {
  const data = new Map<string, string>();
  const store = {
    getString: (k: string) => data.get(k),
    set: (k: string, v: string) => void data.set(k, v),
    remove: (k: string) => void data.delete(k),
  };
  const ensureTaskId = jest.fn(async (taskId: number | undefined) => taskId ?? ensured ?? undefined);
  const showSheet = jest.fn();
  return { store, deps: { ensureTaskId, store: store as any, showSheet } };
}

describe('openStudyNoteOnLeave', () => {
  it('개념만 조회해도 task를 만들어 기록을 남기고 학습장을 연다', async () => {
    const { store, deps } = setup();
    await openStudyNoteOnLeave({ note: { spec, mode: 'self', title: '책갈피', topicHints: ['수열'] }, activity: concepts, uploaded: false }, deps);
    expect(deps.ensureTaskId).toHaveBeenCalledWith(undefined, spec);
    expect(loadActivity(store as any, 9)).toEqual(concepts);
    expect(deps.showSheet).toHaveBeenCalledWith('study_note', { taskId: 9, mode: 'self', title: '책갈피', topicHints: ['수열'] });
  });

  it('이미 task가 있으면 그 task로 연다', async () => {
    const { store, deps } = setup();
    await openStudyNoteOnLeave({ note: { taskId: 3, mode: 'live', title: '수업' }, activity: concepts, uploaded: false }, deps);
    expect(loadActivity(store as any, 3)).toEqual(concepts);
    expect(deps.showSheet).toHaveBeenCalledWith('study_note', { taskId: 3, mode: 'live', title: '수업' });
  });

  it('풀이 사진만 올려도 연다', async () => {
    const { deps } = setup();
    await openStudyNoteOnLeave({ note: { spec, mode: 'self', title: '책갈피' }, activity: emptyActivities(), uploaded: true }, deps);
    expect(deps.showSheet).toHaveBeenCalledWith('study_note', { taskId: 9, mode: 'self', title: '책갈피' });
  });

  it('아무것도 하지 않았으면 task를 만들지도 열지도 않는다', async () => {
    const { deps } = setup();
    await openStudyNoteOnLeave({ note: { spec, mode: 'self', title: '책갈피' }, activity: emptyActivities(), uploaded: false }, deps);
    expect(deps.ensureTaskId).not.toHaveBeenCalled();
    expect(deps.showSheet).not.toHaveBeenCalled();
  });

  it('task를 만들지 못하면 열지 않는다', async () => {
    const { deps } = setup(null);
    await openStudyNoteOnLeave({ note: { spec, mode: 'self', title: '책갈피' }, activity: concepts, uploaded: false }, deps);
    expect(deps.showSheet).not.toHaveBeenCalled();
    await openStudyNoteOnLeave({ note: null, activity: concepts, uploaded: false }, deps);
    expect(deps.showSheet).not.toHaveBeenCalled();
  });
});
