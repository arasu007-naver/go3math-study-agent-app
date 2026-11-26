// 실황 수업(선생님 수업·주제 실황)을 나갈 때의 학습장 — 폰의 openStudyNoteOnLeave와 같은 방식으로 앱이 시트를 직접 연다.
// 이번 방문에 학습 행동(답안 올리기·개념 조회·퀴즈 답안 제출)이 있었을 때만 task를 확보하고 기록을 남긴 뒤 시트를 띄운다.
import { ensureTaskId, type TaskSpec } from '../adapters/ensureTask';
import { getAgentSession } from '../agent/useAgentSession';
import type { LiveClassClosing } from '../kit/live-class/closing';
import { appendActivity, mergeActivities, type Activities } from '../kit/study-note/activity';
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
  a: { taskId?: number; spec: TaskSpec; acted: boolean; activity: Activities; title: string; closing?: LiveClassClosing | null },
  deps: Deps = defaultDeps,
): Promise<void> {
  if (!a.acted) return;
  const taskId = a.taskId ?? (await deps.ensureTaskId(undefined, a.spec));
  if (!taskId) return;
  const c = a.closing;
  // 종료 메시지의 개념·퀴즈는 학생이 직접 받지 않았어도 이번 수업 기록으로 합친다
  appendActivity(deps.store, taskId, c ? mergeActivities(a.activity, { v: 1, concepts: c.concepts, quizIds: c.quizzes.map((q) => q.quizId) }) : a.activity);
  deps.showSheet('study_note', {
    taskId,
    mode: 'live',
    title: a.title,
    ...(c?.description ? { tutorDescription: c.description } : {}),
    ...(c?.quizzes.length ? { quizContents: c.quizzes } : {}),
  });
}
