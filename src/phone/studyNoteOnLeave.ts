// 폰 문제 목록 화면을 나갈 때의 학습장 — 태블릿은 캔버스를 나갈 때 useSolveFinished가 하는 일을 폰은 목록 화면이 한다.
// 개념을 조회했거나 풀이 사진을 올렸으면 그 기록을 task 키로 남기고 학습장 시트를 앱이 바로 연다
// (docs/superpowers/specs/2026-11-15-phone-concept-answer-sheet-design.md §3.3).
import { useEffect, useMemo, useRef } from 'react';
import { ensureTaskId, type TaskSpec } from '../adapters/ensureTask';
import { getAgentSession } from '../agent/useAgentSession';
import { appendActivity, emptyActivities, isEmptyActivities, mergeActivities, type Activities } from '../kit/study-note/activity';
import { storage } from '../storage';
import type { KeyValueStore } from '../storage/types';

/** 이 목록의 학습장: 이미 있는 task(taskId) 또는 만들 task의 유형(spec), 그리고 시트에 넘길 값 */
export type LeaveNote = { taskId?: number; spec?: TaskSpec; mode: 'self' | 'live'; title: string; topicHints?: string[] };

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

/** 사진 없이 개념만 조회해도 task를 만든다. task를 만들지 못하면 기록을 버리고 학습장을 띄우지 않는다 */
export async function openStudyNoteOnLeave(a: { note: LeaveNote | null; activity: Activities; uploaded: boolean }, deps: Deps = defaultDeps): Promise<void> {
  if (!a.note || (!a.uploaded && isEmptyActivities(a.activity))) return;
  const { taskId: known, spec, ...sheetProps } = a.note;
  const taskId = known ?? (spec ? await deps.ensureTaskId(undefined, spec) : undefined);
  if (!taskId) return;
  appendActivity(deps.store, taskId, a.activity);
  deps.showSheet('study_note', { taskId, ...sheetProps });
}

/** 화면이 사라질 때(뒤로 버튼·제스처) openStudyNoteOnLeave를 한 번 부른다. 돌려준 함수로 그동안 한 일을 알린다 */
export function useStudyNoteOnLeave() {
  const state = useRef<{ note: LeaveNote | null; activity: Activities; uploaded: boolean }>({ note: null, activity: emptyActivities(), uploaded: false });
  useEffect(
    () => () => {
      void openStudyNoteOnLeave(state.current);
    },
    [],
  );
  return useMemo(
    () => ({
      setNote(note: LeaveNote) {
        state.current.note = note;
      },
      addConcepts(concepts: { id: number; rawTitle: string }[]) {
        state.current.activity = mergeActivities(state.current.activity, {
          ...emptyActivities(),
          concepts: concepts.map((c) => ({ id: c.id, title: c.rawTitle })),
        });
      },
      markUploaded() {
        state.current.uploaded = true;
      },
    }),
    [],
  );
}
