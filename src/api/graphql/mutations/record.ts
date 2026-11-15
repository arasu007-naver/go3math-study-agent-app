import { gql } from '@apollo/client';

export const CREATE_RECORD = gql`
  mutation createRecordkMutation(
    $sourceType: String!
    $sourceId: Int!
    $taskId: Int
    $fileName: String
    $photoUnitId: Int
    $topicId: Int
    $tutorId: String
  ) {
    createRecord(
      input: {
        sourceType: $sourceType
        sourceId: $sourceId
        taskId: $taskId
        fileName: $fileName
        photoUnitId: $photoUnitId
        topicId: $topicId
        tutorId: $tutorId
      }
    ) {
      id
      sourceType
      sourceId
      fileName
      taskId
      photoUnitId
      createdAt
    }
  }
`;

export const ADD_BOOKMARK = gql`
  mutation addUnitBookmarkMutation($sourceType: String !, $sourceId: Int!) {
    addBookmark(sourceType: $sourceType, sourceId: $sourceId)
  }
`;

export const REMOVE_BOOKMARK = gql`
  mutation removeUnitBookmarkMutation($sourceType: String!, $sourceId: Int!)  {
    removeBookmark(sourceType: $sourceType, sourceId: $sourceId )
  }
`;

export const ADD_LIVE_CLASS_QUIZ_RESPONSE = gql`
  mutation addLiveClassQuizResponseMutation($quizId: Int!, $answerUrl: String!) {
    addLiveClassQuizResponse(quizId: $quizId, answerUrl: $answerUrl)
  }
`;

