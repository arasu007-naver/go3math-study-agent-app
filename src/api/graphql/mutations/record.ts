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

/** 풀이 올리기와 같은 task id를 함께 보낸다(서버 user_action_log LIVE_CLASS_QUIZ_ANSWER가 task에 잇는다). 서버가 아직 모르면 위 문서로 다시 보낸다 */
export const ADD_LIVE_CLASS_QUIZ_RESPONSE_WITH_TASK = gql`
  mutation addLiveClassQuizResponseWithTaskMutation($quizId: Int!, $answerUrl: String!, $taskId: Int) {
    addLiveClassQuizResponse(quizId: $quizId, answerUrl: $answerUrl, taskId: $taskId)
  }
`;

