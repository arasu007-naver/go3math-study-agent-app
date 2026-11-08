import { clearDraft, draftKey, loadDraft, saveDraft } from '../src/kit/study-note/draft';
import { canSave, emptyForm, fromNote, toInput, toggleDifficulty } from '../src/kit/study-note/model';
import type { KeyValueStore } from '../src/storage/types';

function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    getString: (k) => m.get(k),
    set: (k, v) => void m.set(k, v),
    remove: (k) => void m.delete(k),
  };
}

describe('toggleDifficulty', () => {
  it('none clears the other chips', () => {
    expect(toggleDifficulty(['concept'], 'none')).toEqual(['none']);
  });
  it('picking a chip clears none', () => {
    expect(toggleDifficulty(['none'], 'calc')).toEqual(['calc']);
  });
  it('toggling a selected chip removes it', () => {
    expect(toggleDifficulty(['calc'], 'calc')).toEqual([]);
  });
  it('adds another chip alongside', () => {
    expect(toggleDifficulty(['concept'], 'calc')).toEqual(['concept', 'calc']);
  });
});

describe('canSave', () => {
  it('is false for an empty form', () => {
    expect(canSave(emptyForm())).toBe(false);
  });
  it('is true with only an achievement', () => {
    expect(canSave({ ...emptyForm(), achievement: 50 })).toBe(true);
  });
  it('is true with only a chip', () => {
    expect(canSave({ ...emptyForm(), difficulties: ['time'] })).toBe(true);
  });
  it('is false for whitespace-only text', () => {
    expect(canSave({ ...emptyForm(), description: '  ' })).toBe(false);
  });
  it('is true for non-blank text', () => {
    expect(canSave({ ...emptyForm(), expectations: '복습' })).toBe(true);
  });
  it('ignores legacy values', () => {
    expect(canSave({ ...emptyForm(), legacyRate: 60, legacyDifficultyText: '메모' })).toBe(false);
  });
});

describe('toInput', () => {
  const form = {
    ...emptyForm(),
    achievement: 75 as const,
    difficulties: ['concept', 'calc'] as ('concept' | 'calc')[],
    description: '일반항',
    expectations: '복습',
  };
  it('maps self mode', () => {
    expect(toInput(form, 'self')).toEqual({
      achievementRate: 75,
      difficulties: 'concept,calc',
      description: '일반항',
      expectations: '복습',
    });
  });
  it('omits expectations in live mode', () => {
    expect('expectations' in toInput(form, 'live')).toBe(false);
  });
  it('trims and truncates to 200 chars, omitting empty values', () => {
    const out = toInput({ ...emptyForm(), description: ` ${'가'.repeat(250)} `, expectations: '   ' }, 'self');
    expect(out.description).toBe('가'.repeat(200));
    expect('expectations' in out).toBe(false);
    expect('difficulties' in out).toBe(false);
    expect('achievementRate' in out).toBe(false);
  });
  it('prefers the selected achievement over the legacy rate', () => {
    expect(toInput({ ...emptyForm(), achievement: 100, legacyRate: 60 }, 'self').achievementRate).toBe(100);
  });
});

describe('fromNote', () => {
  it('returns an empty form for null', () => {
    expect(fromNote(null)).toEqual(emptyForm());
  });
  it('maps known rates to the chip', () => {
    expect(fromNote({ taskId: 1, achievementRate: 75 }).achievement).toBe(75);
  });
  it('preserves a rate that has no chip', () => {
    const f = fromNote({ taskId: 1, achievementRate: 60 });
    expect(f.achievement).toBeNull();
    expect(f.legacyRate).toBe(60);
    expect(toInput(f, 'self').achievementRate).toBe(60);
  });
  it('preserves free-text difficulties', () => {
    const f = fromNote({ taskId: 1, difficulties: 'concept,함수 그래프가 헷갈림' });
    expect(f.difficulties).toEqual(['concept']);
    expect(f.legacyDifficultyText).toBe('함수 그래프가 헷갈림');
    expect(toInput(f, 'self').difficulties).toBe('concept,함수 그래프가 헷갈림');
  });
  it('loads text fields', () => {
    const f = fromNote({ taskId: 1, description: 'a', expectations: 'b' });
    expect(f.description).toBe('a');
    expect(f.expectations).toBe('b');
  });
});

describe('draft', () => {
  const form = { ...emptyForm(), achievement: 50 as const, description: '메모' };
  it('uses the agent-prefixed key', () => {
    expect(draftKey(7)).toBe('agent:studyNoteDraft:7');
  });
  it('round-trips', () => {
    const s = memoryStore();
    saveDraft(s, 7, form);
    expect(loadDraft(s, 7)).toEqual(form);
  });
  it('returns null when missing or corrupt', () => {
    const s = memoryStore();
    expect(loadDraft(s, 7)).toBeNull();
    s.set(draftKey(7), '{broken');
    expect(loadDraft(s, 7)).toBeNull();
  });
  it('clears', () => {
    const s = memoryStore();
    saveDraft(s, 7, form);
    clearDraft(s, 7);
    expect(loadDraft(s, 7)).toBeNull();
  });
});
