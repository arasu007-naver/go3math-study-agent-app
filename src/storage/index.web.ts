import type { KeyValueStore } from './types';

// 웹 미리보기용. 접근이 막힌 환경(프라이빗 창 등)에서는 저장하지 않는다.
export const storage: KeyValueStore = {
  getString: (k) => {
    try {
      return globalThis.localStorage?.getItem(k) ?? undefined;
    } catch {
      return undefined;
    }
  },
  set: (k, v) => {
    try {
      globalThis.localStorage?.setItem(k, v);
    } catch {}
  },
  remove: (k) => {
    try {
      globalThis.localStorage?.removeItem(k);
    } catch {}
  },
};
