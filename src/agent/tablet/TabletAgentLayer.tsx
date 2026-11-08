import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { createLiveClassFetchers } from '../../adapters/liveClassFetchers';
import { createMessageBoxFetchers } from '../../adapters/messageBoxFetchers';
import { createNoticeFetchers } from '../../adapters/noticeFetchers';
import { createProfileEditors } from '../../adapters/profileEditors';
import { createRecordFetchers } from '../../adapters/recordFetchers';
import { createTimelineFetchers } from '../../adapters/timelineFetchers';
import { logout } from '../../auth/logout';
import { useMyInfo } from '../../auth/useMyInfo';
import { MATH_TOPIC_SUBJECTS } from '../../config/exam.constants';
import { hotlineSpec, listSpec, openHotlineClass, openNotebook, openTopicLiveClass, topicFetchers, topicLiveSpec } from '../../host/widgets';
import { DiaryPanel } from '../../kit/diary/DiaryPanel';
import { LiveClassListPanel } from '../../kit/live-class/LiveClassListPanel';
import { MessageBoxPanel } from '../../kit/profile/MessageBoxPanel';
import { MyInfoPanel } from '../../kit/profile/MyInfoPanel';
import { ProfileActions } from '../../kit/profile/ProfileActions';
import { ResearchPanel } from '../../kit/research/ResearchPanel';
import { TimelinePanel, noteSheetProps } from '../../kit/timeline/TimelinePanel';
import { apolloClient } from '../../state/bootstrap';
import { storage } from '../../storage';
import { layout, motion } from '../../ui/theme';
import { Toast } from '../../ui/toast/Toast';
import { DockWrapper } from '../DockWrapper';
import type { AgentSession, SessionSnapshot } from '../session';
import { ChatRail, RAIL_W } from './ChatRail';
import { ChatTimeline } from './ChatTimeline';
import type { DockKind } from './DrawerFooter';

// 태블릿 모드(§4.5, §4.6): 왼쪽에 끌어서 옮길 수 있는 세로 pill 툴바가 늘 떠 있고, 항목을 누르면 툴바 오른쪽에 dock이 열린다(Stage는 그대로).
// 채팅도 dock 하나다(툴바 맨 아래 채팅 버튼). 채팅 dock이 아닐 때 온 튜터·에이전트 메시지는 우상단 toast.
// 오버레이 루트는 box-none이라 툴바·dock·toast 밖의 터치는 아래 Stage(캔버스)로 통과한다. 홈 진입(로그인 직후·앱 시작) 시에는 타임라인 dock을 열어 둔다.
export const TOAST_MS = motion.toastMs;
export const TOAST_PREVIEW_CHARS = 30;

export type { DockKind };
/** dock에 열 수 있는 패널: 메뉴 dock + 채팅 */
type Panel = DockKind | 'chat';
const DOCK_TITLES: Record<Panel, string> = { chat: 'Study Log', timeline: 'Study', search: '검색', notice: 'Diary', profile: '내 정보', liveClass: '실황 수업' };
const noticeFetchers = createNoticeFetchers(apolloClient);
const timelineFetchers = createTimelineFetchers(apolloClient);
const messageBoxFetchers = createMessageBoxFetchers(apolloClient);
const profileEditors = createProfileEditors(apolloClient);
const recordFetchers = createRecordFetchers(apolloClient);
const liveClassFetchers = createLiveClassFetchers();

export function toastPreview(text: string): string {
  return text.length > TOAST_PREVIEW_CHARS ? `${text.slice(0, TOAST_PREVIEW_CHARS - 1)}…` : text;
}

