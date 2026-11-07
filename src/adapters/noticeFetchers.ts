// kit/notices 포트의 구현(조회만).
// 월별 공지(Diary 달력과 같은 달)는 Java API `GET /api/notices/month?month=YYYY-MM`(api-v2 저장소 NoticesController)를 먼저 부르고,
// Java에 닿지 못하면(배포 전 404, 토큰 거절 401, 네트워크 오류) 기존 GraphQL 페이지를 그 달보다 오래된 공지가 나올 때까지 받아 거른다.
// Java 쪽이 배포·확인되면 GraphQL 경로를 지운다.
import type { ApolloClient } from '@apollo/client';
import moment from 'moment';
import { SQUARE_ANNOUNCEMENTS } from '../api/graphql/queries';
import { apiV3, isUnavailable } from '../api/rest/apiV3';
import { NOTICE_PAGE_SIZE, type Notice, type NoticeFetchers } from '../kit/notices/NoticesPanel';
import { authStore } from '../state/auth';

export function createNoticeFetchers(client: ApolloClient): NoticeFetchers {
  const fetchNotices: NoticeFetchers['fetchNotices'] = async ({ page, pageSize }) => {
    const { data } = await client.query<{ getAnnouncements: Notice[] | null }>({
      query: SQUARE_ANNOUNCEMENTS,
      variables: { page, pageSize },
      fetchPolicy: 'network-only',
    });
    // getAnnouncements는 로그인 토큰이 없으면 null을 돌려준다. 2026-11-01 실서버 확인.
    if (!data?.getAnnouncements) throw new Error('로그인이 필요해요');
    return data.getAnnouncements;
  };

  // GraphQL은 id 내림차순(≈ 작성 시각 내림차순) 페이지뿐이라, 그 달 시작보다 오래된 공지가 나올 때까지 넘기며 그 달 것만 고른다
  const monthFromGraphql = async (month: string) => {
    const from = moment(month, 'YYYY-MM').startOf('month').valueOf();
    const until = moment(month, 'YYYY-MM').add(1, 'month').startOf('month').valueOf();
    const out: Notice[] = [];
    for (let page = 0; ; page++) {
      const got = await fetchNotices({ page, pageSize: NOTICE_PAGE_SIZE });
      for (const n of got) {
        const t = Number(n.createdAt);
        if (t >= from && t < until) out.push(n);
      }
      const last = got[got.length - 1];
      if (got.length < NOTICE_PAGE_SIZE || !last || Number(last.createdAt) < from) return out;
    }
  };

  return {
    fetchNotices,
    async fetchMonthNotices(month) {
      const token = authStore.getState().appToken;
      if (!token) return monthFromGraphql(month);
      try {
        const rows = await apiV3<Notice[]>(`/api/notices/month?month=${encodeURIComponent(month)}`, token);
        if (!Array.isArray(rows)) throw new Error('notices/month: not a list');
        return rows;
      } catch (e) {
        if (!isUnavailable(e)) throw e;
        console.warn('[notices] Java notices/month 실패, GraphQL로 받음:', String((e as Error)?.message ?? e));
        return monthFromGraphql(month);
      }
    },
  };
}
