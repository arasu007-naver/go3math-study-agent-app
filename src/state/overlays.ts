// 태블릿에서 Stage 위에 dock이 새로 열리거나 toast가 새로 뜬 횟수.
// Stage 문제 목록의 해답 말풍선은 이 값이 바뀌면 닫힌다(말풍선이 dock·toast 위에 겹쳐 보이지 않게).
import { createStore } from './createStore';

export const overlayStore = createStore((n: number, _action: 'opened') => n + 1, 0);

export const notifyOverlayOpened = () => overlayStore.dispatch('opened');

export const useOverlayOpenCount = () => overlayStore.useStore();
