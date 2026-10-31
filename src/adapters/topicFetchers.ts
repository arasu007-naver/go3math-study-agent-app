// kit/topic-panel 포트의 Apollo 구현. 조회(query)만 사용한다 — M3 완료 조건 "쓰기 호출 0건".
import type { ApolloClient } from '@apollo/client';
import { STUDY_TOPIC, SUBJECT_TOPICS, SUBJECT_TOTAL_PAGE_COUNT } from '../api/graphql/queries';
import type { TopicDetail, TopicPanelFetchers, TopicSummary } from '../kit/topic-panel/types';

export function createTopicFetchers(client: ApolloClient): TopicPanelFetchers {
  return {
    async fetchSubjectTopics({ subject, page, pageSize }) {
      const { data } = await client.query<{ subjectTopics: TopicSummary[] }>({
        query: SUBJECT_TOPICS,
        variables: { subject, page, pageSize },
        fetchPolicy: 'network-only',
      });
      return data?.subjectTopics ?? [];
    },
    async fetchTotalPageCount({ subject, pageSize }) {
      const { data } = await client.query<{ subjectTopicTotalPageCount: number }>({
        query: SUBJECT_TOTAL_PAGE_COUNT,
        variables: { subject, pageSize },
        fetchPolicy: 'network-only',
      });
      return data?.subjectTopicTotalPageCount ?? 1;
    },
    async fetchTopic(topicId) {
      const { data } = await client.query<{ topicForStudy: TopicDetail }>({
        query: STUDY_TOPIC,
        variables: { topicId: Number(topicId) },
        fetchPolicy: 'network-only',
      });
      // topicForStudy는 로그인 토큰이 없으면 null을 돌려준다(subjectTopics는 공개). 2026-10-31 실서버 확인.
      if (!data?.topicForStudy) throw new Error('로그인이 필요하거나 주제를 찾을 수 없어요');
      return data.topicForStudy;
    },
  };
}
