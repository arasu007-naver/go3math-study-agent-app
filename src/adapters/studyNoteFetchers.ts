// kit/study-note 포트의 Apollo 구현.
import type { ApolloClient } from '@apollo/client';
import { STUDY_NOTE } from '../api/graphql/queries/study';
import { REGIST_TASK_NOTE, UPDATE_STUDY_NOTE } from '../api/graphql/mutations/study';
import type { StudyNote, StudyNoteInput } from '../kit/study-note/model';
import type { StudyNoteFetchers } from '../kit/study-note/persist';

type StudyNoteResponse = Omit<StudyNote, 'tutorDescription'>;

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
      await client.mutate({ mutation: REGIST_TASK_NOTE, variables: { taskId, ...input } });
    },
    async update(taskId, input: StudyNoteInput) {
      await client.mutate({ mutation: UPDATE_STUDY_NOTE, variables: { taskId, ...input } });
    },
  };
}
