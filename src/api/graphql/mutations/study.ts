import { gql } from '@apollo/client';

export const REGIST_TASK_NOTE = gql`
  mutation registerTaskNoteMutation($taskId: Int!, $description: String, $difficulties: String, $expectations: String, $achievementRate: Int) {
    registerTaskNote( taskId: $taskId, description: $description, difficulties: $difficulties, expectations: $expectations, achievementRate: $achievementRate)
  }
`;

export const UPDATE_STUDY_NOTE = gql`
  mutation updateTaskNoteMutation($taskId: Int!, $description: String, $difficulties: String, $expectations: String, $achievementRate: Int) {
    updateTaskNote( taskId: $taskId, description: $description, difficulties: $difficulties, expectations: $expectations, achievementRate: $achievementRate)
  }
`;
