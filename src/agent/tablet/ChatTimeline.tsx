import { Ionicons } from '@expo/vector-icons';
import { useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { TimelineItem } from '../../protocol';
import { colors, radius, space, type } from '../../ui/theme';
import type { Instruction } from '../commandRouter';
import { InstructionCard } from '../InstructionCard';
import type { AgentSession, SessionSnapshot } from '../session';

// 채팅 dock 내용: 지난 에이전트·튜터 메시지와 서버 타임라인(검색·주제/과제 선택·일간/주간 학습 정리)을 시간순으로 섞고,
// 맨 아래에 지금 응답할 안내(InstructionCard)를 둔다. 새 항목이 오면 맨 아래로 스크롤한다.
type Entry = { key: string; ts: number; message?: Instruction; item?: TimelineItem };

const ICONS: Record<TimelineItem['kind'], keyof typeof Ionicons.glyphMap> = {
  search: 'search-outline',
  topic: 'book-outline',
  task: 'reload-outline',
  daily_summary: 'today-outline',
  weekly_summary: 'calendar-outline',
};
const SUMMARY_BADGE: Partial<Record<TimelineItem['kind'], string>> = { daily_summary: '일간 정리', weekly_summary: '주간 정리' };

/** 시각이 없는 옛 메시지는 맨 앞(들어온 순서 유지), 나머지는 시각순 */
export function chatEntries(history: Instruction[], timeline: TimelineItem[]): Entry[] {
  const entries: Entry[] = [
    ...history.map((m) => ({ key: `m-${m.messageId}`, ts: m.ts ? Date.parse(m.ts) : -Infinity, message: m })),
    ...timeline.map((t) => ({ key: `t-${t.id}`, ts: Date.parse(t.ts), item: t })),
  ];
  return entries.sort((a, b) => a.ts - b.ts);
}

export function timeLabel(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${hh}:${mm}`;
}

export function ChatTimeline({ state, session }: { state: SessionSnapshot; session: AgentSession }) {
  const ins = state.instruction;
  const scroll = useRef<ScrollView>(null);
  const entries = chatEntries(state.history, state.timeline);

  return (
    <ScrollView ref={scroll} contentContainerStyle={styles.list} onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}>
      {entries.map((e) => (e.item ? <TimelineCard key={e.key} item={e.item} session={session} /> : <Bubble key={e.key} message={e.message!} />))}
      {ins ? (
        <InstructionCard
          instruction={ins}
          paused={state.pausedDefault !== null}
          onChoice={(id) => session.selectChoice(ins.messageId, id)}
          onDismiss={() => session.dismissInstruction(ins.messageId)}
        />
      ) : (
        entries.length === 0 && <Text style={styles.muted}>지금은 안내가 없어요.</Text>
      )}
    </ScrollView>
  );
}

function Bubble({ message }: { message: Instruction }) {
  const tutor = message.source === 'tutor';
  return (
    <View style={[styles.bubble, tutor ? styles.bubbleTutor : styles.bubbleAgent]}>
      <Text style={styles.caption}>
        {tutor ? '튜터' : '에이전트'}
        {message.ts ? ` · ${timeLabel(message.ts)}` : ''}
      </Text>
      <Text style={styles.body}>{message.text}</Text>
    </View>
  );
}

function TimelineCard({ item, session }: { item: TimelineItem; session: AgentSession }) {
  const badge = SUMMARY_BADGE[item.kind];
  const content = (
    <>
      <View style={styles.cardHead}>
        <Ionicons name={ICONS[item.kind]} size={18} color={colors.accentText} />
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {badge && <Text style={styles.badge}>{badge}</Text>}
      </View>
      {!!item.body && <Text style={styles.body}>{item.body}</Text>}
      <View style={styles.cardFoot}>
        <Text style={styles.caption}>
          {timeLabel(item.ts)}
          {item.count != null ? ` · ${item.count}문항` : ''}
        </Text>
        {item.reopenable && (
          <View style={styles.reopen}>
            <Text style={styles.reopenText}>다시 보기</Text>
            <Ionicons name="chevron-forward" size={14} color={colors.accentText} />
          </View>
        )}
      </View>
    </>
  );
  if (!item.reopenable) return <View style={[styles.card, badge && styles.summary]}>{content}</View>;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title} 다시 보기`}
      onPress={() => session.emit('timeline_item_selected', { itemId: item.id })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: { gap: space.md, paddingHorizontal: space.lg, paddingBottom: space.lg },
  muted: { ...type.body, color: colors.muted },
  caption: { ...type.caption, color: colors.muted },
  body: { ...type.body, color: colors.text },
  bubble: { padding: space.md, borderRadius: radius.lg, gap: space.xxs },
  bubbleAgent: { backgroundColor: colors.accentSoft },
  bubbleTutor: { backgroundColor: colors.cardMuted },
  card: { padding: space.md, borderRadius: radius.lg, gap: space.xs, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line, backgroundColor: colors.card },
  // 일간·주간 정리는 서버가 만든 요약이라 바탕을 구분한다
  summary: { backgroundColor: colors.cardMuted, borderColor: colors.cardMuted },
  pressed: { backgroundColor: colors.cardMuted },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  cardTitle: { ...type.bodyStrong, color: colors.text, flex: 1 },
  badge: { ...type.caption, color: colors.accentText, backgroundColor: colors.accentSoft, paddingHorizontal: space.sm, paddingVertical: space.xxs, borderRadius: radius.pill, overflow: 'hidden' },
  cardFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  reopen: { flexDirection: 'row', alignItems: 'center', gap: space.xxs },
  reopenText: { ...type.caption, color: colors.accentText },
});
