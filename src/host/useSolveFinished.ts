// 캔버스 화면이 사라질 때 그동안의 활동 기록을 task 키로 남기고 solve_finished를 한 번 보낸다. 나가기 버튼·뒤로가기·제스처 등 모든 종료 경로를 언마운트 한곳에서 처리한다.
import { useCallback, useEffect, useRef } from 'react';
import { getAgentSession } from '../agent/useAgentSession';
import type { TaskSpec } from '../adapters/ensureTask';
import { openLiveStudyNoteOnLeave } from './liveStudyNoteOnLeave';
import { appendActivity } from '../kit/study-note/activity';
import { canvasActivityStore } from '../state/canvasActivity';
import { bumpStudyData } from '../state/studyData';
import { storage } from '../storage';

type Args = { taskId?: number; kind: 'self' | 'topic_live' | 'hotline'; liveSpec?: TaskSpec; title?: string };

// 지금 활동 기록(canvasActivityStore)을 모으고 있는 캔버스. 캔버스는 한 번에 하나만 떠 있다(widgets.openCanvas가 열린 캔버스를 스택에서 뺀다).
let owner: { current: Args } | null = null;

/** 캔버스 화면이 떠 있는지 — 새 캔버스를 올릴 때 열린 캔버스를 빼야 하는지 판단한다 */
export const isCanvasOpen = (): boolean => owner !== null;

/** 풀이를 올리지 않아 taskId가 없으면 기록을 버린다 — 풀이 없는 조회는 남기지 않는다 */
function flushActivity(a: Args) {
  if (a.taskId) appendActivity(storage, a.taskId, canvasActivityStore.getState());
  canvasActivityStore.dispatch({ type: 'reset' });
}

export function useSolveFinished(a: Args): { countSolved(): void; markActed(): void; markClassClosed(): void } {
  const count = useRef(0);
  const acted = useRef(false);
  const closed = useRef(false);
  const latest = useRef(a);
  latest.current = a;
  useEffect(() => {
    // 캔버스를 바꿔 끼울 때는 새 화면이 먼저 마운트되고 옛 화면이 나중에 언마운트될 수 있다.
    // 옛 캔버스의 기록을 여기서 그 task에 남기고 비워, 두 캔버스의 기록이 섞이지 않게 한다.
    if (owner) flushActivity(owner.current);
    else canvasActivityStore.dispatch({ type: 'reset' });
    owner = latest;
    return () => {
      const { taskId, kind, liveSpec, title } = latest.current;
      const live = kind !== 'self' && !!liveSpec;
      // 새 캔버스가 이미 기록을 넘겨받았으면(owner가 바뀜) 여기서는 쓰지 않는다
      if (owner === latest) {
        if (live) {
          // 실황 수업: 학습 행동이 있었으면 앱이 학습장 시트를 직접 연다(개념 조회만 해도 행동)
          const activity = canvasActivityStore.getState();
          const didAct = acted.current || count.current > 0 || activity.concepts.length > 0;
          canvasActivityStore.dispatch({ type: 'reset' });
          void openLiveStudyNoteOnLeave({ taskId, spec: liveSpec, acted: didAct || closed.current, activity, title: title ?? '' });
        } else flushActivity(latest.current);
        owner = null;
      }
      // 실황 수업은 앱이 시트를 직접 띄우므로 에이전트가 같은 시트를 또 띄우지 않게 solve_finished를 보내지 않는다
      if (!live) getAgentSession().emit('solve_finished', { ...(taskId ? { taskId } : {}), kind, solvedCount: count.current });
      bumpStudyData();
    };
  }, []);
  const countSolved = useCallback(() => {
    count.current += 1;
  }, []);
  const markActed = useCallback(() => {
    acted.current = true;
  }, []);
  const markClassClosed = useCallback(() => {
    closed.current = true;
  }, []);
  return { countSolved, markActed, markClassClosed };
}
