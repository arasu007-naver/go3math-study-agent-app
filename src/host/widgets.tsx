// 위젯 = kit 패널을 감싸는 얇은 어댑터(§4.4): fetcher 주입, kit 콜백 → 에이전트 이벤트 변환, 프리셋 반영.
import type { ReactElement } from 'react';
import { router } from 'expo-router';
import type { AgentSession } from '../agent/session';
import { createProblemListFetchers } from '../adapters/problemListFetchers';
import { createTopicFetchers } from '../adapters/topicFetchers';
import { MATH_TOPIC_SUBJECTS } from '../config/exam.constants';
import { ExamSearchPanel, type ExamSearchMode } from '../kit/exam-search/ExamSearchPanel';
import { ResearchPanel, type ResearchCategory } from '../kit/research/ResearchPanel';
import type { ExamSelection } from '../kit/exam-search/query';
import { ProblemListPanel, BookmarksPanel, type ProblemSource } from '../kit/problem-list/ProblemListPanel';
import { TopicTabsPanel } from '../kit/topic-panel/TopicTabsPanel';
import { TopicUnitList } from '../kit/topic-panel/TopicUnitList';
import { UNITIMAGE } from '../config/api.constants';
import { apolloClient } from '../state/bootstrap';
import { solveStore, type SolveProblem } from '../state/solve';
import { storage } from '../storage';

export const topicFetchers = createTopicFetchers(apolloClient);
const problemListFetchers = createProblemListFetchers(apolloClient);

type WidgetProps = { props: Record<string, unknown>; session: AgentSession };

/** 문제 목록의 연필 버튼: 문제 묶음을 넘기고 풀이 화면(/notebook)으로 */
export function openNotebook(title: string | undefined, problems: SolveProblem[], index: number, taskId?: number, topicId?: number) {
  solveStore.dispatch({ title, problems, index, taskId, topicId });
  router.push('/notebook');
}

/** 실황 수업 dock의 주제 실황 수업: 주제 실황 캔버스 화면(/topic-live-class)으로 */
export function openTopicLiveClass(topicId: number, taskId?: number) {
  router.push({ pathname: '/topic-live-class', params: { topicId: String(topicId), ...(taskId ? { taskId: String(taskId) } : {}) } });
}

/** 실황 수업 dock의 선생님 수업: 선생님 수업 캔버스 화면(/hotline-class)으로 */
export function openHotlineClass(tutorId: string, taskId?: number) {
  router.push({ pathname: '/hotline-class', params: { tutorId, ...(taskId ? { taskId: String(taskId) } : {}) } });
}

function TopicListWidget({ props, session }: WidgetProps) {
  return (
    <TopicTabsPanel
      fetchers={topicFetchers}
      subjects={MATH_TOPIC_SUBJECTS}
      initialSubject={props.subject as string | undefined}
      pageSize={props.pageSize as number | undefined}
      store={storage}
      onSelectTopic={(t) => session.emit('topic_selected', { topicId: Number(t.id), title: t.title, source: 'topic_list' })}
    />
  );
}

function ProblemPreviewWidget({ props, session }: WidgetProps) {
  const topicId = props.topicId as number;
  return (
    <TopicUnitList
      fetchers={topicFetchers}
      topicId={topicId}
      onSelectUnit={({ unitIdx }) => session.emit('unit_selected', { topicId, unitIdx })}
      onSolve={({ unitIdx, topic }) =>
        openNotebook(
          topic.title,
          topic.units.map((u) => ({ sourceType: u.sourceType, sourceId: u.sourceId, image: UNITIMAGE(u.sourceType, u.sourceId) ?? '' })),
          unitIdx,
          undefined,
          topicId,
        )
      }
    />
  );
}

function ProblemListWidget({ props, session }: WidgetProps) {
  const source = props.source as ProblemSource;
  return (
    <ProblemListPanel
      fetchers={problemListFetchers}
      source={source}
      onSelectProblem={({ index, problem }) =>
        session.emit('problem_selected', {
          index,
          sourceType: problem.sourceType,
          sourceId: problem.sourceId,
          ...(source.kind === 'task' ? { taskId: source.taskId } : {}),
        })
      }
      onSolve={({ index, set }) =>
        // 실황 수업(주제·선생님)은 문제 하나가 아니라 선생님 진행을 따라가는 실황 캔버스로 연다
        source.kind === 'topic_live'
          ? openTopicLiveClass(source.topicId)
          : source.kind === 'hotline'
            ? openHotlineClass(source.tutorId)
            : openNotebook(set.title, set.problems, index, source.kind === 'task' ? source.taskId : undefined)
      }
    />
  );
}

function BookmarksWidget({ props, session }: WidgetProps) {
  const source = (props.source as ProblemSource | undefined) ?? { kind: 'bookmarks' };
  return (
    <BookmarksPanel
      fetchers={problemListFetchers}
      source={source}
      onSelectProblem={({ index, problem }) =>
        session.emit('problem_selected', {
          index,
          sourceType: problem.sourceType,
          sourceId: problem.sourceId,
        })
      }
      onSolve={({ index, set }) => openNotebook(set.title, set.problems, index)}
    />
  );
}

function ExamSearchWidget({ props, session }: WidgetProps) {
  return (
    <ExamSearchPanel
      key={JSON.stringify(props)}
      mode={props.mode as ExamSearchMode}
      preset={props.preset as Partial<ExamSelection> | undefined}
      store={storage}
      onSubmit={(query) => session.emit('search_submitted', { query })}
    />
  );
}

function ResearchWidget({ props, session }: WidgetProps) {
  return (
    <ResearchPanel
      fetchers={topicFetchers}
      topicSubjects={MATH_TOPIC_SUBJECTS}
      store={storage}
      initialCategory={props.category as ResearchCategory | undefined}
      onSubmitSearch={(query) => session.emit('search_submitted', { query })}
      onSelectTopic={(t) => session.emit('topic_selected', { topicId: Number(t.id), title: t.title, source: 'research' })}
    />
  );
}

export const widgets: Record<string, (p: WidgetProps) => ReactElement> = {
  topic_list: TopicListWidget,
  problem_preview: ProblemPreviewWidget,
  problem_list: ProblemListWidget,
  bookmarks: BookmarksWidget,
  bookmarks_panel: BookmarksWidget,
  exam_search: ExamSearchWidget,
  research: ResearchWidget,
};
