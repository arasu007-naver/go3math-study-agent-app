/**
 * 타임라인 패널 — 기존 `components/panels/timeline/tablet.tsx`의 학습 기록 카드 목록을 fetcher 주입형으로 재작성.
 * 보존: 카드 4종(기출 검색 selection · 문제 모음 collection · 주제 topic · 책갈피 bookmark)의 제목/부제/방문 횟수/최근 방문 시각,
 * '가자!!!' 버튼, 카드 사이 연주황 구분선, 페이지 단위 더 불러오기, 당겨서 새로고침.
 * 바뀐 점: '가자!!!'는 화면을 직접 열지 않고 onSelectTask로 알린다(에이전트가 화면 전환을 결정).
 * 아직 안 옮김: 일정 변경(달력·날짜 선택), 학습 노트 작성, 캘린더 앱 공유. 그 밖의 taskType(recommended 등)은 표시하지 않는다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { Button } from '../../ui/Button';
import { colors, space, type } from '../../ui/theme';
import { ACHIEVEMENTS } from '../study-note/model';
import { SkeletonCards } from '../ui/SkeletonCards';

export type TimelineTask = {
  id: number | string;
  taskType: string;
  task?: string | null; // selection·bookmark: JSON 문자열
  visitCnt?: number | null;
  lastVisitedAt?: number | null; // 초 단위
  collectionId?: number | string | null;
  title?: string | null;
  description?: string | null;
  topicTitle?: string | null;
  topicDescription?: string | null;
  note?: {
    description?: string | null;
    achievementRate?: number | null;
    noteType?: string | null;
    tutorDescription?: string | null;
  } | null;
};

export interface TimelineFetchers {
  /** page는 0부터(기존 그대로). 로그인이 필요하면 throw */
  fetchTasks(a: { page: number; pageSize: number }): Promise<TimelineTask[]>;
}

export const TASKS_PAGE_SIZE = 36; // 기존 TASKS_PAGE_SIZE
const CARD_TYPES = ['selection', 'collection', 'topic', 'topic-live', 'hotline', 'bookmark'];

const MAJORS: Record<string, string> = {
  A: '문과', '0': '문과', B: '이과', '1': '이과', CALCULUS: '미적분', STATISTICS: '확률과 통계', GEOMETRY: '기하학',
};

