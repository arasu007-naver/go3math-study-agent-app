// 캔버스에서 한 일(조회한 개념, 받은 퀴즈)의 기록. task_note.activities에 JSON 문자열로 저장한다.
// 학습장을 저장하기 전까지는 task별로 MMKV에 둔다(초안과 같은 방식).
import type { KeyValueStore } from '../../storage/types';

export type Activities = { v: 1; concepts: { id: number; title: string }[]; quizIds: number[] };

export function emptyActivities(): Activities {
  return { v: 1, concepts: [], quizIds: [] };
}

export function isEmptyActivities(a: Activities): boolean {
  return a.concepts.length === 0 && a.quizIds.length === 0;
}

/** id 기준 합집합. 순서는 a 먼저, 그다음 b에서 새로 나온 것 */
export function mergeActivities(a: Activities, b: Activities): Activities {
  const concepts: Activities['concepts'] = [];
  for (const c of [...a.concepts, ...b.concepts]) {
    if (!concepts.some((p) => p.id === c.id)) concepts.push({ id: c.id, title: c.title });
  }
  return { v: 1, concepts, quizIds: [...new Set([...a.quizIds, ...b.quizIds])] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

const isId = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

/** null·깨진 JSON·모양이 다른 값은 emptyActivities(). 모양이 맞는 항목만 남긴다 */
export function parseActivities(raw: string | null | undefined): Activities {
  const out = emptyActivities();
  if (!raw) return out;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return out;
  }
  if (!isRecord(parsed)) return out;
  if (Array.isArray(parsed.concepts)) {
    for (const c of parsed.concepts) {
      if (isRecord(c) && isId(c.id) && typeof c.title === 'string') out.concepts.push({ id: c.id, title: c.title });
    }
  }
  if (Array.isArray(parsed.quizIds)) out.quizIds = parsed.quizIds.filter(isId);
  // 같은 id가 두 번 들어 있어도 한 번만 남긴다
  return mergeActivities(out, emptyActivities());
}

export const activityKey = (taskId: number): string => `agent:studyNoteActivity:${taskId}`;

export function loadActivity(store: KeyValueStore, taskId: number): Activities {
  return parseActivities(store.getString(activityKey(taskId)));
}

/** 이미 있는 기록에 합쳐 쓴다. add가 비었으면 쓰지 않는다 */
export function appendActivity(store: KeyValueStore, taskId: number, add: Activities): void {
  if (isEmptyActivities(add)) return;
  store.set(activityKey(taskId), JSON.stringify(mergeActivities(loadActivity(store, taskId), add)));
}

export function clearActivity(store: KeyValueStore, taskId: number): void {
  store.remove(activityKey(taskId));
}
