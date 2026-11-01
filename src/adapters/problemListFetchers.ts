// kit/problem-list 포트의 구현(조회만). 문제를 모으는 방식은 기존 timeline goNoteTab과 같다:
// - selection(기출 검색): task JSON을 검색 조건으로 getMemberMathPreExams → qPath 이미지
// - collection(문제 모음): getUnitsOfMathCollection(collectionId) → units의 qPath 이미지
// - bookmark(책갈피): task JSON의 units(sourceType·sourceId) → UNITIMAGE
// 주제(topic) 기록은 problem_preview(TopicUnitList)가 보여주므로 여기서 다루지 않는다.
import type { ApolloClient } from '@apollo/client';
import { TASK_OF_ID } from '../api/graphql/queries';
import { getMemberMathPreExams, getUnitsOfMathCollection } from '../api/rest';
import { UNITIMAGE } from '../config/api.constants';
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
    async fetchProblems(source) {
      if (source.kind === 'exam_query') return { title: '📝 기출 검색', problems: await searchExams(source.query) };

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
        default:
          throw new Error(`이 학습 기록(${task.taskType})은 문제 목록이 없어요`);
      }
    },
  };
}
