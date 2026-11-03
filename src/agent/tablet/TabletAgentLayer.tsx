import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { createMessageBoxFetchers } from '../../adapters/messageBoxFetchers';
import { createNoticeFetchers } from '../../adapters/noticeFetchers';
import { createProfileEditors } from '../../adapters/profileEditors';
import { createTimelineFetchers } from '../../adapters/timelineFetchers';
import { logout } from '../../auth/logout';
import { useMyInfo } from '../../auth/useMyInfo';
import { MATH_TOPIC_SUBJECTS } from '../../config/exam.constants';
import { topicFetchers } from '../../host/widgets';
import { NoticesPanel } from '../../kit/notices/NoticesPanel';
import { MessageBoxPanel } from '../../kit/profile/MessageBoxPanel';
import { MyInfoPanel } from '../../kit/profile/MyInfoPanel';
import { ProfileActions } from '../../kit/profile/ProfileActions';
import { ResearchPanel } from '../../kit/research/ResearchPanel';
import { TimelinePanel } from '../../kit/timeline/TimelinePanel';
import { drawerWidth } from '../../layout/deviceMode';
import { apolloClient } from '../../state/bootstrap';
import { storage } from '../../storage';
import { colors, layout, motion, radius, space, type } from '../../ui/theme';
import { Toast } from '../../ui/toast/Toast';
import { DockWrapper } from '../DockWrapper';
import { InstructionCard } from '../InstructionCard';
import type { AgentSession, SessionSnapshot } from '../session';
import { AgentDrawer } from './AgentDrawer';
import { ChatRail } from './ChatRail';
import { DrawerFooter, type DockKind } from './DrawerFooter';

// 태블릿 모드(§4.5, §4.6): 필요할 때만 왼쪽→오른쪽 drawer, 튜터 메시지는 우상단 toast.
// 오버레이 루트는 box-none이라 drawer·레일·toast 밖의 터치는 아래 Stage(캔버스)로 통과한다.
// drawer 하단 바의 '공지'·'검색'·'타임라인'·'내 정보'는 해당 패널을 drawer 오른쪽에 붙은 dock으로 연다(Stage는 그대로).
// drawer를 접으면 끌어서 옮길 수 있는 세로 pill 툴바가 남는다(기존 가장자리 '>' 탭 대체). 홈 진입(로그인 직후·앱 시작) 시에는 drawer와 타임라인 dock을 열어 둔다.
export const TOAST_MS = motion.toastMs;
export const TOAST_PREVIEW_CHARS = 30;

export type { DockKind };
const DOCK_TITLES: Record<DockKind, string> = { timeline: '타임라인', search: '검색', notice: '공지', profile: '내 정보' };
const noticeFetchers = createNoticeFetchers(apolloClient);
const timelineFetchers = createTimelineFetchers(apolloClient);
const messageBoxFetchers = createMessageBoxFetchers(apolloClient);
const profileEditors = createProfileEditors(apolloClient);

export function toastPreview(text: string): string {
  return text.length > TOAST_PREVIEW_CHARS ? `${text.slice(0, TOAST_PREVIEW_CHARS - 1)}…` : text;
}

