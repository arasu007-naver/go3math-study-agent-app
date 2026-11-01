/**
 * note-canvas 전이용 호환 계층 — 옮긴 파일들이 기존 import(AppCtx, @utils/storage, @utils/index)를 그대로 쓸 수 있게 한다.
 * - AppCtx: 새 앱에는 단일 AppCtx가 없다(§3.2). appToken은 authStore에서 읽고, 실황 수업 상태(currentIdx 등)는 기본값.
 *   Provider 없이 useContext가 기본값을 돌려주므로, state는 읽을 때마다 authStore를 보도록 getter로 둔다.
 * - storage: 기존과 같은 기본 MMKV 인스턴스(getNumber 포함). 펜 색·굵기 등 레거시 키를 그대로 읽고 쓴다.
 * - getBase64StringFromDataURL · sleep · findLargestSmallerThan: 기존 utils/index.js 그대로.
 */
import { createContext } from 'react';
import { createMMKV } from 'react-native-mmkv';
import { authStore } from '../../../state/auth';

type LegacyState = { appToken: string; currentIdx: number; cutSequence: number; lastGuide?: unknown };

export const AppCtx = createContext({
  get state(): LegacyState {
    return { appToken: authStore.getState().appToken ?? '', currentIdx: 0, cutSequence: 0, lastGuide: undefined };
  },
  dispatch(action: { type: string }) {
    if (__DEV__) console.log('[note-canvas] AppCtx.dispatch (무시):', action?.type);
  },
});

export const storage = createMMKV();

export const getBase64StringFromDataURL = (dataURL: string) => dataURL.replace('data:', '').replace(/^.+,/, '');

export const sleep = (milliSec: number) => new Promise((resolve) => setTimeout(resolve, milliSec > 9600 ? 9600 : milliSec));

export const findLargestSmallerThan = (arr: number[], target: number) => {
  let low = 0;
  let high = arr.length - 1;
  let result: number | null = null;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] < target) {
      result = arr[mid];
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  return result;
};
