export type DifficultyCode = 'concept' | 'setup' | 'calc' | 'time' | 'none';
export type Achievement = 25 | 50 | 75 | 100;

export const ACHIEVEMENTS: readonly {
  value: Achievement;
  label: '조금' | '절반' | '거의' | '다 했어요';
}[] = [
  { value: 25, label: '조금' },
  { value: 50, label: '절반' },
  { value: 75, label: '거의' },
  { value: 100, label: '다 했어요' },
];

export const DIFFICULTIES: readonly { code: DifficultyCode; label: string }[] = [
  { code: 'concept', label: '개념' },
  { code: 'setup', label: '식 세우기' },
  { code: 'calc', label: '계산' },
  { code: 'time', label: '시간' },
  { code: 'none', label: '없음' },
];

export type StudyNote = {
  taskId: number;
  description?: string | null;
  difficulties?: string | null;
  expectations?: string | null;
  achievementRate?: number | null;
  noteType?: string | null;
  tutorDescription?: string | null;
};

export type StudyNoteInput = {
  description?: string;
  difficulties?: string;
  expectations?: string;
  achievementRate?: number;
};

export type FormState = {
  achievement: Achievement | null;
  difficulties: DifficultyCode[];
  description: string;
  expectations: string;
  /** 칩에 없는 원래 값. 보존용 */
  legacyRate: number | null;
  legacyDifficultyText: string;
};

export const MAX_TEXT = 200;

const CODES = DIFFICULTIES.map((d) => d.code);

function isCode(value: string): value is DifficultyCode {
  return (CODES as string[]).includes(value);
}

function isAchievement(value: number): value is Achievement {
  return ACHIEVEMENTS.some((a) => a.value === value);
}

export function emptyForm(): FormState {
  return {
    achievement: null,
    difficulties: [],
    description: '',
    expectations: '',
    legacyRate: null,
    legacyDifficultyText: '',
  };
}

export function fromNote(note: StudyNote | null): FormState {
  const form = emptyForm();
  if (!note) return form;

  const rate = note.achievementRate;
  if (rate != null) {
    if (isAchievement(rate)) form.achievement = rate;
    else form.legacyRate = rate;
  }

  const rest: string[] = [];
  for (const raw of (note.difficulties ?? '').split(',')) {
    const piece = raw.trim();
    if (!piece) continue;
    if (isCode(piece)) {
      if (!form.difficulties.includes(piece)) form.difficulties.push(piece);
    } else {
      rest.push(piece);
    }
  }
  form.legacyDifficultyText = rest.join(',');

  form.description = note.description ?? '';
  form.expectations = note.expectations ?? '';
  return form;
}

/** '없음'은 다른 칩과 함께 고를 수 없다. */
export function toggleDifficulty(codes: DifficultyCode[], code: DifficultyCode): DifficultyCode[] {
  if (codes.includes(code)) return codes.filter((c) => c !== code);
  if (code === 'none') return ['none'];
  return [...codes.filter((c) => c !== 'none'), code];
}

export function canSave(s: FormState): boolean {
  return (
    s.achievement !== null ||
    s.difficulties.length > 0 ||
    s.description.trim() !== '' ||
    s.expectations.trim() !== ''
  );
}

function clean(text: string): string {
  return text.trim().slice(0, MAX_TEXT);
}

/** 글·난관은 비어 있어도 ''로 보낸다(서버 update는 빠진 필드를 건드리지 않아 지운 값이 남는다). expectations는 self 모드에서만 */
export function toInput(s: FormState, mode: 'self' | 'live'): StudyNoteInput {
  const out: StudyNoteInput = {};

  const rate = s.achievement ?? s.legacyRate;
  if (rate !== null) out.achievementRate = rate;

  out.difficulties = [...s.difficulties, ...(s.legacyDifficultyText ? [s.legacyDifficultyText] : [])].join(',');
  out.description = clean(s.description);
  if (mode === 'self') out.expectations = clean(s.expectations);
  return out;
}
