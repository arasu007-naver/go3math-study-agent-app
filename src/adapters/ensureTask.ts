// 풀이를 처음 올릴 때 학습 기록(task)을 만든다(캔버스에 들어올 때는 만들지 않는다). 실패해도 풀이 저장은 이어져야 하므로 undefined로 돌려주고 client_error만 보고한다.
import { CREATE_COLLECTION_TASK, CREATE_SELECTION_TASK } from '../api/graphql/mutations/task';
import { CHECK_TASK, MY_TASKS, ONLINE_CLASS_LESSON_NOTE } from '../api/graphql/queries';
import { getLessonNotesOfTopic, latestTopicLiveNoteId } from '../api/rest/lessonNotes';
import { getAgentSession } from '../agent/useAgentSession';
import { authStore } from '../state/auth';
import { apolloClient } from '../state/bootstrap';

export type TaskSpec = { taskType: 'selection' | 'topic' | 'topic-live' | 'bookmark' | 'hotline' | 'list'; task: Record<string, unknown> };

/**
 * 책갈피 목록의 지문: 문제를 `sourceType-sourceId`로 바꿔 중복을 없애고 정렬해 이어 붙인다.
 * 지문이 같으면 같은 목록이다 — 순서·날짜(regDate)는 보지 않고, 문제가 하나라도 더해지거나 빠지면 다른 목록이다
 */
export function bookmarkFingerprint(units: unknown): string {
  const keys = (Array.isArray(units) ? units : [])
    .filter((u): u is { sourceType: unknown; sourceId: unknown } => !!u && typeof u === 'object' && 'sourceType' in u && 'sourceId' in u)
    .map((u) => `${String(u.sourceType)}-${Number(u.sourceId)}`);
  return [...new Set(keys)].sort().join('|');
}

/** bookmark task의 task(JSON 문자열) → 지문. 선생님이 준 책갈피 수업(tutor)이거나 깨진 값이면 undefined(내 책갈피 목록과 비교하지 않는다) */
export function bookmarkTaskFingerprint(raw: string | null | undefined): string | undefined {
  try {
    const stored = raw ? JSON.parse(raw) : null;
    if (!stored || typeof stored !== 'object' || stored.tutor) return undefined;
    return bookmarkFingerprint(stored.units);
  } catch {
    return undefined;
  }
}

const isLiveClass = (spec: TaskSpec) => spec.taskType === 'hotline' || spec.taskType === 'topic-live';

