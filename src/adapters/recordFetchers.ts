// kit/diary 포트의 구현 — 기존 DiaryScreen의 MONTHRY_RECORDS(recordsOfMonth, 달력)와
// DailyRecordsViewPage로 가기 전 부르던 DAILY_RECORDS(recordsOfDay, 그날 기록 — Java 쪽 API가 아직 없어 GraphQL만) + 책갈피 추가(ADD_BOOKMARK).
// Java API `GET /api/records/month?month=YYYY-MM`(api-v2 저장소 RecordsController)를 먼저 부르고,
// Java에 닿지 못하면(배포 전 404, 토큰 거절 401, 네트워크 오류) 기존 GraphQL로 받는다. Java 쪽이 배포·확인되면 GraphQL 경로를 지운다.
import type { ApolloClient } from '@apollo/client';
import { ADD_BOOKMARK } from '../api/graphql/mutations';
import { DAILY_RECORDS, MONTHRY_RECORDS } from '../api/graphql/queries';
import { apiV3, isUnavailable } from '../api/rest/apiV3';
import type { DailyRecord, DailyRecordsFetchers } from '../kit/diary/DailyRecordsList';
import type { MonthRecord, RecordsCalendarFetchers } from '../kit/diary/RecordsCalendar';
import { authStore } from '../state/auth';

export function createRecordFetchers(client: ApolloClient): RecordsCalendarFetchers & DailyRecordsFetchers {
  const fromGraphql = async (month: string) => {
    const { data } = await client.query<{ recordsOfMonth: MonthRecord[] | null }>({
      query: MONTHRY_RECORDS,
      variables: { month },
      fetchPolicy: 'network-only',
    });
    return data?.recordsOfMonth ?? [];
  };

  return {
    async fetchMonth(month) {
      const token = authStore.getState().appToken;
      if (!token) return fromGraphql(month);
      try {
        const rows = await apiV3<MonthRecord[]>(`/api/records/month?month=${encodeURIComponent(month)}`, token);
        if (!Array.isArray(rows)) throw new Error('records/month: not a list');
        return rows;
      } catch (e) {
        if (!isUnavailable(e)) throw e;
        console.warn('[diary] Java records/month 실패, GraphQL로 받음:', String((e as Error)?.message ?? e));
        return fromGraphql(month);
      }
    },
    async fetchDay(day) {
      const { data } = await client.query<{ recordsOfDay: DailyRecord[] | null }>({
        query: DAILY_RECORDS,
        variables: { day },
        fetchPolicy: 'network-only',
      });
      return data?.recordsOfDay ?? [];
    },
    async addBookmark(sourceType, sourceId) {
      await client.mutate({ mutation: ADD_BOOKMARK, variables: { sourceType, sourceId: Number(sourceId) } });
    },
  };
}
