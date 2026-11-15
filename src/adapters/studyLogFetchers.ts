// kit/study-log 포트의 구현 — Java API(api-v3) 학습장 목록·돌아보기. GraphQL에는 같은 조회가 없어 대체 경로가 없다.
import { apiV3 } from '../api/rest/apiV3';
import { REVIEW_TYPES, type ReviewActivity, type StudyLogFetchers, type StudyNoteListItem } from '../kit/study-log/model';
import { authStore } from '../state/auth';

function token(): string {
  const t = authStore.getState().appToken;
  if (!t) throw new Error('로그인이 필요해요');
  return t;
}

export function createStudyLogFetchers(): StudyLogFetchers {
  return {
    async listNotes(from) {
      const res = await apiV3<{ notes?: StudyNoteListItem[] | null }>(`/api/study-notes?from=${encodeURIComponent(from)}`, token());
      // tutorDescription은 서버 필드가 생기기 전까지 비워 둔다(학습장 단건 조회와 같다)
      return (res?.notes ?? []).map((it) => ({ ...it, note: { ...it.note, tutorDescription: undefined } }));
    },
    async listActivities(taskId) {
      const res = await apiV3<{ activities?: (Omit<ReviewActivity, 'type'> & { type?: string })[] | null }>(
        `/api/study-notes/${taskId}/activities`,
        token(),
      );
      // type이 없으면(옛 응답) 풀이 업로드, 모르는 type은 뺀다
      return (res?.activities ?? []).flatMap((a): ReviewActivity[] => {
        const t = a.type ?? 'SOLUTION_UPLOAD';
        return (REVIEW_TYPES as readonly string[]).includes(t) ? [{ ...a, type: t as ReviewActivity['type'] }] : [];
      });
    },
  };
}
