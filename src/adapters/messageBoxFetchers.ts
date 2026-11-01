// kit/profile MessageBoxPanel 포트의 Apollo 구현(조회만).
import type { ApolloClient } from '@apollo/client';
import { PRIVATE_REQUESTS } from '../api/graphql/queries';
import type { MessageBoxFetchers, PrivateMessage } from '../kit/profile/MessageBoxPanel';

export function createMessageBoxFetchers(client: ApolloClient): MessageBoxFetchers {
  return {
    async fetchMessages({ page, pageSize }) {
      const { data } = await client.query<{ getMyRequests: PrivateMessage[] | null }>({
        query: PRIVATE_REQUESTS,
        variables: { page, pageSize },
        fetchPolicy: 'network-only',
      });
      if (!data?.getMyRequests) throw new Error('로그인이 필요해요');
      return data.getMyRequests;
    },
  };
}
