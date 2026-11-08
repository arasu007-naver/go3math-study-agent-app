import type { KeyValueStore } from '../../storage/types';
import type { FormState } from './model';

export const draftKey = (taskId: number): string => `agent:studyNoteDraft:${taskId}`;

export function loadDraft(store: KeyValueStore, taskId: number): FormState | null {
  const raw = store.getString(draftKey(taskId));
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    return parsed as FormState;
  } catch {
    return null;
  }
}

export function saveDraft(store: KeyValueStore, taskId: number, s: FormState): void {
  store.set(draftKey(taskId), JSON.stringify(s));
}

export function clearDraft(store: KeyValueStore, taskId: number): void {
  store.remove(draftKey(taskId));
}
