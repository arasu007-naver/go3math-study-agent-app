/**
 * 수업 노트(lesson_note) 조회 — Java API(`api-v2` 저장소 LessonNoteController).
 * 선생님이 실황 수업을 시작할 때 한 행이 생기고(id 발급), 수업을 마칠 때 units·요약·퀴즈가 채워진다.
 * hotline·topic-live task의 collectionId가 이 행의 id다.
 */
import { apiV3 } from './apiV3';

export type LessonNote = { id: number; lessonType?: string | null; units?: string | null; topicId?: number | null };
export type LessonNoteUnit = { sourceType: string; sourceId: number };

export const getLessonNote = (id: number, token: string) => apiV3<LessonNote>(`/api/lesson-notes/${id}`, token);

export const getLessonNotesOfTopic = (topicId: number, token: string) => apiV3<LessonNote[]>(`/api/lesson-notes/topic/${topicId}`, token);

/** 그 주제에서 가장 최근에 시작한 주제 실황 수업의 lesson_note id. 없으면 undefined */
export function latestTopicLiveNoteId(notes: LessonNote[] | null | undefined): number | undefined {
  const ids = (notes ?? []).filter((n) => n.lessonType === 'TOPIC_LIVE_CLASS').map((n) => Number(n.id));
  return ids.length ? Math.max(...ids) : undefined;
}

/** lesson_note.units(JSON 문자열): `${sourceType}-${sourceId}` 키의 맵(tutor-web이 저장하는 모양) 또는 배열. 비었거나 깨졌으면 [] */
export function lessonNoteUnits(raw: string | null | undefined): LessonNoteUnit[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    const list: unknown[] = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? Object.values(parsed) : [];
    return list
      .filter((u): u is { sourceType: string; sourceId: number | string } => !!u && typeof u === 'object' && 'sourceType' in u && 'sourceId' in u)
      .map((u) => ({ sourceType: String(u.sourceType), sourceId: Number(u.sourceId) }));
  } catch {
    return [];
  }
}
