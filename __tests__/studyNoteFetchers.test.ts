import { createStudyNoteFetchers } from '../src/adapters/studyNoteFetchers';
import { persistNote, type StudyNoteFetchers } from '../src/kit/study-note/persist';
import type { StudyNote, StudyNoteInput } from '../src/kit/study-note/model';
import { STUDY_NOTE } from '../src/api/graphql/queries/study';
import { REGIST_TASK_NOTE, UPDATE_STUDY_NOTE } from '../src/api/graphql/mutations/study';

const input: StudyNoteInput = { description: '설명', achievementRate: 50 };
const note: StudyNote = { taskId: 7, description: '예전' };

function makeFetchers(over: Partial<StudyNoteFetchers> = {}) {
  return {
    fetchNote: jest.fn().mockResolvedValue(null),
    register: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    ...over,
  } as jest.Mocked<StudyNoteFetchers>;
}

describe('persistNote', () => {
  it('existing null -> register only', async () => {
    const f = makeFetchers();
    await persistNote(f, 7, input, null);
    expect(f.register).toHaveBeenCalledTimes(1);
    expect(f.register).toHaveBeenCalledWith(7, input);
    expect(f.update).not.toHaveBeenCalled();
    expect(f.fetchNote).not.toHaveBeenCalled();
  });

  it('existing note -> update', async () => {
    const f = makeFetchers();
    await persistNote(f, 7, input, note);
    expect(f.update).toHaveBeenCalledTimes(1);
    expect(f.update).toHaveBeenCalledWith(7, input);
    expect(f.register).not.toHaveBeenCalled();
  });

  it('existing undefined, fetch finds none -> register', async () => {
    const f = makeFetchers();
    await persistNote(f, 7, input, undefined);
    expect(f.fetchNote).toHaveBeenCalledTimes(1);
    expect(f.register).toHaveBeenCalledTimes(1);
    expect(f.update).not.toHaveBeenCalled();
  });

  it('existing undefined, fetch finds note -> update', async () => {
    const f = makeFetchers({ fetchNote: jest.fn().mockResolvedValue(note) });
    await persistNote(f, 7, input, undefined);
    expect(f.fetchNote).toHaveBeenCalledTimes(1);
    expect(f.update).toHaveBeenCalledTimes(1);
    expect(f.register).not.toHaveBeenCalled();
  });

  it('existing undefined, fetch throws -> reject without writing', async () => {
    const err = new Error('network');
    const f = makeFetchers({ fetchNote: jest.fn().mockRejectedValue(err) });
    await expect(persistNote(f, 7, input, undefined)).rejects.toBe(err);
    expect(f.register).not.toHaveBeenCalled();
    expect(f.update).not.toHaveBeenCalled();
  });

  it('register fails but note now exists -> retry with update', async () => {
    const f = makeFetchers({
      register: jest.fn().mockRejectedValue(new Error('dup')),
      fetchNote: jest.fn().mockResolvedValue(note),
    });
    await expect(persistNote(f, 7, input, null)).resolves.toBeUndefined();
    expect(f.fetchNote).toHaveBeenCalledTimes(1);
    expect(f.update).toHaveBeenCalledTimes(1);
    expect(f.update).toHaveBeenCalledWith(7, input);
  });

  it('register fails and no note -> original error', async () => {
    const err = new Error('boom');
    const f = makeFetchers({ register: jest.fn().mockRejectedValue(err) });
    await expect(persistNote(f, 7, input, null)).rejects.toBe(err);
    expect(f.fetchNote).toHaveBeenCalledTimes(1);
    expect(f.update).not.toHaveBeenCalled();
  });
});

describe('createStudyNoteFetchers', () => {
  function makeClient() {
    return { query: jest.fn(), mutate: jest.fn().mockResolvedValue({ data: {} }) };
  }

  it('fetchNote queries STUDY_NOTE network-only and maps result', async () => {
    const client = makeClient();
    client.query.mockResolvedValue({
      data: {
        studyNote: {
          taskId: 7,
          description: 'd',
          difficulties: 'calc',
          expectations: 'e',
          achievementRate: 75,
          noteType: 'student',
        },
      },
    });
    const f = createStudyNoteFetchers(client as never);
    const result = await f.fetchNote(7);
    expect(client.query).toHaveBeenCalledWith({
      query: STUDY_NOTE,
      variables: { taskId: 7 },
      fetchPolicy: 'network-only',
    });
    expect(result).toEqual({
      taskId: 7,
      description: 'd',
      difficulties: 'calc',
      expectations: 'e',
      achievementRate: 75,
      noteType: 'student',
      tutorDescription: undefined,
    });
  });

  it('fetchNote returns null when studyNote is null', async () => {
    const client = makeClient();
    client.query.mockResolvedValue({ data: { studyNote: null } });
    const f = createStudyNoteFetchers(client as never);
    expect(await f.fetchNote(7)).toBeNull();
  });

  it('register / update call the mutations with taskId and input', async () => {
    const client = makeClient();
    const f = createStudyNoteFetchers(client as never);
    await f.register(7, input);
    expect(client.mutate).toHaveBeenLastCalledWith({
      mutation: REGIST_TASK_NOTE,
      variables: { taskId: 7, ...input },
    });
    await f.update(7, input);
    expect(client.mutate).toHaveBeenLastCalledWith({
      mutation: UPDATE_STUDY_NOTE,
      variables: { taskId: 7, ...input },
    });
  });

  it('register / update throw when the server returns a negative result (unauthenticated)', async () => {
    const client = makeClient();
    const f = createStudyNoteFetchers(client as never);
    client.mutate.mockResolvedValueOnce({ data: { registerTaskNote: -1 } });
    await expect(f.register(7, input)).rejects.toThrow('저장하지 못했어요');
    client.mutate.mockResolvedValueOnce({ data: { updateTaskNote: -1 } });
    await expect(f.update(7, input)).rejects.toThrow('저장하지 못했어요');
    client.mutate.mockResolvedValueOnce({ data: { updateTaskNote: 1 } });
    await expect(f.update(7, input)).resolves.toBeUndefined();
  });
});
