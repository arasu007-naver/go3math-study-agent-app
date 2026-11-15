// 캔버스에 한 번 들어가 있는 동안 한 일(조회한 개념, 받은 퀴즈). 캔버스가 마운트될 때 비우고,
// 나갈 때 useSolveFinished가 task 키로 MMKV에 옮긴다(docs/superpowers/specs/2026-11-14-study-note-activities-design.md §4.1).
import { emptyActivities, isEmptyActivities, mergeActivities, type Activities } from '../kit/study-note/activity';
import { createStore } from './createStore';

type Action =
  | { type: 'reset' }
  | { type: 'concepts'; concepts: { id: number; rawTitle: string }[] }
  | { type: 'quiz'; quizId: number };

function reducer(state: Activities, action: Action): Activities {
  switch (action.type) {
    case 'reset':
      return isEmptyActivities(state) ? state : emptyActivities();
    case 'concepts':
      return mergeActivities(state, {
        ...emptyActivities(),
        concepts: action.concepts.map((c) => ({ id: c.id, title: c.rawTitle })),
      });
    case 'quiz':
      if (!Number.isFinite(action.quizId)) return state;
      return mergeActivities(state, { ...emptyActivities(), quizIds: [action.quizId] });
  }
}

export const canvasActivityStore = createStore(reducer, emptyActivities());
