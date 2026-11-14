import { bookmarkFingerprint, bookmarkTaskFingerprint, createEnsureTask, createFindLiveClassTask, createTaskOf, type TaskCreateDeps, type TaskSpec } from '../src/adapters/ensureTask';

const spec: TaskSpec = { taskType: 'topic', task: { topicId: 3 } };

describe('ensureTaskId', () => {
  it('returns the given taskId without creating', async () => {
    const create = jest.fn();
    const ensure = createEnsureTask({ create, report: jest.fn() });
    expect(await ensure(5, spec)).toBe(5);
    expect(create).not.toHaveBeenCalled();
  });

  it('creates a task when taskId is missing', async () => {
    const create = jest.fn().mockResolvedValue(42);
    const ensure = createEnsureTask({ create, report: jest.fn() });
    expect(await ensure(undefined, spec)).toBe(42);
    expect(create).toHaveBeenCalledWith(spec);
  });

  it('returns undefined and reports once when create rejects', async () => {
    const report = jest.fn();
    const ensure = createEnsureTask({ create: jest.fn().mockRejectedValue(new Error('boom')), report });
    expect(await ensure(undefined, spec)).toBeUndefined();
    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith('study_note.ensure_task', expect.stringContaining('boom'));
  });

  it('shares one create between concurrent calls with the same spec', async () => {
    let resolve!: (n: number) => void;
    const create = jest.fn().mockImplementationOnce(() => new Promise<number>((r) => (resolve = r)));
    const ensure = createEnsureTask({ create, report: jest.fn() });
    const a = ensure(undefined, spec);
    const b = ensure(undefined, { taskType: 'topic', task: { topicId: 3 } });
    resolve(10);
    expect(await Promise.all([a, b])).toEqual([10, 10]);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('second call with the same spec after completion reuses the id (create called once)', async () => {
    const create = jest.fn().mockResolvedValueOnce(10).mockResolvedValueOnce(99);
    const ensure = createEnsureTask({ create, report: jest.fn() });
    expect(await ensure(undefined, spec)).toBe(10);
    expect(await ensure(undefined, { taskType: 'topic', task: { topicId: 3 } })).toBe(10);
    expect(create).toHaveBeenCalledTimes(1);
    expect(await ensure(undefined, { taskType: 'topic', task: { topicId: 4 } })).toBe(99);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('failure is not cached', async () => {
    const create = jest.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(11);
    const ensure = createEnsureTask({ create, report: jest.fn() });
    expect(await ensure(undefined, spec)).toBeUndefined();
    expect(await ensure(undefined, spec)).toBe(11);
    expect(await ensure(undefined, spec)).toBe(11);
    expect(create).toHaveBeenCalledTimes(2);
  });

  it('bookmark/list/hotline specs create a task too', async () => {
    const create = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2).mockResolvedValueOnce(3);
    const ensure = createEnsureTask({ create, report: jest.fn() });
    const specs: TaskSpec[] = [
      { taskType: 'bookmark', task: { units: [] } },
      { taskType: 'list', task: { units: [] } },
      { taskType: 'hotline', task: { tutorId: 't' } },
    ];
    const ids = [];
    for (const s of specs) ids.push(await ensure(undefined, s));
    expect(ids).toEqual([1, 2, 3]);
    expect(create).toHaveBeenCalledTimes(3);
  });
});

describe('createTaskOf', () => {
  const deps = (over: Partial<TaskCreateDeps> = {}): jest.Mocked<TaskCreateDeps> =>
    ({
      createTask: jest.fn(async () => 50),
      hotlineLessonNoteId: jest.fn(async () => 77),
      topicLiveLessonNoteId: jest.fn(async () => 88),
      findMyTask: jest.fn(async () => 60),
      findExistingTask: jest.fn(async () => undefined),
      findBookmarkTask: jest.fn(async () => undefined),
      ...over,
    }) as jest.Mocked<TaskCreateDeps>;

  it('topic: collectionId is the topic id', async () => {
    const d = deps();
    expect(await createTaskOf(d)({ taskType: 'topic', task: { topicId: 3 } })).toBe(50);
    expect(d.createTask).toHaveBeenCalledWith({ taskType: 'topic', collectionId: 3 });
  });

  it('topic-live: collectionId is the lesson_note id of the running class', async () => {
    const d = deps();
    expect(await createTaskOf(d)({ taskType: 'topic-live', task: { topicId: 3 } })).toBe(50);
    expect(d.topicLiveLessonNoteId).toHaveBeenCalledWith(3);
    expect(d.createTask).toHaveBeenCalledWith({ taskType: 'topic-live', collectionId: 88 });
  });

  it('hotline: finds or creates my task for the lesson_note id', async () => {
    const d = deps();
    expect(await createTaskOf(d)({ taskType: 'hotline', task: { tutorId: 't1' } })).toBe(60);
    expect(d.hotlineLessonNoteId).toHaveBeenCalledWith('t1');
    expect(d.findMyTask).toHaveBeenCalledWith({ taskType: 'hotline', targetId: 77 });
    expect(d.createTask).not.toHaveBeenCalled();
  });

  it('no lesson_note → no task (never falls back to another id)', async () => {
    const d = deps({ hotlineLessonNoteId: jest.fn(async () => undefined), topicLiveLessonNoteId: jest.fn(async () => undefined) });
    await expect(createTaskOf(d)({ taskType: 'hotline', task: { tutorId: 't1' } })).rejects.toThrow('lesson_note');
    await expect(createTaskOf(d)({ taskType: 'topic-live', task: { topicId: 3 } })).rejects.toThrow('lesson_note');
    expect(d.createTask).not.toHaveBeenCalled();
    expect(d.findMyTask).not.toHaveBeenCalled();
  });

  it('selection keeps its content in task JSON', async () => {
    const d = deps();
    await createTaskOf(d)({ taskType: 'selection', task: { major: 'A' } });
    expect(d.createTask).toHaveBeenCalledWith({ taskType: 'selection', task: '{"major":"A"}' });
  });

  it('topic-live: reuses my task for the same lesson_note instead of creating another', async () => {
    const d = deps({ findExistingTask: jest.fn(async () => 41) });
    expect(await createTaskOf(d)({ taskType: 'topic-live', task: { topicId: 3 } })).toBe(41);
    expect(d.findExistingTask).toHaveBeenCalledWith({ taskType: 'topic-live', collectionId: 88 });
    expect(d.createTask).not.toHaveBeenCalled();
  });
});

describe('bookmark task', () => {
  const u = (sourceType: string, sourceId: number | string) => ({ sourceType, sourceId });

  it('fingerprint ignores order, duplicates and id type; differs when a problem is added or removed', () => {
    const base = bookmarkFingerprint([u('UNIT', 2), u('PREMISE', 33)]);
    expect(bookmarkFingerprint([u('PREMISE', '33'), u('UNIT', 2), u('UNIT', 2)])).toBe(base);
    expect(bookmarkFingerprint([u('UNIT', 2)])).not.toBe(base);
    expect(bookmarkFingerprint([u('UNIT', 2), u('PREMISE', 33), u('UNIT', 5)])).not.toBe(base);
    expect(bookmarkFingerprint(undefined)).toBe('');
  });

  it('stored task fingerprint ignores regDate; tutor bookmark classes and broken JSON are not compared', () => {
    const fp = bookmarkFingerprint([u('UNIT', 2)]);
    expect(bookmarkTaskFingerprint(JSON.stringify({ regDate: '2026-10-01', units: [u('UNIT', 2)] }))).toBe(fp);
    expect(bookmarkTaskFingerprint(JSON.stringify({ tutor: { name: '김쌤' }, units: [u('UNIT', 2)] }))).toBeUndefined();
    expect(bookmarkTaskFingerprint('{oops')).toBeUndefined();
    expect(bookmarkTaskFingerprint(null)).toBeUndefined();
  });

  const deps = (existing: number | undefined): TaskCreateDeps => ({
    createTask: jest.fn(async () => 50),
    hotlineLessonNoteId: jest.fn(),
    topicLiveLessonNoteId: jest.fn(),
    findMyTask: jest.fn(),
    findExistingTask: jest.fn(),
    findBookmarkTask: jest.fn(async () => existing),
  });
  const spec: TaskSpec = { taskType: 'bookmark', task: { regDate: '2026-11-14', units: [u('UNIT', 2), u('PREMISE', 33)] } };

  it('same bookmark list as an earlier task → continues that task', async () => {
    const d = deps(31);
    expect(await createTaskOf(d)(spec)).toBe(31);
    expect(d.findBookmarkTask).toHaveBeenCalledWith('PREMISE-33|UNIT-2');
    expect(d.createTask).not.toHaveBeenCalled();
  });

  it('different bookmark list → registers a new task', async () => {
    const d = deps(undefined);
    expect(await createTaskOf(d)(spec)).toBe(50);
    expect(d.createTask).toHaveBeenCalledWith({ taskType: 'bookmark', task: JSON.stringify(spec.task) });
  });
});

describe('live class re-entry', () => {
  const deps = (existing: number | undefined): TaskCreateDeps => ({
    createTask: jest.fn(async () => 50),
    hotlineLessonNoteId: jest.fn(async () => 77),
    topicLiveLessonNoteId: jest.fn(async () => 88),
    findMyTask: jest.fn(async () => 60),
    findExistingTask: jest.fn(async () => existing),
    findBookmarkTask: jest.fn(async () => undefined),
  });

  it('on entry finds my task for the running lesson_note without creating one', async () => {
    const d = deps(41);
    const find = createFindLiveClassTask(d, jest.fn());
    expect(await find({ taskType: 'hotline', task: { tutorId: 't1' } })).toBe(41);
    expect(d.findExistingTask).toHaveBeenLastCalledWith({ taskType: 'hotline', collectionId: 77 });
    expect(await find({ taskType: 'topic-live', task: { topicId: 3 } })).toBe(41);
    expect(d.findExistingTask).toHaveBeenLastCalledWith({ taskType: 'topic-live', collectionId: 88 });
    expect(d.createTask).not.toHaveBeenCalled();
    expect(d.findMyTask).not.toHaveBeenCalled();
  });

  it('no task yet, a non-live spec, or a failed lookup → undefined', async () => {
    const report = jest.fn();
    expect(await createFindLiveClassTask(deps(undefined), report)({ taskType: 'hotline', task: { tutorId: 't1' } })).toBeUndefined();
    expect(await createFindLiveClassTask(deps(41), report)({ taskType: 'topic', task: { topicId: 3 } })).toBeUndefined();
    const failing = { ...deps(41), hotlineLessonNoteId: jest.fn(async () => Promise.reject(new Error('down'))) };
    expect(await createFindLiveClassTask(failing, report)({ taskType: 'hotline', task: { tutorId: 't1' } })).toBeUndefined();
    expect(report).toHaveBeenCalledWith('study_note.find_live_task', 'down');
  });

  it('live class tasks are not remembered per spec: a new lesson of the same tutor gets its own task', async () => {
    const create = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const ensure = createEnsureTask({ create, report: jest.fn() });
    const hotline: TaskSpec = { taskType: 'hotline', task: { tutorId: 't1' } };
    expect(await ensure(undefined, hotline)).toBe(1);
    expect(await ensure(undefined, hotline)).toBe(2);
  });
});
