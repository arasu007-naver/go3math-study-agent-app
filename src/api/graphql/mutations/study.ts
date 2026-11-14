import { gql } from '@apollo/client';

export const REGIST_TASK_NOTE = gql`
  mutation registerTaskNoteMutation($taskId: Int!, $description: String, $difficulties: String, $expectations: String, $achievementRate: Int, $activities: String) {
    registerTaskNote( taskId: $taskId, description: $description, difficulties: $difficulties, expectations: $expectations, achievementRate: $achievementRate, activities: $activities)
  }
`;

export const UPDATE_STUDY_NOTE = gql`
  mutation updateTaskNoteMutation($taskId: Int!, $description: String, $difficulties: String, $expectations: String, $achievementRate: Int, $activities: String) {
    updateTaskNote( taskId: $taskId, description: $description, difficulties: $difficulties, expectations: $expectations, achievementRate: $achievementRate, activities: $activities)
  }
`;
