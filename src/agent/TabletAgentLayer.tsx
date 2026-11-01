import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { createMessageBoxFetchers } from '../adapters/messageBoxFetchers';
import { createNoticeFetchers } from '../adapters/noticeFetchers';
import { createTimelineFetchers } from '../adapters/timelineFetchers';
import { logout } from '../auth/logout';
import { useMyInfo } from '../auth/useMyInfo';
import { MATH_TOPIC_SUBJECTS } from '../config/exam.constants';
import { topicFetchers } from '../host/widgets';
import { NoticesPanel } from '../kit/notices/NoticesPanel';
import { MessageBoxPanel } from '../kit/profile/MessageBoxPanel';
import { MyInfoPanel } from '../kit/profile/MyInfoPanel';
import { ResearchPanel } from '../kit/research/ResearchPanel';
import { TimelinePanel } from '../kit/timeline/TimelinePanel';
import { apolloClient } from '../state/bootstrap';
import { storage } from '../storage';
import type { AgentSession, SessionSnapshot } from './session';
import { DockWrapper } from './DockWrapper';
import { EDGE_TAB_HEIGHT, EDGE_TAB_WIDTH, EdgeTab } from './EdgeTab';
import { InstructionCard } from './InstructionCard';
import { drawerWidth } from '../layout/deviceMode';
import { colors } from '../ui/theme';

// 태블릿 모드(§4.5, §4.6): 필요할 때만 왼쪽→오른쪽 drawer, 튜터 메시지는 우상단 toast.
// 오버레이 루트는 box-none이라 drawer·핸들·toast 밖의 터치는 아래 Stage(캔버스)로 통과한다.
// drawer 하단 '타임라인'·'검색'·'공지'·'내 정보 관리'는 해당 패널을 drawer 오른쪽 가운데에 붙은 dock으로 연다(Stage는 그대로).
// 홈 진입(로그인 직후·앱 시작) 시에는 drawer와 타임라인 dock을 열어 둔다.
export const TOAST_MS = 6400;
export const TOAST_PREVIEW_CHARS = 30;

export type DockKind = 'timeline' | 'search' | 'notice' | 'profile';
const DOCK_TITLES: Record<DockKind, string> = { timeline: '타임라인', search: '검색', notice: '공지', profile: '내 정보' };
const noticeFetchers = createNoticeFetchers(apolloClient);
const timelineFetchers = createTimelineFetchers(apolloClient);
const messageBoxFetchers = createMessageBoxFetchers(apolloClient);

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

  const slide = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(slide, { toValue: open ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  }, [open, slide]);
  const translateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-dw - 16, 0] });
  // drawer 닫기 탭: drawer 오른쪽 가운데에 붙는 형제 요소(부모 밖이면 Android에서 터치가 안 감). dock이 열리면 그 아래에 가려진다.
  const closeTabX = slide.interpolate({ inputRange: [0, 1], outputRange: [-dw - EDGE_TAB_WIDTH - 16, 0] });
  const tabTop = height / 2 - EDGE_TAB_HEIGHT / 2;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {!open && (
        <EdgeTab
          direction="open"
          label={unread ? '에이전트 drawer 열기 (읽지 않은 메시지 있음)' : '에이전트 drawer 열기'}
          onPress={openDrawer}
          style={{ left: 0, top: tabTop }}>
          {unread && <View style={styles.dot} />}
        </EdgeTab>
      )}

      <Animated.View
        pointerEvents={open ? 'box-none' : 'none'}
        style={{ position: 'absolute', left: dw, top: tabTop, transform: [{ translateX: closeTabX }] }}>
        <EdgeTab direction="close" label="drawer 닫기" onPress={() => setOpen(false)} style={{ position: 'relative' }} />
      </Animated.View>

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        accessibilityLabel="에이전트 drawer"
        style={[styles.drawer, { width: dw, transform: [{ translateX }] }]}>
        <View style={styles.drawerHead}>
          <Text style={styles.drawerTitle}>에이전트</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={{ gap: 16 }}>
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
                <Text key={h.messageId} style={styles.historyItem}>
                  {h.source === 'tutor' ? '튜터' : '에이전트'}: {h.text}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
        <DrawerFooter
          dock={dock}
          onToggleDock={(kind) => {
            if (dock === kind) return setDock(null);
            // 타임라인·검색·공지는 학습 흐름에 속하므로 에이전트에 알린다(프로토콜 menu_selected). 내 정보는 앱 안에서만.
            if (kind !== 'profile') session.emit('menu_selected', { menu: kind });
            setDock(kind);
          }}
        />
      </Animated.View>

      {dock && (
        <DockWrapper title={DOCK_TITLES[dock]} drawerWidth={dw} slide={slide} onClose={() => setDock(null)}>
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
            </>
          )}
          {dock === 'search' && <ResearchPanel
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
          />}
        </DockWrapper>
      )}

      {toastFor && ins?.messageId === toastFor && !open && (
        <TutorToast label={ins.source === 'tutor' ? '튜터 메시지' : '에이전트'} text={ins.text} onPress={openDrawer} onTimeout={() => setToastFor(null)} />
      )}
    </View>
  );
}

