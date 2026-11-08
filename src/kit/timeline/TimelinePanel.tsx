/**
 * 타임라인 패널 — 기존 `components/panels/timeline/tablet.tsx`의 학습 기록 카드 목록을 fetcher 주입형으로 재작성.
 * 보존: 카드 4종(기출 검색 selection · 문제 모음 collection · 주제 topic · 책갈피 bookmark)의 제목/부제/방문 횟수/최근 방문 시각,
 * '가자!!!' 버튼, 카드 사이 연주황 구분선, 페이지 단위 더 불러오기, 당겨서 새로고침.
 * 바뀐 점: '가자!!!'는 화면을 직접 열지 않고 onSelectTask로 알린다(에이전트가 화면 전환을 결정).
 * 아직 안 옮김: 일정 변경(달력·날짜 선택), 학습 노트 작성, 캘린더 앱 공유. 그 밖의 taskType(recommended 등)은 표시하지 않는다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import moment from 'moment';
import { colors, radius, space, type } from '../../ui/theme';
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
const CARD_TYPES = ['selection', 'collection', 'topic', 'bookmark'];

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
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color="orange" /> : null}
      renderItem={({ item }) => {
        const d = describeTask(item);
        const note = describeNote(item);
        return (
          <View style={styles.card}>
            <Text style={styles.title}>{d.title}</Text>
            <Text style={styles.subtitle} numberOfLines={4}>{d.subtitle}</Text>
            {d.lines.map((l) => (
              <Text key={l} style={styles.line}>{l}</Text>
            ))}
            {onOpenNote && (
              <Text style={[styles.note, { color: note ? colors.subtle : colors.muted }]} numberOfLines={1}>
                {note ?? '학습장을 남겨 보세요'}
              </Text>
            )}
            {item.lastVisitedAt != null && (
              <Text style={styles.date}>{`🕑 ${moment(item.lastVisitedAt * 1000).format('YYYY-MM-DD A h')}시`}</Text>
            )}
            <View style={styles.actions}>
              {onOpenNote && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${d.title} 학습장`}
                  onPress={() => onOpenNote(item)}
                  hitSlop={6}
                  style={styles.noteBtn}>
                  <Text style={styles.noteBtnText}>학습장</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${d.title} 학습하기`}
                onPress={() => onSelectTask(item)}
                hitSlop={6}
                style={({ pressed }) => [styles.go, pressed && { backgroundColor: '#D35400' }]}>
                <Text style={styles.goText}> 가자!!! </Text>
              </Pressable>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 16, paddingVertical: 8, gap: 6, backgroundColor: '#FFFFFF' },
  title: { fontSize: 18, fontWeight: '700', color: '#000000', textDecorationLine: 'underline' },
  subtitle: { fontSize: 14, fontWeight: '700', color: 'orange' },
  line: { fontSize: 14, color: '#18181B' },
  date: { fontSize: 12, color: '#18181B', textAlign: 'right' },
  // 크기는 GoButton small(높이 32)과 맞춘다. 누르는 영역은 hitSlop으로 44를 유지
  note: { ...type.body },
  actions: { flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: space.sm },
  noteBtn: {
    minHeight: 32,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    justifyContent: 'center',
  },
  noteBtnText: { ...type.bodyStrong, color: colors.subtle },
  go: { minHeight: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: '#FF8800', justifyContent: 'center' },
  goText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  // 기존 cardDivider
  divider: { height: 9, backgroundColor: '#FFE5CC', borderRadius: 4.5, marginVertical: 12, marginHorizontal: 16 },
  empty: { padding: 24, fontSize: 14, color: '#52525B' },
  footer: { padding: 12 },
});