export function TabletAgentLayer({ state, session }: { state: SessionSnapshot; session: AgentSession }) {
  const ins = state.instruction;

  const [dock, setDock] = useState<Panel | null>('timeline');
  const myInfo = useMyInfo();
  const [toastFor, setToastFor] = useState<string | null>(null);
  const [unread, setUnread] = useState(false);
  const seen = useRef<string | null>(null);

  const stageId = state.stage?.componentId;
  const problemStage = stageId === 'problem_list' || stageId === 'problem_preview';
  const chatShown = dock === 'chat';

  // 새 instruction 도착 시: 채팅 dock이 열려 있으면 그대로 보인다. 다른 dock이 열려 있거나 응답이 필요 없는 튜터 메시지 → toast,
  // 그 밖(응답 필요·기본 흐름)은 채팅 dock을 바로 연다. Stage에 문제 목록이 떠 있는 동안은 응답이 필요 없는 안내도 toast로(문제를 가리지 않게).
  useEffect(() => {
    if (!ins || seen.current === ins.messageId) return;
    seen.current = ins.messageId;
    if (dock === 'chat') return;
    if (dock !== null || (!ins.requiresResponse && (ins.source === 'tutor' || problemStage))) {
      setToastFor(ins.messageId);
      setUnread(true);
    } else {
      setDock('chat');
    }
  }, [ins, problemStage, dock]);

  // instruction이 사라지면 채팅 dock을 닫는다
  const prevIns = useRef(ins);
  useEffect(() => {
    if (prevIns.current && !ins) setDock((d) => (d === 'chat' ? null : d));
    prevIns.current = ins;
  }, [ins]);

  // Stage에 문제 목록이 뜰 때마다(이미 문제 목록이 떠 있어도 새 show_component면) 문제를 보며 풀 수 있게 dock을 닫는다.
  // 단 Diary dock의 '가자!!!'로 띄운 그날 문제 목록(source.kind 'list')은 dock을 그대로 둔다
  const stage = state.stage;
  useEffect(() => {
    const fromDiary = (stage?.props.source as { kind?: string } | undefined)?.kind === 'list';
    if (stage && !fromDiary && (stage.componentId === 'problem_list' || stage.componentId === 'problem_preview')) setDock(null);
  }, [stage]);

  const openChat = () => {
    setToastFor(null);
    setUnread(false);
    setDock('chat');
  };

  const toggleDock = (kind: Panel) => {
    if (dock === kind) return setDock(null);
    if (kind === 'chat') return openChat();
    // 타임라인·검색·공지는 학습 흐름에 속하므로 에이전트에 알린다(프로토콜 menu_selected). 내 정보·실황 수업은 앱 안에서만.
    if (kind !== 'profile' && kind !== 'liveClass') session.emit('menu_selected', { menu: kind });
    setDock(kind);
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <ChatRail active={dock} unread={unread} onItem={toggleDock} />

      {dock && (
        <DockWrapper title={DOCK_TITLES[dock]} left={layout.gutter + RAIL_W + layout.gutter} onClose={() => setDock(null)}>
          {dock === 'chat' && <ChatTimeline state={state} session={session} />}
          {dock === 'timeline' && (
            <TimelinePanel
              fetchers={timelineFetchers}
              onSelectTask={(t) => {
                setDock(null);
                session.emit('task_selected', {
                  taskId: Number(t.id),
                  taskType: t.taskType,
                  ...(t.collectionId != null ? { collectionId: Number(t.collectionId) } : {}),
                });
              }}
              onOpenNote={(t) => session.showLocalSheet('study_note', noteSheetProps(t))}
            />
          )}
          {dock === 'notice' && (
            <DiaryPanel
              recordFetchers={recordFetchers}
              noticeFetchers={noticeFetchers}
              onSolveDay={(day, problems) => {
                // Stage에 그날 문제 목록을 띄우고 곧바로 풀이 화면으로. dock은 그대로 두어 풀이 화면에서 나오면 지금 상태로 돌아온다
                const title = `${day} 일자`;
                session.showLocalComponent('problem_list', { source: { kind: 'list', title, problems } });
                void openNotebook(title, problems, 0, undefined, undefined, listSpec(problems));
              }}
            />
          )}
          {dock === 'liveClass' && (
            // 고른 수업의 문제를 Stage 문제 목록으로. problem_list가 뜨면 dock은 닫힌다(선생님 수업 문제 변경은 문제 목록이 구독).
            // 그리고 곧바로 그 수업의 실황 캔버스 화면으로 넘어간다(나오면 Stage에 그 수업 문제 목록이 남는다)
            <LiveClassListPanel
              fetchers={liveClassFetchers}
              onOpen={(source) => {
                session.showLocalComponent('problem_list', { source });
                if (source.kind === 'topic_live') void openTopicLiveClass(source.topicId, undefined, topicLiveSpec(source.topicId));
                else if (source.kind === 'hotline') void openHotlineClass(source.tutorId, undefined, hotlineSpec(source.tutorId));
              }}
            />
          )}
          {dock === 'profile' && (
            <>
              <MyInfoPanel info={myInfo} />
              <MessageBoxPanel fetchers={messageBoxFetchers} />
              <ProfileActions name={myInfo.name} editors={profileEditors} onLogout={() => void logout()} />
            </>
          )}
          {dock === 'search' && (
            <ResearchPanel
              fetchers={topicFetchers}
              topicSubjects={MATH_TOPIC_SUBJECTS}
              store={storage}
              onSubmitSearch={(query) => {
                setDock(null);
                session.emit('search_submitted', { query });
              }}
              onSelectTopic={(t) => {
                setDock(null);
                session.emit('topic_selected', { topicId: Number(t.id), title: t.title, source: 'research' });
              }}
            />
          )}
        </DockWrapper>
      )}

      {toastFor && ins?.messageId === toastFor && !chatShown && (
        <Toast
          title={ins.source === 'tutor' ? '튜터 메시지' : '에이전트'}
          text={toastPreview(ins.text)}
          accessibilityLabel={`${ins.source === 'tutor' ? '튜터 메시지' : '에이전트'} 열기`}
          onPress={openChat}
          onTimeout={() => setToastFor(null)}
        />
      )}
    </View>
  );
}
