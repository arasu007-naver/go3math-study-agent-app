// 캔버스 화면이 사라질 때 solve_finished를 한 번 보낸다. 나가기 버튼·뒤로가기·제스처 등 모든 종료 경로를 언마운트 한곳에서 처리한다.
import { useCallback, useEffect, useRef } from 'react';
import { getAgentSession } from '../agent/useAgentSession';

export function useSolveFinished(a: { taskId?: number; kind: 'self' | 'topic_live' | 'hotline' }): { countSolved(): void } {
  const count = useRef(0);
  const latest = useRef(a);
  latest.current = a;
  useEffect(
    () => () => {
      const { taskId, kind } = latest.current;
      getAgentSession().emit('solve_finished', { ...(taskId ? { taskId } : {}), kind, solvedCount: count.current });
    },
    [],
  );
  const countSolved = useCallback(() => {
    count.current += 1;
  }, []);
  return { countSolved };
}
