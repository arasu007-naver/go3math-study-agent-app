import { createEnsureTask, type TaskSpec } from '../src/adapters/ensureTask';

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

  it('bookmark/list/hotline specs never call create', async () => {
    const create = jest.fn().mockResolvedValue(1);
    const report = jest.fn();
    const ensure = createEnsureTask({ create, report });
    const specs: TaskSpec[] = [
      { taskType: 'bookmark', task: { units: [] } },
      { taskType: 'list', task: { problems: [] } },
      { taskType: 'hotline', task: { tutorId: 't' } },
    ];
    for (const s of specs) expect(await ensure(undefined, s)).toBeUndefined();
    expect(create).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
  });
});
