// 학습장 저장 흐름. 서버에 노트가 있으면 update, 없으면 register.
import type { StudyNote, StudyNoteInput } from './model';

export interface StudyNoteFetchers {
  fetchNote(taskId: number): Promise<StudyNote | null>;
  register(taskId: number, input: StudyNoteInput): Promise<void>;
  update(taskId: number, input: StudyNoteInput): Promise<void>;
}

/**
 * existing: 열 때 조회한 결과. undefined = 조회 실패.
 * 조회 실패 상태에서는 다시 조회하고, 그것도 실패하면 덮어쓰지 않도록 reject한다.
 */
export async function persistNote(
  f: StudyNoteFetchers,
  taskId: number,
  input: StudyNoteInput,
  existing: StudyNote | null | undefined,
): Promise<void> {
  const current = existing === undefined ? await f.fetchNote(taskId) : existing;
  if (current) {
    await f.update(taskId, input);
    return;
  }
  try {
    await f.register(taskId, input);
  } catch (err) {
    // 다른 기기/탭에서 먼저 만들어졌을 수 있다. 있으면 update로 재시도한다.
    let found: StudyNote | null = null;
    try {
      found = await f.fetchNote(taskId);
    } catch {
      throw err;
    }
    if (!found) throw err;
    await f.update(taskId, input);
  }
}