function parseTask(raw?: string | null): Record<string, any> {
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 기존 카드별 제목·부제·본문 줄 */
export function describeTask(t: TimelineTask): { title: string; subtitle: string; lines: string[] } {
  const visits = `  #${t.visitCnt ?? 0}번`;
  switch (t.taskType) {
    case 'selection': {
      const q = parseTask(t.task);
      const years: unknown[] = q.years ?? [];
      const months: unknown[] = q.months ?? [];
      const numbers: unknown[] = q.numbers ?? [];
      return {
        title: '📝 기출 검색',
        subtitle: `${MAJORS[String(q.major)] ?? 'Unknown'} / ${years.join('년, ')}년${visits}`,
        lines: [`📆 ${months.length ? `${months.join('월, ')}월` : ''}`, `🔢 번호: ${numbers.join(', ')}`],
      };
    }
    case 'collection':
      return { title: `📝 ${t.title ?? ''}`, subtitle: `${t.description ?? ''}${visits}`, lines: [] };
    case 'topic':
      return { title: `📝 ${t.topicTitle ?? ''}`, subtitle: `${t.topicDescription ?? ''}${visits}`, lines: [] };
    // 실황 수업 기록: collectionId는 lesson_note.id다(주제 id가 아니다) — 서버가 collectionId로 붙여 주는 topicTitle은 쓰지 않는다
    case 'topic-live':
      return { title: '📝 주제 실황 수업', subtitle: visits.trim(), lines: [] };
    case 'hotline':
      return { title: '📝 선생님 실황 수업', subtitle: visits.trim(), lines: [] };
    default: {
      const b = parseTask(t.task);
      const count = `${(b.units ?? []).length}문항${visits}`;
      return {
        title: '📝  책갈피',
        subtitle: b.tutor ? `🥸 ${b.tutor.name} 님의 북마크 수업 / ${count}` : `📆  ${b.regDate ?? ''} / ${count}`,
        lines: [],
      };
    }
  }
}

type LineIcon = 'document-text-outline' | 'calendar-outline' | 'list-outline' | 'time-outline';
const LEADING_ICONS: [string, LineIcon][] = [
  ['📝', 'document-text-outline'],
  ['📆', 'calendar-outline'],
  ['🗓', 'calendar-outline'],
  ['🔢', 'list-outline'],
  ['🕑', 'time-outline'],
];

/** 카드 줄 맨 앞 이모지를 Ionicons 이름과 나머지 글자로 나눈다(단계 4b §5.1). 모르는 이모지는 글자 그대로 */
export function splitLeadingIcon(text: string): { icon?: LineIcon; text: string } {
  for (const [emoji, icon] of LEADING_ICONS) {
    if (text.startsWith(emoji)) return { icon, text: text.slice(emoji.length).replace(/^️?\s*/, '') };
  }
  return { text };
}

/** 아이콘(있으면) + 글자 한 줄 */
function IconLine({ text, style, numberOfLines }: { text: string; style: TextStyle; numberOfLines?: number }) {
  const s = splitLeadingIcon(text);
  return (
    <View style={styles.iconLine}>
      {s.icon && <Ionicons name={s.icon} size={16} color={colors.muted} />}
      <Text style={[style, styles.iconLineText]} numberOfLines={numberOfLines}>
        {s.text}
      </Text>
    </View>
  );
}

/** 카드 학습장 요약 `✏️ 내용 · 달성률 라벨`. 내용이 없으면 null */
export function describeNote(t: TimelineTask): string | null {
  const n = t.note;
  const text = n?.tutorDescription || n?.description;
  if (!text) return null;
  const label = ACHIEVEMENTS.find((a) => a.value === n?.achievementRate)?.label;
  return label ? `✏️ ${text} · ${label}` : `✏️ ${text}`;
}

/** 튜터가 쓴 노트면 live, 아니면 self */
export function noteModeOf(t: TimelineTask): 'self' | 'live' {
  return t.note?.noteType === 'tutor' || t.note?.tutorDescription ? 'live' : 'self';
}

/** 카드의 학습장 버튼이 여는 study_note 시트 props. 주제 카드는 주제 제목을 추천 문구로 넘긴다 */
export function noteSheetProps(t: TimelineTask): { taskId: number; mode: 'self' | 'live'; title: string; topicHints?: string[] } {
  return {
    taskId: Number(t.id),
    mode: noteModeOf(t),
    title: describeTask(t).title.replace(/^📝\s*/, ''),
    ...(t.taskType === 'topic' && t.topicTitle ? { topicHints: [t.topicTitle] } : {}),
  };
}

export function TimelinePanel({
  fetchers,
  onSelectTask,
  onOpenNote,
  pageSize = TASKS_PAGE_SIZE,
}: {
  fetchers: TimelineFetchers;
  onSelectTask(task: TimelineTask): void;
  /** 주면 카드에 학습장 요약 줄과 버튼을 보인다 */
  onOpenNote?(task: TimelineTask): void;
  pageSize?: number;
}) {
  const [tasks, setTasks] = useState<TimelineTask[] | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (nextPage: number) => {
      const id = ++requestId.current;
      try {
        const got = await fetchers.fetchTasks({ page: nextPage, pageSize });
        if (id !== requestId.current) return;
        setError(null);
        setHasMore(got.length >= pageSize);
        setPage(nextPage);
        setTasks((prev) => (nextPage === 0 || !prev ? got : [...prev, ...got]));
      } catch (e) {
        if (id === requestId.current) setError(String((e as Error)?.message ?? e));
      } finally {
        if (id === requestId.current) {
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [fetchers, pageSize],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  if (error && !tasks) return <Text style={styles.empty}>학습 기록을 불러오지 못했어요. ({error})</Text>;
  if (!tasks) return <SkeletonCards button />;

  return (
    <FlatList
      data={tasks.filter((t) => CARD_TYPES.includes(t.taskType))}
      keyExtractor={(item) => `task-${item.id}`}
      refreshing={refreshing}
      onRefresh={() => {
        setRefreshing(true);
        void load(0);
      }}
      onEndReached={() => {
        if (!hasMore || loadingMore) return;
        setLoadingMore(true);
        void load(page + 1);
      }}
      onEndReachedThreshold={0.5}
      ItemSeparatorComponent={() => <View style={styles.divider} />}
      ListEmptyComponent={<Text style={styles.empty}>기출 검색이나 주제별 문제 모음 등을 조회한 기록이 없습니다.</Text>}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.accent} /> : null}
      renderItem={({ item }) => {
        const d = describeTask(item);
        const title = splitLeadingIcon(d.title).text;
        const note = describeNote(item);
        return (
          <View style={styles.card}>
            <IconLine text={d.title} style={styles.title} />
            <IconLine text={d.subtitle} style={styles.subtitle} numberOfLines={4} />
            {d.lines.map((l) => (
              <IconLine key={l} text={l} style={splitLeadingIcon(l).icon === 'list-outline' ? styles.numbers : styles.line} />
            ))}
            {onOpenNote && (
              <Text style={[styles.note, { color: note ? colors.subtle : colors.muted }]} numberOfLines={1}>
                {note ?? '학습장을 남겨 보세요'}
              </Text>
            )}
            {item.lastVisitedAt != null && (
              <View style={[styles.iconLine, styles.dateRow]}>
                <Ionicons name="time-outline" size={14} color={colors.muted} />
                <Text style={styles.date}>{`${moment(item.lastVisitedAt * 1000).format('YYYY-MM-DD A h')}시`}</Text>
              </View>
            )}
            <View style={styles.actions}>
              {onOpenNote && (
                <Button variant="secondary" size="sm" title="학습장" accessibilityLabel={`${title} 학습장`} onPress={() => onOpenNote(item)} />
              )}
              <Button variant="primary" size="sm" title="가자!!!" accessibilityLabel={`${title} 학습하기`} onPress={() => onSelectTask(item)} />
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: space.lg, paddingVertical: space.sm, gap: 6, backgroundColor: colors.card },
  // 단계 4b D1: 모양만 바꾼다(보이는 정보는 그대로). 이모지 → Ionicons, 글자·색 토큰
  iconLine: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  iconLineText: { flexShrink: 1 },
  title: { ...type.title, color: colors.text },
  subtitle: { ...type.bodyStrong, color: colors.accentText },
  line: { ...type.body, color: colors.subtle },
  numbers: { ...type.caption, color: colors.muted },
  // 날짜는 지금 자리(버튼 위 오른쪽)에 둔다
  dateRow: { alignSelf: 'flex-end' },
  date: { ...type.caption, color: colors.muted },
  note: { ...type.body },
  actions: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: space.sm },
  divider: { height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.line, marginVertical: space.md, marginHorizontal: space.lg },
  empty: { padding: 24, ...type.body, color: colors.subtle },
  footer: { padding: 12 },
});
