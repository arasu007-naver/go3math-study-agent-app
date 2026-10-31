import { useSyncExternalStore } from 'react';

// 기존 Context + useReducer를 화면 밖 모듈 store로 옮긴다(Provider 불필요, 폴더블 전환 시에도 유지).
export function createStore<S, A>(reducer: (state: S, action: A) => S, initial: S) {
  let state = initial;
  const listeners = new Set<() => void>();
  const subscribe = (fn: () => void) => {
    listeners.add(fn);
    return () => void listeners.delete(fn);
  };
  const getState = () => state;
  const dispatch = (action: A) => {
    const next = reducer(state, action);
    if (next === state) return;
    state = next;
    listeners.forEach((l) => l());
  };
  const useStore = () => useSyncExternalStore(subscribe, getState, getState);
  return { getState, dispatch, subscribe, useStore };
}