/** drawer 하단 고정 메뉴: 대화 영역(ScrollView) 밖에 있어 스크롤해도 위치가 바뀌지 않는다. */
function DrawerFooter({ dock, onToggleDock }: { dock: DockKind | null; onToggleDock(kind: DockKind): void }) {
  const items: { label: string; onPress(): void; on?: boolean }[] = [
    { label: '타임라인', onPress: () => onToggleDock('timeline'), on: dock === 'timeline' },
    { label: '검색', onPress: () => onToggleDock('search'), on: dock === 'search' },
    { label: '공지', onPress: () => onToggleDock('notice'), on: dock === 'notice' },
    { label: '내 정보 관리', onPress: () => onToggleDock('profile'), on: dock === 'profile' },
    { label: '로그 아웃', onPress: () => void logout() },
  ];
  return (
    <View style={styles.footer}>
      {items.map((it) => (
        <Pressable
          key={it.label}
          accessibilityRole="button"
          accessibilityState={it.on !== undefined ? { selected: it.on } : undefined}
          onPress={it.onPress}
          style={({ pressed }) => [styles.footerBtn, it.on && styles.footerBtnOn, pressed && { opacity: 0.6 }]}>
          <Text style={styles.footerText}>{it.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function TutorToast({ label, text, onPress, onTimeout }: { label: string; text: string; onPress(): void; onTimeout(): void }) {
  const remaining = useRef(TOAST_MS);
  const startedAt = useRef(Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const run = () => {
    startedAt.current = Date.now();
    timer.current = setTimeout(onTimeout, remaining.current);
  };
  const pause = () => {
    clearTimeout(timer.current);
    remaining.current -= Date.now() - startedAt.current;
  };

  useEffect(() => {
    run();
    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label} 열기`}
      onPress={onPress}
      onPressIn={pause}
      onPressOut={run}
      style={styles.toast}>
      <Text style={styles.toastLabel}>{label}</Text>
      <Text style={styles.toastText}>{toastPreview(text)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute', top: 8, right: 6, width: 10, height: 10, borderRadius: 5, backgroundColor: colors.unread },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    padding: 20,
    gap: 16,
    backgroundColor: colors.surface,
    borderRightWidth: 2,
    borderRightColor: colors.agent,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 8, height: 0 },
    elevation: 12,
  },
  drawerHead: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  drawerTitle: { fontSize: 13, fontWeight: '700', color: colors.agentText },
  muted: { fontSize: 14, color: colors.muted },
  scroll: { flex: 1 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.agent },
  footerBtn: { flexGrow: 1, flexBasis: '45%', minHeight: 44, borderRadius: 22, borderWidth: 0, backgroundColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' },
  footerBtnOn: { backgroundColor: colors.agent },
  footerText: { fontSize: 14, color: colors.text },
  history: { gap: 8, borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12 },
  historyTitle: { fontSize: 12, fontWeight: '700', color: colors.muted },
  historyItem: { fontSize: 14, color: '#3F3F46' },
  toast: {
    position: 'absolute',
    right: 24,
    top: 16,
    width: 360,
    minHeight: 64,
    padding: 12,
    paddingHorizontal: 16,
    gap: 4,
    borderRadius: 12,
    backgroundColor: colors.tutor,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  toastLabel: { fontSize: 12, fontWeight: '700', color: '#D4D4D8' },
  toastText: { fontSize: 15, color: colors.surface },
});
