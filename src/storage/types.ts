export interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
}

/** 기존 앱이 쓰던 MMKV 키(§3.5.1). 이름을 바꾸지 않는다. 새 앱 전용 키는 `agent:` 접두사. */
export const LEGACY_KEYS = {
  appToken: 'app-token',
  alertMessage: 'alert-message',
  schemaVersion: 'schema-version',
} as const;
