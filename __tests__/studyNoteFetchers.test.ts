import { print } from 'graphql';
import { createStudyNoteFetchers } from '../src/adapters/studyNoteFetchers';
import { ApiV3Error, apiV3 } from '../src/api/rest/apiV3';
import { authStore } from '../src/state/auth';
import { persistNote, type StudyNoteFetchers } from '../src/kit/study-note/persist';
import type { StudyNote, StudyNoteInput } from '../src/kit/study-note/model';
import { STUDY_NOTE } from '../src/api/graphql/queries/study';
import { REGIST_TASK_NOTE, UPDATE_STUDY_NOTE } from '../src/api/graphql/mutations/study';

jest.mock('../src/api/rest/apiV3', () => {
  const actual = jest.requireActual('../src/api/rest/apiV3');
  return { ...actual, apiV3: jest.fn() };
});

const api = apiV3 as jest.MockedFunction<typeof apiV3>;

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
  const activities = '{"v":1,"concepts":[{"id":1,"title":"일반항"}],"quizIds":[45]}';

  function makeClient() {
    return { query: jest.fn(), mutate: jest.fn().mockResolvedValue({ data: {} }) };
  }
  function signIn() {
    authStore.dispatch({ type: 'RESTORE_TOKEN', item: { token: 'tok' } });
  }

  beforeEach(() => {
    api.mockReset();
    authStore.dispatch({ type: 'SIGN_OUT' });
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  afterEach(() => jest.restoreAllMocks());

  describe('Java API (apiv3)', () => {
    beforeEach(signIn);

    it('fetchNote GETs /api/study-notes/{taskId} and maps the note', async () => {
      const client = makeClient();
      api.mockResolvedValue({ note: { taskId: 7, description: 'd', achievementRate: 75, noteType: 'topic', activities } });
      const result = await createStudyNoteFetchers(client as never).fetchNote(7);
      expect(api).toHaveBeenCalledWith('/api/study-notes/7', 'tok');
      expect(result).toEqual({ taskId: 7, description: 'd', achievementRate: 75, noteType: 'topic', activities, tutorDescription: undefined });
      expect(client.query).not.toHaveBeenCalled();
    });

    it('fetchNote returns null for { note: null }', async () => {
      api.mockResolvedValue({ note: null });
      expect(await createStudyNoteFetchers(makeClient() as never).fetchNote(7)).toBeNull();
    });

    it('register POSTs and update PUTs the full input including activities', async () => {
      const client = makeClient();
      api.mockResolvedValue({ note: { taskId: 7 } });
      const f = createStudyNoteFetchers(client as never);
      await f.register(7, { ...input, activities });
      expect(api).toHaveBeenLastCalledWith('/api/study-notes/7', 'tok', { method: 'POST', body: { ...input, activities } });
      await f.update(7, { ...input, activities });
      expect(api).toHaveBeenLastCalledWith('/api/study-notes/7', 'tok', { method: 'PUT', body: { ...input, activities } });
      expect(client.mutate).not.toHaveBeenCalled();
    });

    it('request errors (409, 400) are thrown, not sent to GraphQL', async () => {
      const client = makeClient();
      const f = createStudyNoteFetchers(client as never);
      api.mockRejectedValueOnce(new ApiV3Error(409, '이미 있어요'));
      await expect(f.register(7, input)).rejects.toThrow('이미 있어요');
      api.mockRejectedValueOnce(new ApiV3Error(400, '과제를 찾을 수 없습니다'));
      await expect(f.fetchNote(7)).rejects.toThrow('과제를 찾을 수 없습니다');
      expect(client.mutate).not.toHaveBeenCalled();
      expect(client.query).not.toHaveBeenCalled();
    });

    it('409 on register leads persistNote to refetch and update', async () => {
      const f = createStudyNoteFetchers(makeClient() as never);
      api
        .mockRejectedValueOnce(new ApiV3Error(409, 'dup')) // POST
        .mockResolvedValueOnce({ note: { taskId: 7, description: '예전' } }) // GET
        .mockResolvedValueOnce({ note: { taskId: 7 } }); // PUT
      await persistNote(f, 7, input, null);
      expect(api.mock.calls.map((c) => c[2]?.method ?? 'GET')).toEqual(['POST', 'GET', 'PUT']);
    });
  });

  describe('GraphQL fallback', () => {
    it('falls back when the Java API is unavailable (404 / 5xx / network) and drops activities', async () => {
      signIn();
      const client = makeClient();
      client.query.mockResolvedValue({ data: { studyNote: { taskId: 7, description: 'g' } } });
      const f = createStudyNoteFetchers(client as never);

      api.mockRejectedValueOnce(new ApiV3Error(404, 'not found'));
      expect(await f.fetchNote(7)).toEqual({ taskId: 7, description: 'g', tutorDescription: undefined });
      expect(client.query).toHaveBeenCalledWith({ query: STUDY_NOTE, variables: { taskId: 7 }, fetchPolicy: 'network-only' });

      api.mockRejectedValueOnce(new ApiV3Error(503, 'down'));
      await f.register(7, { ...input, activities });
      expect(client.mutate).toHaveBeenLastCalledWith({ mutation: REGIST_TASK_NOTE, variables: { taskId: 7, ...input } });

      api.mockRejectedValueOnce(new TypeError('Network request failed'));
      await f.update(7, { ...input, activities });
      expect(client.mutate).toHaveBeenLastCalledWith({ mutation: UPDATE_STUDY_NOTE, variables: { taskId: 7, ...input } });
    });

    it('uses GraphQL directly when there is no token', async () => {
      const client = makeClient();
      client.query.mockResolvedValue({ data: { studyNote: null } });
      const f = createStudyNoteFetchers(client as never);
      expect(await f.fetchNote(7)).toBeNull();
      await f.update(7, { ...input, activities });
      expect(api).not.toHaveBeenCalled();
      expect(client.mutate).toHaveBeenLastCalledWith({ mutation: UPDATE_STUDY_NOTE, variables: { taskId: 7, ...input } });
    });

    it('GraphQL register / update throw on a negative result (unauthenticated)', async () => {
      const client = makeClient();
      const f = createStudyNoteFetchers(client as never);
      client.mutate.mockResolvedValueOnce({ data: { registerTaskNote: -1 } });
      await expect(f.register(7, input)).rejects.toThrow('저장하지 못했어요');
      client.mutate.mockResolvedValueOnce({ data: { updateTaskNote: -1 } });
      await expect(f.update(7, input)).rejects.toThrow('저장하지 못했어요');
      client.mutate.mockResolvedValueOnce({ data: { updateTaskNote: 1 } });
      await expect(f.update(7, input)).resolves.toBeUndefined();
    });

    it('GraphQL documents do not carry activities (the GraphQL server has no such field)', () => {
      expect(print(STUDY_NOTE)).not.toContain('activities');
      expect(print(REGIST_TASK_NOTE)).not.toContain('activities');
      expect(print(UPDATE_STUDY_NOTE)).not.toContain('activities');
    });
  });
});
