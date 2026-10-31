import { gql } from '@apollo/client';

export const STUDY_NOTE = gql`
  query getStudyNoteQuery($taskId: Int!) {
    studyNote(taskId: $taskId){
      taskId
      description
      difficulties
      expectations
      achievementRate
      noteType
    }
  }
`;

export const MY_MONTHLY_STUDY_NOTE = gql`
  query getSMonthlytudyNoteQuery($month: String!) {
    monthlyStudyNotes(month: $month){
      taskId
      description
      difficulties
      expectations
      achievementRate
      startDate
      completeDate
      noteType
    }
  }
`;

export const CHECK_MY_STUDY_NOTE = gql`
  query checkMyNote($noteId: Int!) {
    isMyStudyNote(noteId: $noteId)
  }
`;
