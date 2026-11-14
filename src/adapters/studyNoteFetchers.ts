// kit/study-note 포트의 구현.
// Java API `/api/study-notes/{taskId}`(api-v2 저장소, 배포 이름 api-v3 — 설계 docs/superpowers/specs/2026-11-15-study-note-crud-api-design.md)를 먼저 부르고,
// Java에 닿지 못하면(배포 전 404, 토큰 거절 401·403, 서버 장애 5xx, 네트워크 오류) 기존 GraphQL로 받는다.
// GraphQL 서버에는 activities 필드가 없으므로 그 경로로는 activities를 보내지 않는다(활동 기록은 앱 MMKV에 남아 다음 저장 때 Java로 간다).
// 400·409 같은 요청 오류는 Java가 내린 판단이라 GraphQL로 다시 보내지 않는다. 409(이미 있음)는 persistNote가 다시 조회해 수정으로 재시도한다.
import type { ApolloClient } from '@apollo/client';
import { STUDY_NOTE } from '../api/graphql/queries/study';
import { REGIST_TASK_NOTE, UPDATE_STUDY_NOTE } from '../api/graphql/mutations/study';
import { apiV3, isUnavailable } from '../api/rest/apiV3';
import type { StudyNote, StudyNoteInput } from '../kit/study-note/model';
import type { StudyNoteFetchers } from '../kit/study-note/persist';
import { authStore } from '../state/auth';

type StudyNoteResponse = Omit<StudyNote, 'tutorDescription'>;

/** GraphQL 서버는 로그인이 안 됐을 때 -1을 돌려준다. 음수 결과는 실패로 던져 양식이 초안을 지키게 한다 */
function assertSaved(result: unknown) {
  if (typeof result === 'number' && result < 0) throw new Error('저장하지 못했어요');
}

/** tutorDescription은 서버 필드가 생기기 전까지 비워 둔다 */
function toNote(note: StudyNoteResponse | null | undefined): StudyNote | null {
  return note ? { ...note, tutorDescription: undefined } : null;
}

/** GraphQL 변수에서 activities를 뺀다 */
function withoutActivities({ activities: _drop, ...rest }: StudyNoteInput) {
  return rest;
}

export function createStudyNoteFetchers(client: ApolloClient): StudyNoteFetchers {
  const graphql = {
    async fetchNote(taskId: number) {
      const { data } = await client.query<{ studyNote: StudyNoteResponse | null }>({
        query: STUDY_NOTE,
        variables: { taskId },
        fetchPolicy: 'network-only',
      });
      return toNote(data?.studyNote);
    },
    async register(taskId: number, input: StudyNoteInput) {
      const { data } = await client.mutate<{ registerTaskNote: number }>({
        mutation: REGIST_TASK_NOTE,
        variables: { taskId, ...withoutActivities(input) },
      });
      assertSaved(data?.registerTaskNote);
    },
    async update(taskId: number, input: StudyNoteInput) {
      const { data } = await client.mutate<{ updateTaskNote: number }>({
        mutation: UPDATE_STUDY_NOTE,
        variables: { taskId, ...withoutActivities(input) },
      });
      assertSaved(data?.updateTaskNote);
    },
  };

  /** Java를 먼저 부르고, 닿지 못할 때만 GraphQL로 */
  async function javaFirst<T>(what: string, java: (token: string) => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    const token = authStore.getState().appToken;
    if (!token) return fallback();
    try {
      return await java(token);
    } catch (e) {
      if (!isUnavailable(e)) throw e;
      console.warn(`[study-note] Java ${what} 실패, GraphQL로 보냄:`, String((e as Error)?.message ?? e));
      return fallback();
    }
  }

  const path = (taskId: number) => `/api/study-notes/${taskId}`;

  return {
    fetchNote: (taskId) =>
      javaFirst(
        'GET study-notes',
        async (token) => toNote((await apiV3<{ note: StudyNoteResponse | null }>(path(taskId), token))?.note),
        () => graphql.fetchNote(taskId),
      ),
    register: (taskId, input) =>
      javaFirst(
        'POST study-notes',
        async (token) => void (await apiV3(path(taskId), token, { method: 'POST', body: input })),
        () => graphql.register(taskId, input),
      ),
    update: (taskId, input) =>
      javaFirst(
        'PUT study-notes',
        async (token) => void (await apiV3(path(taskId), token, { method: 'PUT', body: input })),
        () => graphql.update(taskId, input),
      ),
  };
}
