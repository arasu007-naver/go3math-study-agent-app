/**
 * 폰 모드 화면 — 태블릿 ChatRail 항목이 하단 탭이 되고, 각 dock 내용이 그 탭의 첫 화면이 된다.
 * 검색·타임라인·채팅에서 연 결과(문제 목록·주제 문제·해답)는 그 탭 Stack의 child 화면으로 쌓인다(탭 바는 그대로).
 * 학생 행동은 태블릿과 같은 이벤트로 에이전트에 알리지만(타임라인 기록), 폰은 결과 화면을 앱이 바로 연다.
 * 결과 화면의 문제 카드 아래 한 줄: 눈(해답 보기) · 카메라(풀이 스캔 업로드).
 * 폰에는 풀이 캔버스가 없다 — 공책·연습장에 푼 풀이를 카메라로 찍어 올리는 것으로 대신하므로 연필 FAB(onSolve)를 넘기지 않는다.
 */
import { HeaderBackButton } from '@react-navigation/elements';
import { useIsFocused } from '@react-navigation/native';
import { Stack, router, useLocalSearchParams, type Href } from 'expo-router';
import moment from 'moment';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMessageBoxFetchers } from '../adapters/messageBoxFetchers';
import { createNoticeFetchers } from '../adapters/noticeFetchers';
import { createProblemListFetchers } from '../adapters/problemListFetchers';
import { createProfileEditors } from '../adapters/profileEditors';
import { createRecordFetchers } from '../adapters/recordFetchers';
import { createSolutionPhotoUploader, type SolutionTarget } from '../adapters/solutionPhoto';
import { createTimelineFetchers } from '../adapters/timelineFetchers';
import { ChatTimeline } from '../agent/tablet/ChatTimeline';
import { useAgentSession } from '../agent/useAgentSession';
import { logout } from '../auth/logout';
import { useMyInfo } from '../auth/useMyInfo';
import { MATH_TOPIC_SUBJECTS } from '../config/exam.constants';
import { UNITANSWER } from '../config/api.constants';
import { topicFetchers } from '../host/widgets';
import { DailyRecordsList } from '../kit/diary/DailyRecordsList';
import { RecordsCalendar } from '../kit/diary/RecordsCalendar';
import { NoticesPanel } from '../kit/notices/NoticesPanel';
import { ProblemActionRow } from '../kit/problem-list/ProblemActionRow';
import { ProblemListPanel, type ProblemSource } from '../kit/problem-list/ProblemListPanel';
import { MessageBoxPanel } from '../kit/profile/MessageBoxPanel';
import { MyInfoPanel } from '../kit/profile/MyInfoPanel';
import { ProfileActions } from '../kit/profile/ProfileActions';
import { ResearchPanel } from '../kit/research/ResearchPanel';
import { TimelinePanel, describeTask, noteSheetProps } from '../kit/timeline/TimelinePanel';
import { TopicUnitList } from '../kit/topic-panel/TopicUnitList';
import QoollaWebView from '../kit/ui/web-view';
import { apolloClient } from '../state/bootstrap';
import { storage } from '../storage';
import { colors } from '../ui/theme';

/** 결과 화면을 child로 쌓는 탭(각 탭 폴더의 Stack) */
export type ResultTab = 'timeline' | 'search' | 'chat';

const timelineFetchers = createTimelineFetchers(apolloClient);
const noticeFetchers = createNoticeFetchers(apolloClient);
const messageBoxFetchers = createMessageBoxFetchers(apolloClient);
const problemListFetchers = createProblemListFetchers(apolloClient);
const profileEditors = createProfileEditors(apolloClient);
const recordFetchers = createRecordFetchers(apolloClient);
const uploadSolution = createSolutionPhotoUploader(apolloClient);