export function createEnsureTask(deps: {
  create(spec: TaskSpec): Promise<number>;
  report(where: string, message: string): void;
}): (taskId: number | undefined, spec: TaskSpec) => Promise<number | undefined> {
  // 서버 createTask는 항상 새 행을 넣는다. 앱 세션 동안 spec별로 만든 id를 기억해 다시 만들지 않는다(실패는 기억하지 않는다).
  // 실황 수업은 기억하지 않는다 — 같은 선생님·주제라도 수업(lesson_note)이 바뀌면 다른 task여야 하고, create가 그 수업의 내 task를 먼저 찾는다
  const created = new Map<string, number>();
  // 같은 spec으로 동시에 들어온 호출은 task를 한 번만 만든다
  const inflight = new Map<string, Promise<number | undefined>>();
  return (taskId, spec) => {
    // 모든 유형(책갈피·목록·선생님 수업 포함)에 task를 만든다 — 풀이 기록(CREATE_RECORD)을 task로 추적하기 위해
    if (taskId) return Promise.resolve(taskId);
    const key = JSON.stringify(spec);
    const remember = !isLiveClass(spec);
    const cached = remember ? created.get(key) : undefined;
    if (cached) return Promise.resolve(cached);
    const pending = inflight.get(key);
    if (pending) return pending;
    const run = deps
      .create(spec)
      .then((id) => {
        if (remember) created.set(key, id);
        return id;
      })
      .catch((e: unknown) => {
        deps.report('study_note.ensure_task', e instanceof Error ? e.message : String(e));
        return undefined;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, run);
    return run;
  };
}

export type TaskCreateDeps = {
  /** createTask mutation → 새 task id */
  createTask(variables: { taskType: string; task?: string; collectionId?: number }): Promise<number>;
  /** 선생님 수업을 시작할 때 발급된 lesson_note id */
  hotlineLessonNoteId(tutorId: string): Promise<number | undefined>;
  /** 그 주제에서 가장 최근에 시작한 주제 실황 수업의 lesson_note id */
  topicLiveLessonNoteId(topicId: number): Promise<number | undefined>;
  /** 내 task 중 그 유형·collectionId인 것(만들지 않는다). 없으면 undefined */
  findExistingTask(a: { taskType: string; collectionId: number }): Promise<number | undefined>;
  /** 가장 최근의 내 bookmark task가 이 지문(같은 책갈피 목록)이면 그 id(만들지 않는다). 아니면 undefined */
  findBookmarkTask(fingerprint: string): Promise<number | undefined>;
  /** 서버 findMyTask: 내 task를 찾거나 없으면 만들어 id를 준다(실패는 -1) */
  findMyTask(variables: { taskType: string; targetId: number }): Promise<number>;
};

/**
 * spec → task 만들기.
 * - topic: collectionId = 주제 id
 * - hotline·topic-live: collectionId = lesson_note.id(선생님이 수업을 시작할 때 생긴 행). 타임라인은 그 행에서 문제 목록을 읽는다.
 *   같은 수업의 내 task가 이미 있으면(캔버스를 나갔다 다시 들어온 경우) 새로 만들지 않고 그 task를 쓴다.
 *   lesson_note를 못 찾으면 task를 만들지 않는다(다른 id를 넣으면 엉뚱한 수업 노트를 가리키게 된다)
 * - bookmark: 책갈피 목록이 바로 이전 bookmark task와 같으면(지문 일치) 그 task를 이어 쓰고, 다르면 새 task를 만든다
 * - 그 밖: task(JSON 문자열)에 내용을 담는다
 */
const liveLessonNoteId = (deps: TaskCreateDeps, spec: TaskSpec) =>
  spec.taskType === 'hotline' ? deps.hotlineLessonNoteId(String(spec.task.tutorId)) : deps.topicLiveLessonNoteId(Number(spec.task.topicId));

/**
 * 실황 수업 캔버스에 들어올 때: 지금 수업(lesson_note)의 내 task가 이미 있으면 그 id(이어서 진행한다). 없거나 조회에 실패하면 undefined.
 * task를 만들지는 않는다 — 만드는 것은 첫 풀이를 올릴 때다
 */
export function createFindLiveClassTask(deps: TaskCreateDeps, report: (where: string, message: string) => void): (spec: TaskSpec) => Promise<number | undefined> {
  return async (spec) => {
    if (!isLiveClass(spec)) return undefined;
    try {
      const lessonNoteId = await liveLessonNoteId(deps, spec);
      return lessonNoteId ? await deps.findExistingTask({ taskType: spec.taskType, collectionId: lessonNoteId }) : undefined;
    } catch (e) {
      report('study_note.find_live_task', e instanceof Error ? e.message : String(e));
      return undefined;
    }
  };
}

export function createTaskOf(deps: TaskCreateDeps): (spec: TaskSpec) => Promise<number> {
  return async (spec) => {
    switch (spec.taskType) {
      case 'topic':
        return deps.createTask({ taskType: spec.taskType, collectionId: Number(spec.task.topicId) });
      case 'hotline': {
        const lessonNoteId = await liveLessonNoteId(deps, spec);
        if (!lessonNoteId) throw new Error('hotline lesson_note not found');
        // 서버 findMyTask가 (나, lesson_note)로 이미 있는 task를 찾아 주므로 같은 수업에 task가 두 번 생기지 않는다
        const id = await deps.findMyTask({ taskType: spec.taskType, targetId: lessonNoteId });
        if (!(id > 0)) throw new Error(`findMyTask(hotline, ${lessonNoteId}) returned ${id}`);
        return id;
      }
      case 'topic-live': {
        const lessonNoteId = await liveLessonNoteId(deps, spec);
        if (!lessonNoteId) throw new Error('topic-live lesson_note not found');
        const existing = await deps.findExistingTask({ taskType: spec.taskType, collectionId: lessonNoteId });
        if (existing) return existing;
        return deps.createTask({ taskType: spec.taskType, collectionId: lessonNoteId });
      }
      case 'bookmark': {
        const existing = await deps.findBookmarkTask(bookmarkFingerprint(spec.task.units));
        if (existing) return existing;
        return deps.createTask({ taskType: spec.taskType, task: JSON.stringify(spec.task) });
      }
      default:
        return deps.createTask({ taskType: spec.taskType, task: JSON.stringify(spec.task) });
    }
  };
}

const appToken = () => {
  const token = authStore.getState().appToken;
  if (!token) throw new Error('로그인이 필요해요');
  return token;
};

/** 내 학습 기록에서 찾아볼 쪽수(최근 방문순, 쪽당 36개). 진행 중인 수업·최근 책갈피의 task는 앞쪽에 있다 */
const FIND_TASK_PAGES = 3;
const FIND_TASK_PAGE_SIZE = 36;

const report = (where: string, message: string) => getAgentSession().emit('client_error', { where, message });

type MyTask = { id: number | string; taskType: string; collectionId?: number | string | null; task?: string | null };

/** 내 학습 기록(최근 방문순)을 앞에서부터 훑어 조건에 맞는 첫 task. 없으면 undefined */
async function findInMyTasks(match: (t: MyTask) => boolean): Promise<MyTask | undefined> {
  for (let page = 0; page < FIND_TASK_PAGES; page++) {
    const { data } = await apolloClient.query<{ getTaskHistory: MyTask[] | null }>({
      query: MY_TASKS,
      variables: { page, pageSize: FIND_TASK_PAGE_SIZE },
      fetchPolicy: 'network-only',
    });
    const tasks = data?.getTaskHistory ?? [];
    const found = tasks.find(match);
    if (found) return found;
    if (tasks.length < FIND_TASK_PAGE_SIZE) break;
  }
  return undefined;
}

const taskDeps: TaskCreateDeps = {
  async createTask({ taskType, task, collectionId }) {
    const { data } = await apolloClient.mutate<{ createTask: { id: number | string } }>(
      collectionId !== undefined
        ? { mutation: CREATE_COLLECTION_TASK, variables: { taskType, collectionId } }
        : { mutation: CREATE_SELECTION_TASK, variables: { taskType, task } },
    );
    const id = Number(data?.createTask.id);
    if (!id) throw new Error('createTask returned no id');
    return id;
  },
  async hotlineLessonNoteId(tutorId) {
    const { data } = await apolloClient.query<{ onlineClassOfTutor: { lessonNoteId: number | null } | null }>({
      query: ONLINE_CLASS_LESSON_NOTE,
      variables: { tutorId },
      fetchPolicy: 'network-only',
    });
    return data?.onlineClassOfTutor?.lessonNoteId ?? undefined;
  },
  async topicLiveLessonNoteId(topicId) {
    return latestTopicLiveNoteId(await getLessonNotesOfTopic(topicId, appToken()));
  },
  async findMyTask(variables) {
    const { data } = await apolloClient.query<{ findMyTask: number | null }>({ query: CHECK_TASK, variables, fetchPolicy: 'network-only' });
    return Number(data?.findMyTask ?? -1);
  },
  async findExistingTask({ taskType, collectionId }) {
    const found = await findInMyTasks((t) => t.taskType === taskType && Number(t.collectionId) === collectionId);
    return found ? Number(found.id) : undefined;
  },
  // 바로 이전 책갈피 공부(가장 최근의 내 bookmark task) 하나와만 비교한다 — 그보다 오래된 task는 목록이 같아도 이어 쓰지 않는다
  async findBookmarkTask(fingerprint) {
    const latest = await findInMyTasks((t) => t.taskType === 'bookmark' && bookmarkTaskFingerprint(t.task) !== undefined);
    return latest && bookmarkTaskFingerprint(latest.task) === fingerprint ? Number(latest.id) : undefined;
  },
};

export const ensureTaskId = createEnsureTask({ create: createTaskOf(taskDeps), report });

export const findLiveClassTaskId = createFindLiveClassTask(taskDeps, report);
