// kit/study-note 포트의 Apollo 구현.
import type { ApolloClient } from '@apollo/client';
import { STUDY_NOTE } from '../api/graphql/queries/study';
import { REGIST_TASK_NOTE, UPDATE_STUDY_NOTE } from '../api/graphql/mutations/study';
import type { StudyNote, StudyNoteInput } from '../kit/study-note/model';
import type { StudyNoteFetchers } from '../kit/study-note/persist';

type StudyNoteResponse = Omit<StudyNote, 'tutorDescription'>;

/** 서버는 로그인이 안 됐을 때 -1을 돌려준다. 음수 결과는 실패로 던져 양식이 초안을 지키게 한다 */
function assertSaved(result: unknown) {
  if (typeof result === 'number' && result < 0) throw new Error('저장하지 못했어요');
}

export function createStudyNoteFetchers(client: ApolloClient): StudyNoteFetchers {
  return {
    async fetchNote(taskId) {
      const { data } = await client.query<{ studyNote: StudyNoteResponse | null }>({
        query: STUDY_NOTE,
        variables: { taskId },
        fetchPolicy: 'network-only',
      });
      const note = data?.studyNote;
      if (!note) return null;
      // tutorDescription은 서버 필드가 생기기 전까지 비워 둔다.
      return { ...note, tutorDescription: undefined };
    },
    async register(taskId, input: StudyNoteInput) {
      const { data } = await client.mutate<{ registerTaskNote: number }>({ mutation: REGIST_TASK_NOTE, variables: { taskId, ...input } });
      assertSaved(data?.registerTaskNote);
    },
    async update(taskId, input: StudyNoteInput) {
      const { data } = await client.mutate<{ updateTaskNote: number }>({ mutation: UPDATE_STUDY_NOTE, variables: { taskId, ...input } });
      assertSaved(data?.updateTaskNote);
    },
  };
}
