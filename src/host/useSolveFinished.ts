// 캔버스 화면이 사라질 때 그동안의 활동 기록을 task 키로 남기고 solve_finished를 한 번 보낸다. 나가기 버튼·뒤로가기·제스처 등 모든 종료 경로를 언마운트 한곳에서 처리한다.
import { useCallback, useEffect, useRef } from 'react';
import { getAgentSession } from '../agent/useAgentSession';
import { appendActivity } from '../kit/study-note/activity';
import { canvasActivityStore } from '../state/canvasActivity';
import { storage } from '../storage';

export function useSolveFinished(a: { taskId?: number; kind: 'self' | 'topic_live' | 'hotline' }): { countSolved(): void } {
  const count = useRef(0);
  const latest = useRef(a);
  latest.current = a;
  useEffect(() => {
    // 이번에 들어온 캔버스의 활동 기록만 모은다 — 앞 캔버스에서 남은 것을 비운다
    canvasActivityStore.dispatch({ type: 'reset' });
    return () => {
      const { taskId, kind } = latest.current;
      // 풀이를 올리지 않아 taskId가 없으면 기록을 버린다(다음 마운트의 reset이 지운다)
      if (taskId) appendActivity(storage, taskId, canvasActivityStore.getState());
      getAgentSession().emit('solve_finished', { ...(taskId ? { taskId } : {}), kind, solvedCount: count.current });
    };
  }, []);
  const countSolved = useCallback(() => {
    count.current += 1;
  }, []);
  return { countSolved };
}
