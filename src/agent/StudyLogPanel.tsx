/**
 * Study Log 독(태블릿 dock 'chat', 폰 탭 'Study Log') 내용 — 위에 `이번 주 학습장 | 메시지` 전환, 아래에 고른 탭.
 * 탭 상태는 부르는 쪽(TabletAgentLayer, ChatTabScreen)이 든다 — 새 안내가 왔을 때 탭에 따라 알림이 달라지기 때문이다.
 * 설계: docs/superpowers/specs/2026-11-15-study-log-review-design.md §4.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { createStudyLogFetchers } from '../adapters/studyLogFetchers';
import { topicFetchers } from '../host/widgets';
import { StudyNoteReviewList } from '../kit/study-log/StudyNoteReviewList';
import { colors, radius, space, type } from '../ui/theme';
import type { Instruction } from './commandRouter';
import type { AgentSession, SessionSnapshot } from './session';
import { ChatTimeline } from './tablet/ChatTimeline';

export type StudyLogTab = 'notes' | 'messages';

const studyLogFetchers = createStudyLogFetchers();
const fetchTopicTitle = async (topicId: number) => (await topicFetchers.fetchTopic(topicId)).title;

/** 학생이 답해야 할 안내 — 응답이 필요하거나 고를 선택지가 있다 */
export function awaitsAnswer(ins: Instruction | null | undefined): boolean {
  return !!ins && (ins.requiresResponse || ins.choices.length > 0);
}

/** 독을 열 때의 탭: 답해야 할 안내나 읽지 않은 메시지가 있으면 메시지, 아니면 이번 주 학습장 */
export function initialTab(ins: Instruction | null | undefined, unread: boolean): StudyLogTab {
  return awaitsAnswer(ins) || unread ? 'messages' : 'notes';
}

const TABS: { key: StudyLogTab; label: string }[] = [
  { key: 'notes', label: '이번 주 학습장' },
  { key: 'messages', label: '메시지' },
];

export function StudyLogPanel({
  tab,
  onTab,
  messagesUnread,
  state,
  session,
  refreshKey,
}: {
  tab: StudyLogTab;
  onTab(tab: StudyLogTab): void;
  messagesUnread: boolean;
  state: SessionSnapshot;
  session: AgentSession;
  refreshKey: number;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.tabs} accessibilityRole="tablist">
        {TABS.map((t) => {
          const selected = tab === t.key;
          const dot = t.key === 'messages' && messagesUnread && !selected;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityLabel={dot ? `${t.label} (읽지 않은 메시지 있음)` : t.label}
              accessibilityState={{ selected }}
              onPress={() => onTab(t.key)}
              style={[styles.tab, selected && styles.tabSelected]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>{t.label}</Text>
              {dot ? <View style={styles.dot} /> : null}
            </Pressable>
          );
        })}
      </View>
      <View style={styles.body}>
        {tab === 'notes' ? (
          <StudyNoteReviewList fetchers={studyLogFetchers} refreshKey={refreshKey} fetchTopicTitle={fetchTopicTitle} />
        ) : (
          <ChatTimeline state={state} session={session} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabs: {
    flexDirection: 'row',
    margin: space.md,
    padding: space.xxs,
    gap: space.xxs,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    borderRadius: radius.sm,
  },
  tabSelected: { backgroundColor: colors.card },
  tabText: { ...type.body, color: colors.muted },
  tabTextSelected: { ...type.bodyStrong, color: colors.text },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.unread },
  body: { flex: 1 },
});