export function TabletAgentLayer({ state, session }: { state: SessionSnapshot; session: AgentSession }) {
  const { width, height } = useWindowDimensions();
  const dw = drawerWidth(width, height);
  const ins = state.instruction;

  const [open, setOpen] = useState(true);
  const [dock, setDock] = useState<DockKind | null>('timeline');
  const myInfo = useMyInfo();
  const [toastFor, setToastFor] = useState<string | null>(null);
  const [unread, setUnread] = useState(false);
  const seen = useRef<string | null>(null);

  const stageId = state.stage?.componentId;
  const problemStage = stageId === 'problem_list' || stageId === 'problem_preview';

  // 새 instruction 도착 시: 응답 필요 또는 기본 흐름 → drawer 바로 열기, 그 밖의 튜터 메시지 → toast.
  // Stage에 문제 목록이 떠 있는 동안은 응답이 필요 없는 안내도 toast로(문제를 가리지 않게).
  useEffect(() => {
    if (!ins || seen.current === ins.messageId) return;
    seen.current = ins.messageId;
    if (!ins.requiresResponse && (ins.source === 'tutor' || problemStage)) {
      setToastFor(ins.messageId);
      setUnread(true);
    } else {
      setOpen(true);
    }
  }, [ins, problemStage]);

  // instruction이 사라지면 닫는다(처음부터 없을 때는 홈 진입용으로 연 drawer를 그대로 둔다)
  const prevIns = useRef(ins);
  useEffect(() => {
    if (prevIns.current && !ins) setOpen(false);
    prevIns.current = ins;
  }, [ins]);

  // Stage에 문제 목록이 뜰 때마다(이미 문제 목록이 떠 있어도 새 show_component면) 문제를 보며 풀 수 있게 drawer를 닫는다
  const stage = state.stage;
  useEffect(() => {
    if (stage && (stage.componentId === 'problem_list' || stage.componentId === 'problem_preview')) setOpen(false);
  }, [stage]);

  // drawer가 닫히면 dock도 닫는다
  useEffect(() => {
    if (!open) setDock(null);
  }, [open]);

  const openDrawer = () => {
    setToastFor(null);
    setUnread(false);
    setOpen(true);
  };

  const toggleDock = (kind: DockKind) => {
    if (dock === kind) return setDock(null);
    // 타임라인·검색·공지는 학습 흐름에 속하므로 에이전트에 알린다(프로토콜 menu_selected). 내 정보는 앱 안에서만.
    if (kind !== 'profile') session.emit('menu_selected', { menu: kind });
    setDock(kind);
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* 접힌 툴바는 항상 마운트해 두고 drawer가 열리면 숨긴다(사용자가 끌어 옮긴 위치 유지) */}
      <ChatRail
        visible={!open}
        unread={unread}
        onOpen={openDrawer}
        onItem={(kind) => {
          openDrawer();
          toggleDock(kind);
        }}
      />

      <AgentDrawer open={open} width={dw} onCollapse={() => setOpen(false)} hideHandle={dock !== null} footer={<DrawerFooter active={dock} onPress={toggleDock} />}>
        {ins ? (
          <InstructionCard
            instruction={ins}
            paused={state.pausedDefault !== null}
            onChoice={(id) => session.selectChoice(ins.messageId, id)}
            onDismiss={() => session.dismissInstruction(ins.messageId)}
          />
        ) : (
          <Text style={styles.muted}>지금은 안내가 없어요.</Text>
        )}
        {state.history.length > 0 && (
          <View style={styles.history}>
            <Text style={styles.historyTitle}>이전 메시지</Text>
            {state.history.slice(-5).map((h) => (
              <View key={h.messageId} style={[styles.bubble, h.source === 'tutor' ? styles.bubbleTutor : styles.bubbleAgent]}>
                <Text style={styles.bubbleWho}>{h.source === 'tutor' ? '튜터' : '에이전트'}</Text>
                <Text style={styles.bubbleText}>{h.text}</Text>
              </View>
            ))}
          </View>
        )}
      </AgentDrawer>

      {dock && (
        <DockWrapper title={DOCK_TITLES[dock]} left={layout.gutter + dw + layout.gutter} onClose={() => setDock(null)}>
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
            />
          )}
          {dock === 'notice' && <NoticesPanel fetchers={noticeFetchers} />}
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

      {toastFor && ins?.messageId === toastFor && !open && (
        <Toast
          title={ins.source === 'tutor' ? '튜터 메시지' : '에이전트'}
          text={toastPreview(ins.text)}
          accessibilityLabel={`${ins.source === 'tutor' ? '튜터 메시지' : '에이전트'} 열기`}
          onPress={openDrawer}
          onTimeout={() => setToastFor(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { ...type.body, color: colors.muted },
  history: { gap: space.sm },
  historyTitle: { ...type.caption, color: colors.muted },
  bubble: { padding: space.md, borderRadius: radius.lg, gap: space.xxs },
  bubbleAgent: { backgroundColor: colors.accentSoft },
  bubbleTutor: { backgroundColor: colors.cardMuted },
  bubbleWho: { ...type.caption, color: colors.muted },
  bubbleText: { ...type.body, color: colors.text },
});
