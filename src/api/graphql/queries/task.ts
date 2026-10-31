import { gql } from '@apollo/client';

export const MY_TASKS = gql`
  query getMyTasks($page: Int, $pageSize: Int) {
    getTaskHistory(page: $page, pageSize: $pageSize) {
      id
      visitCnt
      taskType
      recommended
      suggestUserId
      task
      lastVisitedAt
      collectionId
      questionId
      title
      description
      topicTitle
      topicDescription
      topicOrgType
      topicOrgId
      startDate
      completeDate
    }
  }
`;

export const CHECK_TASK = gql`
  query checkTaskSearch($targetId: Int, $taskString: String, $taskType: String!) {
    findMyTask(targetId: $targetId, taskString: $taskString, taskType: $taskType)
  }
`;

export const TASK_OF_ID = gql`
  query taskOfIdQuery($taskId: Int!) {
    taskOfId(taskId:$taskId) {
      id
      visitCnt
      taskType
      recommended
      suggestUserId
      task
      lastVisitedAt
      collectionId
      questionId
      title
      description
      topicTitle
      topicDescription
      topicOrgType
      topicOrgId
      startDate
      completeDate
      createdAt
    }
  }
`;

export const CHECK_PRE_EXAM_SEARCH = gql`
  query checkPreExamSearch($task: String!) {
    findPreExamsTask(task: $task) {
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

export const CHECK_COLLECTION_SEARCH = gql`
  query checkCollectionSearch($collectionId: Int!) {
    findCollectionTask(collectionId: $collectionId) {
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
