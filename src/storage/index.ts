import { createMMKV } from 'react-native-mmkv';
import type { KeyValueStore } from './types';

// 명세서 §3.5.1: 기존 앱과 같은 기본 인스턴스(id·경로·암호화 지정 없음)를 열어 레거시 키(app-token 등)를 그대로 읽는다.
const mmkv = createMMKV();

export const storage: KeyValueStore = {
  getString: (k) => mmkv.getString(k),
  set: (k, v) => mmkv.set(k, v),
  remove: (k) => void mmkv.remove(k),
};
