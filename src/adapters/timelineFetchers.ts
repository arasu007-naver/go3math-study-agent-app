// kit/timeline 포트의 Apollo 구현(조회만).
import type { ApolloClient } from '@apollo/client';
import { MY_TASKS } from '../api/graphql/queries';
import type { TimelineFetchers, TimelineTask } from '../kit/timeline/TimelinePanel';

export function createTimelineFetchers(client: ApolloClient): TimelineFetchers {
  return {
    async fetchTasks({ page, pageSize }) {
      const { data } = await client.query<{ getTaskHistory: TimelineTask[] | null }>({
        query: MY_TASKS,
        variables: { page, pageSize },
        fetchPolicy: 'network-only',
      });
      if (!data?.getTaskHistory) throw new Error('로그인이 필요해요');
      return data.getTaskHistory;
    },
  };
}