const href = (path: string, params: Record<string, string | number | undefined>) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${path}?${q}` as Href;
};

export function openProblems(tab: ResultTab, source: ProblemSource, title?: string) {
  router.push(href(`/${tab}/problems`, { source: JSON.stringify(source), title }));
}

export function openTopic(tab: ResultTab, topicId: number, title?: string) {
  router.push(href(`/${tab}/topic`, { topicId, title }));
}

// ───────── 탭 첫 화면(= 태블릿 dock 내용)

/** 탭 첫 화면 바탕. 제목 헤더가 없으므로 위 safe area만 비운다(아래는 탭 바 뒤로 내용이 이어진다) */
function TabPage({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={['top']} style={styles.page}>
      {children}
    </SafeAreaView>
  );
}

export function TimelineTabScreen() {
  const { session } = useAgentSession();
  return (
    <TabPage>
      <TimelinePanel
        fetchers={timelineFetchers}
        onSelectTask={(t) => {
          session.emit('task_selected', {
            taskId: Number(t.id),
            taskType: t.taskType,
            ...(t.collectionId != null ? { collectionId: Number(t.collectionId) } : {}),
          });
          openProblems('timeline', { kind: 'task', taskId: Number(t.id) }, describeTask(t).title.replace(/^📝\s*/, ''));
        }}
        onOpenNote={(t) => session.showLocalSheet('study_note', noteSheetProps(t))}
      />
    </TabPage>
  );
}

export function SearchTabScreen() {
  const { session } = useAgentSession();
  return (
    <TabPage>
      <ResearchPanel
        fetchers={topicFetchers}
        topicSubjects={MATH_TOPIC_SUBJECTS}
        store={storage}
        onSubmitSearch={(query) => {
          session.emit('search_submitted', { query });
          openProblems('search', { kind: 'exam_query', query }, '기출 검색');
        }}
        onSelectTopic={(t) => {
          session.emit('topic_selected', { topicId: Number(t.id), title: t.title, source: 'research' });
          openTopic('search', Number(t.id), t.title);
        }}
      />
    </TabPage>
  );
}

/** Diary 탭: 기존 DiaryScreen의 월간 풀이 달력(상단 고정) + 그 아래 달력과 같은 달 공지사항(목록만 스크롤) */
export function DiaryTabScreen() {
  const focused = useIsFocused();
  const [reloadKey, setReloadKey] = useState(0);
  // 달력이 보고 있는 달('YYYY-MM') = 공지를 받을 달(태블릿 Diary dock과 같다)
  const [month, setMonth] = useState(() => moment().format('YYYY-MM'));
  const wasFocused = useRef(focused);
  // 탭에 다시 들어올 때마다 그 달 기록을 새로 받는다(기존 DiaryScreen의 focus 재조회). 첫 진입은 달력이 스스로 받는다
  useEffect(() => {
    if (focused && !wasFocused.current) setReloadKey((k) => k + 1);
    wasFocused.current = focused;
  }, [focused]);
  return (
    <TabPage>
      <RecordsCalendar fetchers={recordFetchers} reloadKey={reloadKey}
        onSelectDay={(day) => router.push(href('/diary/day', { day }))}
        onMonthChange={setMonth}
      />
      <View style={styles.diaryNotices}>
        <NoticesPanel fetchers={noticeFetchers} month={month} />
      </View>
    </TabPage>
  );
}

export function ProfileTabScreen() {
  const myInfo = useMyInfo();
  return (
    <TabPage>
      {/* 프로필 카드·버튼 줄은 상단 고정, 개인 사서함 목록(FlatList)만 스크롤 */}
      <View style={styles.profile}>
        <MyInfoPanel info={myInfo} style={styles.profileInfo} />
        <ProfileActions name={myInfo.name} editors={profileEditors} onLogout={() => void logout()} />
        <MessageBoxPanel fetchers={messageBoxFetchers} />
      </View>
    </TabPage>
  );
}

/** 채팅 탭: 태블릿 채팅 dock과 같은 시간순 타임라인. 카드를 눌러 에이전트가 문제를 띄우면 그 결과를 이 탭의 child로 연다 */
export function ChatTabScreen() {
  const { session, state } = useAgentSession();
  const focused = useIsFocused();
  const stage = state.stage;
  const lastStage = useRef(stage);

  useEffect(() => {
    if (stage === lastStage.current) return;
    lastStage.current = stage;
    // 다른 탭에서 보낸 이벤트의 응답(검색 결과 등)은 그 탭이 이미 열었으므로 채팅 탭이 보일 때만
    if (!focused || !stage) return;
    if (stage.componentId === 'problem_list') openProblems('chat', stage.props.source as ProblemSource);
    else if (stage.componentId === 'problem_preview') openTopic('chat', Number(stage.props.topicId));
  }, [stage, focused]);

  return (
    <TabPage>
      <ChatTimeline state={state} session={session} />
    </TabPage>
  );
}

// ───────── 결과 화면(각 탭 Stack의 child)

/**
 * 문제 목록·주제 문제의 '뒤로'는 늘 그 탭 첫 화면으로 돌아간다. 아래에 탭 첫 화면이 없을 때(재시작·리로드로 결과 화면에서 바로 열림)도
 * dismissTo가 탭 첫 화면으로 바꿔 준다. (해답 화면의 '뒤로'는 기본대로 문제 목록으로)
 */
function backToTab(tab: ResultTab) {
  return function BackToTab({ tintColor }: { tintColor?: string }) {
    return <HeaderBackButton label="뒤로" tintColor={tintColor} onPress={() => router.dismissTo(`/${tab}` as Href)} />;
  };
}

/** 문제 카드 아래 해답·카메라 줄. 올리는 동안 카메라 자리에 스피너 */
function SolutionRow({ tab, index, problem, taskId }: { tab: ResultTab; index: number; problem: { sourceType: string; sourceId: number }; taskId?: number }) {
  const [uploading, setUploading] = useState(false);
  const capture = async (target: SolutionTarget) => {
    setUploading(true);
    try {
      if (await uploadSolution(target)) Alert.alert('풀이를 올렸어요', `${index + 1}번 문제 풀이 사진을 저장했어요.`);
    } catch (e) {
      console.warn('[solution-photo]', e);
      Alert.alert('올리지 못했어요', '잠시 후 다시 시도해 주세요.');
    } finally {
      setUploading(false);
    }
  };
  return (
    <ProblemActionRow
      label={`${index + 1}번 문제`}
      uploading={uploading}
      onAnswer={() => router.push(href(`/${tab}/solution`, { sourceType: problem.sourceType, sourceId: problem.sourceId }))}
      onCamera={() => void capture({ sourceType: problem.sourceType, sourceId: problem.sourceId, taskId })}
    />
  );
}

export function ProblemsResultScreen({ tab }: { tab: ResultTab }) {
  const { session } = useAgentSession();
  const params = useLocalSearchParams<{ source: string; title?: string }>();
  const source = JSON.parse(params.source) as ProblemSource;
  const taskId = source.kind === 'task' ? source.taskId : undefined;
  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: params.title ?? '문제', headerLeft: backToTab(tab) }} />
      <ProblemListPanel
        fetchers={problemListFetchers}
        source={source}
        onSelectProblem={({ index, problem }) =>
          session.emit('problem_selected', { index, sourceType: problem.sourceType, sourceId: problem.sourceId, ...(taskId != null ? { taskId } : {}) })
        }
        renderFooter={({ index, problem }) => <SolutionRow tab={tab} index={index} problem={problem} taskId={taskId} />}
      />
    </View>
  );
}

export function TopicResultScreen({ tab }: { tab: ResultTab }) {
  const { session } = useAgentSession();
  const params = useLocalSearchParams<{ topicId: string; title?: string }>();
  const topicId = Number(params.topicId);
  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: params.title ?? '주제', headerLeft: backToTab(tab) }} />
      <TopicUnitList
        fetchers={topicFetchers}
        topicId={topicId}
        onSelectUnit={({ unitIdx }) => session.emit('unit_selected', { topicId, unitIdx })}
        renderFooter={({ unitIdx, unit }) => <SolutionRow tab={tab} index={unitIdx} problem={unit} />}
      />
    </View>
  );
}

export function SolutionResultScreen() {
  const { sourceType, sourceId } = useLocalSearchParams<{ sourceType: string; sourceId: string }>();
  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: '해답' }} />
      <QoollaWebView originWhitelist={['*']} source={{ uri: UNITANSWER(sourceType, sourceId)! }} />
    </View>
  );
}

/** Diary 탭 child: 달력에서 누른 날의 풀이 기록(기존 DailyRecordsViewPage). '답안 예시'는 이 탭의 해답 화면으로 */
export function DiaryDayScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: `${day} 일자` }} />
      <DailyRecordsList
        fetchers={recordFetchers}
        day={day}
        onShowAnswer={(r) => router.push(href('/diary/solution', { sourceType: r.sourceType, sourceId: r.sourceId }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.card },
  diaryNotices: { flex: 1 },
  profile: { flex: 1, paddingTop: 12 },
  profileInfo: { paddingBottom: 0 },
});
