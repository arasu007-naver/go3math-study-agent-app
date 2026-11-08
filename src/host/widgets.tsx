// 위젯 = kit 패널을 감싸는 얇은 어댑터(§4.4): fetcher 주입, kit 콜백 → 에이전트 이벤트 변환, 프리셋 반영.
import { useRef, type MutableRefObject, type ReactElement } from 'react';
import { router } from 'expo-router';
import type { AgentSession } from '../agent/session';
import { createProblemListFetchers } from '../adapters/problemListFetchers';
import { ensureTaskId, type TaskSpec } from '../adapters/ensureTask';
import { getAgentSession } from '../agent/useAgentSession';
import { createTopicFetchers } from '../adapters/topicFetchers';
import { MATH_TOPIC_SUBJECTS } from '../config/exam.constants';
import { ExamSearchPanel, type ExamSearchMode } from '../kit/exam-search/ExamSearchPanel';
import { ResearchPanel, type ResearchCategory } from '../kit/research/ResearchPanel';
import type { ExamSelection } from '../kit/exam-search/query';
import { ProblemListPanel, BookmarksPanel, type ProblemSource } from '../kit/problem-list/ProblemListPanel';
import { StudyNoteForm } from '../kit/study-note/StudyNoteForm';
import { createStudyNoteFetchers } from '../adapters/studyNoteFetchers';
import { TopicTabsPanel } from '../kit/topic-panel/TopicTabsPanel';
import { TopicUnitList } from '../kit/topic-panel/TopicUnitList';
import { UNITIMAGE } from '../config/api.constants';
import { apolloClient } from '../state/bootstrap';
import { solveStore, type SolveProblem } from '../state/solve';
import { storage } from '../storage';

export const topicFetchers = createTopicFetchers(apolloClient);
const problemListFetchers = createProblemListFetchers(apolloClient);
const studyNoteFetchers = createStudyNoteFetchers(apolloClient);

export type WidgetProps = { props: Record<string, unknown>; session: AgentSession };

/** task 생성이 이보다 오래 걸리면 taskId 없이 캔버스를 연다(늦게 온 성공은 ensureTask 캐시에 남는다) */
export const ENSURE_TASK_TIMEOUT_MS = 2500;

/** 캔버스를 열기 전 taskId를 확보한다(없고 spec이 있을 때만 task를 만든다). 실패·시간 초과여도 undefined로 캔버스는 연다 */
function resolveTaskId(taskId: number | undefined, spec: TaskSpec | undefined): Promise<number | undefined> {
  if (taskId || !spec) return Promise.resolve(taskId);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => {
      getAgentSession().emit('client_error', {
        where: 'study_note.ensure_task_timeout',
        message: `createTask did not finish within ${ENSURE_TASK_TIMEOUT_MS}ms`,
      });
      resolve(undefined);
    }, ENSURE_TASK_TIMEOUT_MS);
  });
  return Promise.race([ensureTaskId(taskId, spec), timeout]).finally(() => clearTimeout(timer));
}

/** open* 하나가 taskId를 기다리는 동안 들어온 다른 open*은 무시한다(연타로 캔버스가 두 번 열리지 않게) */
let opening = false;
async function openWithTask(taskId: number | undefined, spec: TaskSpec | undefined, navigate: (id: number | undefined) => void) {
  if (opening) return;
  opening = true;
  try {
    navigate(await resolveTaskId(taskId, spec));
  } finally {
    opening = false;
  }
}

/** 문제 묶음 → 책갈피/목록 task에 넣는 문제 식별자 목록 */
const unitsOf = (problems: { sourceType: string; sourceId: number }[]) => problems.map(({ sourceType, sourceId }) => ({ sourceType, sourceId }));

/** 문제 목록의 연필 버튼: 문제 묶음을 넘기고 풀이 화면(/notebook)으로 */
export function openNotebook(title: string | undefined, problems: SolveProblem[], index: number, taskId?: number, topicId?: number, spec?: TaskSpec) {
  return openWithTask(taskId, spec, (id) => {
    solveStore.dispatch({ title, problems, index, taskId: id, topicId });
    router.push('/notebook');
  });
}

/** 실황 수업 dock의 주제 실황 수업: 주제 실황 캔버스 화면(/topic-live-class)으로 */
export function openTopicLiveClass(topicId: number, taskId?: number, spec?: TaskSpec) {
  return openWithTask(taskId, spec, (id) =>
    router.push({ pathname: '/topic-live-class', params: { topicId: String(topicId), ...(id ? { taskId: String(id) } : {}) } }),
  );
}

