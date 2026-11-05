// kit/problem-list 포트의 구현(조회만). 문제를 모으는 방식은 기존 timeline goNoteTab과 같다:
// - selection(기출 검색): task JSON을 검색 조건으로 getMemberMathPreExams → qPath 이미지
// - collection(문제 모음): getUnitsOfMathCollection(collectionId) → units의 qPath 이미지
// - bookmark(책갈피): task JSON의 units(sourceType·sourceId) → UNITIMAGE
// - topic(주제): GET_UNITS_IN_TOPIC(collectionId = 주제 id)의 JSON units → 기존 callGetTopicUnits와 같은 qPath 이미지
// - bookmarks(내 책갈피): MY_BOOKMARKS → 각 책갈피의 image(기존 BookmarksViewerModal과 같다)
import type { ApolloClient } from '@apollo/client';
import { ADD_BOOKMARK, REMOVE_BOOKMARK } from '../api/graphql/mutations';
import { GET_UNITS_IN_TOPIC, MY_BOOKMARKS, TASK_OF_ID } from '../api/graphql/queries';
import { getMemberMathPreExams, getUnitsOfMathCollection } from '../api/rest';
import { ESSAY_TITLE_PATH_PREFIX, UNITIMAGE } from '../config/api.constants';
import type { Problem, ProblemListFetchers } from '../kit/problem-list/ProblemListPanel';
import { describeTask, type TimelineTask } from '../kit/timeline/TimelinePanel';
import { authStore } from '../state/auth';

type RemoteUnit = { id: number; qPath: string };

const fromRemote = (units: RemoteUnit[]): Problem[] => units.map((u) => ({ sourceType: 'UNIT', sourceId: u.id, image: u.qPath }));

async function searchExams(query: Record<string, unknown>): Promise<Problem[]> {
  const token = authStore.getState().appToken;
  if (!token) throw new Error('로그인이 필요해요');
  const res = await getMemberMathPreExams(token, { ...query });
  return fromRemote(res.data?.data?.result ?? []);
}

export function createProblemListFetchers(client: ApolloClient): ProblemListFetchers {
  return {
    async addBookmark(sourceType: string, sourceId: number) {
      await client.mutate({
        mutation: ADD_BOOKMARK,
        variables: { sourceType, sourceId: Number(sourceId) },
      });
    },
    async removeBookmark(sourceType: string, sourceId: number) {
      await client.mutate({
        mutation: REMOVE_BOOKMARK,
        variables: { sourceType, sourceId: Number(sourceId) },
      });
    },
    async fetchProblems(source) {
      if (source.kind === 'exam_query') return { title: '📝 기출 검색', problems: await searchExams(source.query) };
      if (source.kind === 'bookmarks') {
        const { data } = await client.query<{ bookmarks: Problem[] | null }>({ query: MY_BOOKMARKS, fetchPolicy: 'network-only' });
        return {
          title: '🔖 내 책갈피',
          problems: (data?.bookmarks ?? []).map((b) => ({ sourceType: b.sourceType, sourceId: b.sourceId, image: b.image })),
        };
      }

      const { data } = await client.query<{ taskOfId: TimelineTask | null }>({
        query: TASK_OF_ID,
        variables: { taskId: source.taskId },
        fetchPolicy: 'network-only',
      });
      const task = data?.taskOfId;
      if (!task) throw new Error('학습 기록을 찾을 수 없어요');
      const { title, subtitle } = describeTask(task);

      switch (task.taskType) {
        case 'selection':
          return { title, subtitle, problems: await searchExams(JSON.parse(task.task ?? '{}')) };
        case 'collection': {
          const res = await getUnitsOfMathCollection(Number(task.collectionId));
          return { title, subtitle, problems: fromRemote(res.data?.data?.result?.units ?? []) };
        }
        case 'bookmark': {
          const units: { sourceType: string; sourceId: number }[] = JSON.parse(task.task ?? '{}').units ?? [];
          return {
            title,
            subtitle,
            problems: units.map((u) => ({ sourceType: u.sourceType, sourceId: u.sourceId, image: UNITIMAGE(u.sourceType, u.sourceId) ?? '' })),
          };
        }
        case 'topic': {
          const res = await client.query<{ getUnitsInTopic: string | null }>({
            query: GET_UNITS_IN_TOPIC,
            variables: { topicId: Number(task.collectionId) },
            fetchPolicy: 'network-only',
          });
          const units: { sourceType: string; sourceId: number }[] = JSON.parse(res.data?.getUnitsInTopic ?? '[]');
          return {
            title,
            subtitle,
            problems: units.map((u) => ({
              sourceType: u.sourceType,
              sourceId: u.sourceId,
              // 기존 callGetTopicUnits: 서술형은 제목 이미지(essay-title), 나머지는 UNITIMAGE와 같은 경로
              image: u.sourceType === 'MATH_ESSAY' ? ESSAY_TITLE_PATH_PREFIX + u.sourceId + '.png' : UNITIMAGE(u.sourceType, u.sourceId) ?? '',
            })),
          };
        }
        default:
          throw new Error(`이 학습 기록(${task.taskType})은 문제 목록이 없어요`);
      }
    },
  };
}
