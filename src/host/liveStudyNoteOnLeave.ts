// 실황 수업(선생님 수업·주제 실황)을 나갈 때의 학습장 — 폰의 openStudyNoteOnLeave와 같은 방식으로 앱이 시트를 직접 연다.
// 이번 방문에 학습 행동(답안 올리기·개념 조회·퀴즈 답안 제출)이 있었을 때만 task를 확보하고 기록을 남긴 뒤 시트를 띄운다.
import { ensureTaskId, type TaskSpec } from '../adapters/ensureTask';
import { getAgentSession } from '../agent/useAgentSession';
import { appendActivity, type Activities } from '../kit/study-note/activity';
import { storage } from '../storage';
import type { KeyValueStore } from '../storage/types';

type Deps = {
  ensureTaskId(taskId: number | undefined, spec: TaskSpec): Promise<number | undefined>;
  store: KeyValueStore;
  showSheet(componentId: string, props: Record<string, unknown>): void;
};

const defaultDeps: Deps = {
  ensureTaskId,
  store: storage,
  showSheet: (componentId, props) => getAgentSession().showLocalSheet(componentId, props),
};

/** task를 만들지 못하면(ensureTaskId가 client_error를 이미 보고) 기록을 버리고 시트를 띄우지 않는다 */
export async function openLiveStudyNoteOnLeave(
  a: { taskId?: number; spec: TaskSpec; acted: boolean; activity: Activities; title: string },
  deps: Deps = defaultDeps,
): Promise<void> {
  if (!a.acted) return;
  const taskId = a.taskId ?? (await deps.ensureTaskId(undefined, a.spec));
  if (!taskId) return;
  appendActivity(deps.store, taskId, a.activity);
  deps.showSheet('study_note', { taskId, mode: 'live', title: a.title });
}
