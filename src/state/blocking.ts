/**
 * 앱 차단 로딩(GlobalLoadingOverlay용) — 기존 AppCtx의 beginBlocking/endBlocking에서 이전.
 * 동작은 원본과 같다: id 집합이 비어 있지 않으면 차단 중, timeoutMs가 있으면 자동 해제.
 */
import { createStore } from './createStore';

export type BlockingId = string;

type Action = { type: 'BLOCKING_BEGIN'; id: BlockingId } | { type: 'BLOCKING_END'; id: BlockingId };

const reducer = (ids: BlockingId[], action: Action): BlockingId[] => {
  switch (action.type) {
    case 'BLOCKING_BEGIN':
      return ids.includes(action.id) ? ids : [...ids, action.id];
    case 'BLOCKING_END':
      return ids.includes(action.id) ? ids.filter((x) => x !== action.id) : ids;
  }
};

export const blockingStore = createStore(reducer, [] as BlockingId[]);

const timers = new Map<BlockingId, ReturnType<typeof setTimeout>>();

export function beginBlocking(id: BlockingId, opts?: { timeoutMs?: number }) {
  blockingStore.dispatch({ type: 'BLOCKING_BEGIN', id });
  clearTimeout(timers.get(id));
  timers.delete(id);
  if (opts?.timeoutMs && opts.timeoutMs > 0) {
    timers.set(
      id,
      setTimeout(() => {
        timers.delete(id);
        blockingStore.dispatch({ type: 'BLOCKING_END', id });
      }, opts.timeoutMs),
    );
  }
}

export function endBlocking(id: BlockingId) {
  clearTimeout(timers.get(id));
  timers.delete(id);
  blockingStore.dispatch({ type: 'BLOCKING_END', id });
}

export const useIsBlocking = () => blockingStore.useStore().length > 0;

/** 기존 AppCtx의 LOCAL_OVERLAY_ON/OFF: 화면이 자체 전체 화면 오버레이를 가질 때 전역 오버레이를 숨긴다. */
export const localOverlayStore = createStore((_: boolean, active: boolean) => active, false);