/** 실황 수업 dock의 선생님 수업: 선생님 수업 캔버스 화면(/hotline-class)으로 */
export function openHotlineClass(tutorId: string, taskId?: number, spec?: TaskSpec) {
  return openWithTask(taskId, spec, (id) =>
    router.push({ pathname: '/hotline-class', params: { tutorId, ...(id ? { taskId: String(id) } : {}) } }),
  );
}

/** 실황 수업 dock·문제 목록이 공유하는 실황 수업 spec */
export const topicLiveSpec = (topicId: number): TaskSpec => ({ taskType: 'topic', task: { topicId } });
export const hotlineSpec = (tutorId: string): TaskSpec => ({ taskType: 'hotline', task: { tutorId } });
export const listSpec = (problems: { sourceType: string; sourceId: number }[]): TaskSpec => ({ taskType: 'list', task: { problems: unitsOf(problems) } });

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
  const taskId = props.taskId as number | undefined;
  return (
    <TopicUnitList
      fetchers={topicFetchers}
      topicId={topicId}
      onSelectUnit={({ unitIdx }) => session.emit('unit_selected', { topicId, unitIdx })}
      onSolve={({ unitIdx, topic }) =>
        void openNotebook(
          topic.title,
          topic.units.map((u) => ({ sourceType: u.sourceType, sourceId: u.sourceId, image: UNITIMAGE(u.sourceType, u.sourceId) ?? '' })),
          unitIdx,
          taskId,
          topicId,
          topicLiveSpec(topicId),
        )
      }
    />
  );
}

/** 문제 목록 출처별 [taskId, topicId, spec]: task는 이미 taskId가 있고, 나머지는 없으면 만든다 */
function notebookArgs(source: ProblemSource, problems: { sourceType: string; sourceId: number }[]): [number | undefined, undefined, TaskSpec | undefined] {
  switch (source.kind) {
    case 'task':
      return [source.taskId, undefined, undefined];
    case 'exam_query':
      return [source.taskId, undefined, { taskType: 'selection', task: source.query }];
    case 'bookmarks':
      return [source.taskId, undefined, { taskType: 'bookmark', task: { units: unitsOf(problems) } }];
    default:
      return [undefined, undefined, listSpec(problems)];
  }
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
        void (source.kind === 'topic_live'
          ? openTopicLiveClass(source.topicId, undefined, topicLiveSpec(source.topicId))
          : source.kind === 'hotline'
            ? openHotlineClass(source.tutorId, undefined, hotlineSpec(source.tutorId))
            : openNotebook(set.title, set.problems, index, ...notebookArgs(source, set.problems)))
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
      onSolve={({ index, set }) => void openNotebook(set.title, set.problems, index, ...notebookArgs(source, set.problems))}
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

/** 시트 위젯 props: 호스트의 배경 탭·뒤로가기를 위젯이 처리하도록 dismissRef에 닫기 핸들러를 등록한다 */
export type SheetWidgetProps = WidgetProps & { dismissRef: MutableRefObject<(() => void) | null> };

/** 서버가 title을 안 주면 같은 task로 방금 푼 풀이 화면의 제목을 쓴다 */
function solveTitleFor(taskId: number): string | undefined {
  const solve = solveStore.getState();
  return solve?.taskId === taskId ? solve.title : undefined;
}

/**
 * 학습장 시트: 저장·닫기를 에이전트 이벤트로 알리고 시트를 닫는다. taskId가 바뀌면 key로 양식을 다시 마운트한다.
 * 같은 taskId에서는 saved/dismissed 중 먼저 온 하나만 내보내고 closeSheet도 한 번만 부른다(늦은 onDone은 무시).
 */
function StudyNoteWidget({ props, session, dismissRef }: SheetWidgetProps) {
  const taskId = props.taskId as number;
  const finishedFor = useRef<number | null>(null);
  const finish = (forTask: number, result: 'saved' | 'dismissed') => {
    if (forTask !== taskId || finishedFor.current === forTask) return;
    finishedFor.current = forTask;
    session.emit(result === 'saved' ? 'study_note_saved' : 'study_note_dismissed', { taskId: forTask });
    session.closeSheet();
  };
  dismissRef.current = () => finish(taskId, 'dismissed');
  return (
    <StudyNoteForm
      key={taskId}
      taskId={taskId}
      mode={props.mode as 'self' | 'live'}
      title={(props.title as string | undefined) ?? solveTitleFor(taskId) ?? '학습장 기록'}
      topicHints={props.topicHints as string[] | undefined}
      fetchers={studyNoteFetchers}
      store={storage}
      onDone={(result) => finish(taskId, result)}
    />
  );
}

/** Stage 대신 모달 시트로 뜨는 위젯(registry placement: 'sheet') */
export const sheetWidgets: Record<string, (p: SheetWidgetProps) => ReactElement> = {
  study_note: StudyNoteWidget,
};
