/**
 * 첫 실행 처리 — 기존 Go3MathClassProvider의 readItemFromStorage(app-token 복원) +
 * 명세서 §3.5.1 레거시 마이그레이터. 멱등이며 기존 키는 지우지 않는다(롤백 대비).
 */
import { Dimensions } from 'react-native';
import { createApolloClient } from '../api/graphql/client';
import { storage } from '../storage';
import { LEGACY_KEYS, type KeyValueStore } from '../storage/types';
import { initialMode } from '../layout/deviceMode';
import { authStore } from './auth';

export const SCHEMA_VERSION = '3';

/** 레거시(v2.x) 저장소면 schema-version=3을 기록한다. 다른 키는 건드리지 않는다. */
export function migrateLegacyStorage(store: KeyValueStore): { legacy: boolean } {
  if (store.getString(LEGACY_KEYS.schemaVersion)) return { legacy: false };
  store.set(LEGACY_KEYS.schemaVersion, SCHEMA_VERSION);
  return { legacy: true };
}

export function restoreSession(store: KeyValueStore) {
  const token = store.getString(LEGACY_KEYS.appToken);
  if (token) authStore.dispatch({ type: 'RESTORE_TOKEN', item: { token } });
}

export function bootstrap() {
  migrateLegacyStorage(storage);
  restoreSession(storage);
}

export const apolloClient = createApolloClient(
  () => authStore.getState().appToken,
  () => {
    const { width, height } = Dimensions.get('window');
    return initialMode(width, height) === 'tablet' ? 'TABLET' : 'PHONE';
  },
);
