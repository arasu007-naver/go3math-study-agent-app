import { authStore } from '../src/state/auth';
import { beginBlocking, blockingStore, endBlocking } from '../src/state/blocking';
import { migrateLegacyStorage, restoreSession } from '../src/state/bootstrap';
import { uiReducer, defaultUIState } from '../src/state/ui';
import type { KeyValueStore } from '../src/storage/types';

jest.mock('react-native-mmkv', () => {
  const m = new Map<string, string>();
  return { createMMKV: () => ({ getString: (k: string) => m.get(k), set: (k: string, v: string) => m.set(k, v), remove: (k: string) => m.delete(k) }) };
});

const memory = (init: Record<string, string> = {}): KeyValueStore & { data: Map<string, string> } => {
  const data = new Map(Object.entries(init));
  return { data, getString: (k) => data.get(k), set: (k, v) => void data.set(k, v), remove: (k) => void data.delete(k) };
};

describe('legacy storage migration (§3.5.1)', () => {
  it('marks legacy storage once and keeps every existing key', () => {
    const legacy = { 'app-token': 'tkn', canvasStrokeColor: '#000', syncPoint: '3' };
    const store = memory(legacy);
    expect(migrateLegacyStorage(store)).toEqual({ legacy: true });
    expect(migrateLegacyStorage(store)).toEqual({ legacy: false }); // idempotent
    for (const [k, v] of Object.entries(legacy)) expect(store.getString(k)).toBe(v);
    expect(store.getString('schema-version')).toBe('3');
  });

  it('restores the legacy app-token into the auth store', () => {
    restoreSession(memory({ 'app-token': 'legacy-token' }));
    expect(authStore.getState()).toMatchObject({ appToken: 'legacy-token', isAuthenticated: true, isLoading: false });
  });
});

describe('migrated reducers keep legacy behavior', () => {
  it('ui reducer', () => {
    const s = uiReducer(defaultUIState, { type: 'CHANGE_STUDY_CATEGORY', item: { category: 'pre-exams' } });
    expect(s.currentStudyCategory).toBe('pre-exams');
    expect(uiReducer(s, { type: 'TOGGLE_DARK' }).dark).toBe(true);
  });

  it('auth store sign out', () => {
    authStore.dispatch({ type: 'SIGN_OUT' });
    expect(authStore.getState()).toMatchObject({ appToken: null, isAuthenticated: false });
  });
});

describe('blocking (AppCtx beginBlocking/endBlocking)', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('tracks ids and auto-ends after timeout', () => {
    beginBlocking('a');
    beginBlocking('a');
    beginBlocking('b', { timeoutMs: 1000 });
    expect(blockingStore.getState()).toEqual(['a', 'b']);
    jest.advanceTimersByTime(1000);
    expect(blockingStore.getState()).toEqual(['a']);
    endBlocking('a');
    expect(blockingStore.getState()).toEqual([]);
  });
});
