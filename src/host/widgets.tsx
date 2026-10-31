// 위젯 = kit 패널을 감싸는 얇은 어댑터(§4.4): fetcher 주입, kit 콜백 → 에이전트 이벤트 변환, 프리셋 반영.
import type { ReactElement } from 'react';
import type { AgentSession } from '../agent/session';
import { createTopicFetchers } from '../adapters/topicFetchers';
import { MATH_TOPIC_SUBJECTS } from '../config/exam.constants';
import { ExamSearchPanel, type ExamSearchMode } from '../kit/exam-search/ExamSearchPanel';
import { ResearchPanel, type ResearchCategory } from '../kit/research/ResearchPanel';
import type { ExamSelection } from '../kit/exam-search/query';
import { TopicTabsPanel } from '../kit/topic-panel/TopicTabsPanel';
import { TopicUnitList } from '../kit/topic-panel/TopicUnitList';
import { apolloClient } from '../state/bootstrap';
import { storage } from '../storage';

export const topicFetchers = createTopicFetchers(apolloClient);

type WidgetProps = { props: Record<string, unknown>; session: AgentSession };

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
  exam_search: ExamSearchWidget,
  research: ResearchWidget,
};
