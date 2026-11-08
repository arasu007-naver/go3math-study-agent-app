// 캔버스를 열기 전에 학습 기록(task)을 보장한다. 실패해도 캔버스는 열려야 하므로 undefined로 돌려주고 client_error만 보고한다.
import { CREATE_SELECTION_TASK } from '../api/graphql/mutations/task';
import { getAgentSession } from '../agent/useAgentSession';
import { apolloClient } from '../state/bootstrap';

export type TaskSpec = { taskType: 'selection' | 'topic' | 'bookmark' | 'hotline' | 'list'; task: Record<string, unknown> };

/** 타임라인이 보여 주는 task만 만든다. 책갈피·목록·선생님 수업은 학습장을 묻지 않으므로 task를 만들지 않는다 */
const CREATABLE: ReadonlySet<TaskSpec['taskType']> = new Set(['selection', 'topic']);

export function createEnsureTask(deps: {
  create(spec: TaskSpec): Promise<number>;
  report(where: string, message: string): void;
}): (taskId: number | undefined, spec: TaskSpec) => Promise<number | undefined> {
  // 서버 createTask는 항상 새 행을 넣는다. 앱 세션 동안 spec별로 만든 id를 기억해 다시 만들지 않는다(실패는 기억하지 않는다)
  const created = new Map<string, number>();
  // 같은 spec으로 동시에 들어온 호출은 task를 한 번만 만든다
  const inflight = new Map<string, Promise<number | undefined>>();
  return (taskId, spec) => {
    if (taskId) return Promise.resolve(taskId);
    if (!CREATABLE.has(spec.taskType)) return Promise.resolve(undefined);
    const key = JSON.stringify(spec);
    const cached = created.get(key);
    if (cached) return Promise.resolve(cached);
    const pending = inflight.get(key);
    if (pending) return pending;
    const run = deps
      .create(spec)
      .then((id) => {
        created.set(key, id);
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

export const ensureTaskId = createEnsureTask({
  async create(spec) {
    const { data } = await apolloClient.mutate<{ createTask: { id: number | string } }>({
      mutation: CREATE_SELECTION_TASK,
      variables: { taskType: spec.taskType, task: JSON.stringify(spec.task) },
    });
    const id = Number(data?.createTask.id);
    if (!id) throw new Error('createTask returned no id');
    return id;
  },
  report: (where, message) => getAgentSession().emit('client_error', { where, message }),
});
