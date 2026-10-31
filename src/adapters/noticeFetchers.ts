// kit/notices 포트의 Apollo 구현(조회만).
import type { ApolloClient } from '@apollo/client';
import { SQUARE_ANNOUNCEMENTS } from '../api/graphql/queries';
import type { Notice, NoticeFetchers } from '../kit/notices/NoticesPanel';

export function createNoticeFetchers(client: ApolloClient): NoticeFetchers {
  return {
    async fetchNotices({ page, pageSize }) {
      const { data } = await client.query<{ getAnnouncements: Notice[] | null }>({
        query: SQUARE_ANNOUNCEMENTS,
        variables: { page, pageSize },
        fetchPolicy: 'network-only',
      });
      // getAnnouncements는 로그인 토큰이 없으면 null을 돌려준다. 2026-11-01 실서버 확인.
      if (!data?.getAnnouncements) throw new Error('로그인이 필요해요');
      return data.getAnnouncements;
    },
  };
}
