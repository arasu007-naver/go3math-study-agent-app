import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { createNoticeFetchers } from '../adapters/noticeFetchers';
import { logout } from '../auth/logout';
import { useMyInfo } from '../auth/useMyInfo';
import { MATH_TOPIC_SUBJECTS } from '../config/exam.constants';
import { topicFetchers } from '../host/widgets';
import { NoticesPanel } from '../kit/notices/NoticesPanel';
import { MyInfoPanel } from '../kit/profile/MyInfoPanel';
import { ResearchPanel } from '../kit/research/ResearchPanel';
import { apolloClient } from '../state/bootstrap';
import { storage } from '../storage';
import type { AgentSession, SessionSnapshot } from './session';
import { InstructionCard } from './InstructionCard';
import { drawerWidth } from '../layout/deviceMode';
import { colors } from '../ui/theme';

// 태블릿 모드(§4.5, §4.6): 필요할 때만 왼쪽→오른쪽 drawer, 튜터 메시지는 우상단 toast.
// 오버레이 루트는 box-none이라 drawer·핸들·toast 밖의 터치는 아래 Stage(캔버스)로 통과한다.
// drawer 하단 '검색'·'공지'·'내 정보 관리'는 해당 패널을 drawer 오른쪽 가운데에 붙은 dock으로 연다(Stage는 그대로).
export const TOAST_MS = 6400;
export const TOAST_PREVIEW_CHARS = 30;
const DOCK_MAX_WIDTH = 640;
const DOCK_HEIGHT_RATIO = 0.8;

export type DockKind = 'search' | 'notice' | 'profile';
const DOCK_TITLES: Record<DockKind, string> = { search: '검색', notice: '공지', profile: '내 정보' };
const noticeFetchers = createNoticeFetchers(apolloClient);

export function toastPreview(text: string): string {
  return text.length > TOAST_PREVIEW_CHARS ? `${text.slice(0, TOAST_PREVIEW_CHARS - 1)}…` : text;
}

export function TabletAgentLayer({ state, session }: { state: SessionSnapshot; session: AgentSession }) {
  const { width, height } = useWindowDimensions();
  const dw = drawerWidth(width, height);
  const ins = state.instruction;

  const [open, setOpen] = useState(false);
  const [dock, setDock] = useState<DockKind | null>(null);
  const myInfo = useMyInfo();
  const [toastFor, setToastFor] = useState<string | null>(null);
  const [unread, setUnread] = useState(false);
  const seen = useRef<string | null>(null);

  // 새 instruction 도착 시: 응답 필요 또는 기본 흐름 → drawer 바로 열기, 그 밖의 튜터 메시지 → toast
  useEffect(() => {
    if (!ins || seen.current === ins.messageId) return;
    seen.current = ins.messageId;
    if (ins.source === 'tutor' && !ins.requiresResponse) {
      setToastFor(ins.messageId);
      setUnread(true);
    } else {
      setOpen(true);
    }
  }, [ins]);

  useEffect(() => {
    if (!ins) setOpen(false);
  }, [ins]);

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
  const dockWidth = Math.min(DOCK_MAX_WIDTH, width - dw - 24);
  const dockHeight = Math.round(height * DOCK_HEIGHT_RATIO);
  // dock은 drawer의 자식이 아니라 형제로 둔다(Android는 부모 밖 자식에 터치가 가지 않음). drawer와 같은 값으로 함께 움직인다.
  const dockTranslateX = slide.interpolate({ inputRange: [0, 1], outputRange: [-dw - dockWidth - 16, 0] });

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {!open && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={unread ? '에이전트 drawer 열기 (읽지 않은 메시지 있음)' : '에이전트 drawer 열기'}
          onPress={openDrawer}
          style={[styles.handle, { top: height / 2 - 56 }]}>
          <View style={styles.handleBar} />
          {unread && <View style={styles.dot} />}
        </Pressable>
      )}

      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        accessibilityLabel="에이전트 drawer"
        style={[styles.drawer, { width: dw, transform: [{ translateX }] }]}>
        <View style={styles.drawerHead}>
          <Text style={styles.drawerTitle}>에이전트</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="drawer 닫기" onPress={() => setOpen(false)} style={styles.closeBtn}>
            <Text style={styles.closeText}>‹</Text>
          </Pressable>
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
            // 검색·공지는 학습 흐름에 속하므로 에이전트에 알린다(프로토콜 menu_selected). 내 정보는 앱 안에서만.
            if (kind !== 'profile') session.emit('menu_selected', { menu: kind });
            setDock(kind);
          }}
        />
      </Animated.View>

      {dock && (
        <Animated.View
          accessibilityLabel={`${DOCK_TITLES[dock]} dock`}
          style={[styles.dock, { left: dw, top: (height - dockHeight) / 2, width: dockWidth, height: dockHeight, transform: [{ translateX: dockTranslateX }] }]}>
          <View style={styles.dockHead}>
            <Text style={styles.drawerTitle}>{DOCK_TITLES[dock]}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel={`${DOCK_TITLES[dock]} 닫기`} onPress={() => setDock(null)} style={styles.closeBtn}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          {dock === 'notice' && <NoticesPanel fetchers={noticeFetchers} />}
          {dock === 'profile' && <MyInfoPanel info={myInfo} onSignOut={() => void logout()} />}
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
        </Animated.View>
      )}

      {toastFor && ins?.messageId === toastFor && !open && (
        <TutorToast text={ins.text} onPress={openDrawer} onTimeout={() => setToastFor(null)} />
      )}
    </View>
  );
}

/** drawer 하단 고정 메뉴: 대화 영역(ScrollView) 밖에 있어 스크롤해도 위치가 바뀌지 않는다. */
function DrawerFooter({ dock, onToggleDock }: { dock: DockKind | null; onToggleDock(kind: DockKind): void }) {
  const items: { label: string; onPress(): void; on?: boolean }[] = [
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

function TutorToast({ text, onPress, onTimeout }: { text: string; onPress(): void; onTimeout(): void }) {
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
      accessibilityLabel="튜터 메시지 열기"
      onPress={onPress}
      onPressIn={pause}
      onPressOut={run}
      style={styles.toast}>
      <Text style={styles.toastLabel}>튜터 메시지</Text>
      <Text style={styles.toastText}>{toastPreview(text)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: 'absolute',
    left: 0,
    width: 28,
    height: 112,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.agent,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleBar: { width: 4, height: 40, borderRadius: 2, backgroundColor: colors.agent },
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
  drawerHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  drawerTitle: { fontSize: 13, fontWeight: '700', color: colors.agentText },
  closeBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.agent, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 24, color: colors.text, lineHeight: 26 },
  muted: { fontSize: 14, color: colors.muted },
  scroll: { flex: 1 },
  footer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.agent },
  footerBtn: { flexGrow: 1, flexBasis: '45%', minHeight: 44, borderRadius: 22, borderWidth: 0, backgroundColor: '#E5E5E5', alignItems: 'center', justifyContent: 'center' },
  footerBtnOn: { backgroundColor: colors.agent },
  footerText: { fontSize: 14, color: colors.text },
  dock: {
    position: 'absolute',
    paddingTop: 8,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.agent,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 6, height: 0 },
    elevation: 11,
  },
  dockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
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
