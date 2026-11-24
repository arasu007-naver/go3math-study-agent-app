import { useEffect, useRef } from 'react';
import { onWsReconnected } from './client';

// 웹소켓이 끊겼다 다시 연결되면 callback을 부른다. enabled가 true일 때만 등록한다.
export function useWsReconnected(callback: () => void, enabled: boolean) {
  const ref = useRef(callback);
  ref.current = callback;
  useEffect(() => {
    if (!enabled) return;
    return onWsReconnected(() => ref.current());
  }, [enabled]);
}
