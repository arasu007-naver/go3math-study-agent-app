import { gql } from '@apollo/client';

export const CREATE_SELECTION_TASK = gql`
  mutation CreateSelectionTaskMutation($taskType: String!, $task: String!) {
    createTask(input: {taskType: $taskType, task: $task}) {
      id
      visitCnt
      taskType
      recommended
      suggestUserId
      task
      lastVisitedAt
      collectionId
      createdAt
    }
  }
`;

export const CREATE_COLLECTION_TASK = gql`
  mutation CreateCollectionTaskMutation(
    $taskType: String!
    $collectionId: Int!
  ) {
    createTask(input: {collectionId: $collectionId, taskType: $taskType}) {
      id
      visitCnt
      taskType
      recommended
      suggestUserId
      task
      lastVisitedAt
      collectionId
      createdAt
    }
  }
`;

export const CREATE_BOOKMARK_TASK = gql`
  mutation CreateBookmarkTaskMutation(
    $taskType: String!
    $task: String!
    $startDate: String!
    $completeDate: String!
    $bookmarkTitle: String!
  ) {
    createTask(input: {taskType: $taskType, task: $task, startDate: $startDate, completeDate: $completeDate, noteExpectations: $bookmarkTitle}) {
      id
      visitCnt
      taskType
      lastVisitedAt
      createdAt
    }
  }
`;

export const UPDATE_VISIT_COUNT = gql`
  mutation increaseVisitCount($taskId: Int!) {
    increaseTaskVisitCnt(taskId: $taskId)
  }
`;

export const UPDATE_TASK_SCHEDULE = gql`
  mutation registerTaskScheduleMutation($taskId: Int!, $startDate: String!, $completeDate: String!) {
    registerTaskSchedule( taskId: $taskId, startDate: $startDate, completeDate: $completeDate)
  }
`;

export const CLONE_TASK = gql`
  mutation cloneTaskMutation($taskId: Int!) {
    cloneTask( taskId: $taskId)
  }
`;
