// 실황 수업 종료 메시지(LIVE_CLASS_CLOSED)에서 선생님의 정리 내용(설명·개념·퀴즈)을 꺼낸다.
import { LIVE_CLASS_CLOSED } from './constants';

export type LiveClassClosing = {
  description: string;
  concepts: { id: number; title: string }[];
  quizzes: { quizId: number; content: string }[];
};

const isPosInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v > 0;
const isRecord = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === 'object' && !Array.isArray(v);

/** 종료 메시지가 아니거나 정리 내용이 모두 비면 null. 모양이 틀린 항목과 중복 id는 버린다 */
export function pickLiveClassClosing(guide: Record<string, unknown> | null | undefined): LiveClassClosing | null {
  if (!guide || guide.action !== LIVE_CLASS_CLOSED) return null;
  const description = typeof guide.description === 'string' ? guide.description : '';
  const concepts: LiveClassClosing['concepts'] = [];
  if (Array.isArray(guide.concepts)) {
    for (const c of guide.concepts) {
      if (isRecord(c) && isPosInt(c.id) && typeof c.title === 'string' && c.title !== '' && !concepts.some((p) => p.id === c.id)) {
        concepts.push({ id: c.id, title: c.title });
      }
    }
  }
  const quizzes: LiveClassClosing['quizzes'] = [];
  if (Array.isArray(guide.quizzes)) {
    for (const q of guide.quizzes) {
      if (isRecord(q) && isPosInt(q.quizId) && typeof q.content === 'string' && !quizzes.some((p) => p.quizId === q.quizId)) {
        quizzes.push({ quizId: q.quizId, content: q.content });
      }
    }
  }
  if (description === '' && concepts.length === 0 && quizzes.length === 0) return null;
  return { description, concepts, quizzes };
}
