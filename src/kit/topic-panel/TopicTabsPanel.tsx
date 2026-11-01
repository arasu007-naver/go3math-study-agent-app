/**
 * 주제 탭 패널 — 기존 `components/panels/research/tablet-mentor-topics.tsx`(+폰 `mentor-topics.tsx`)를
 * 의존성 주입형으로 재작성. AppCtx / useNavigation / Apollo 훅 / MMKV 싱글톤 없음.
 * 동작 보존: 과목 칩 → 1페이지 + 총 페이지 수 재조회, 12개 단위 무한 스크롤, 개념(MATH_CONCEPT) 주제는 이미지 카드,
 * 마지막 과목을 `current-topic-subject` 키에 저장(기존 키 그대로).
 * 바뀐 점: 주제 선택 시 CHECK_TASK 조회 후 내비게이션하던 것을 onSelectTopic 콜백으로 올린다(과제 연결은 에이전트 서버 몫).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import DynamicDimensionsImage from '../ui/image-dynamic-dims';
import { SkeletonCards } from '../ui/SkeletonCards';
import type { SubjectOption, TopicPanelFetchers, TopicSummary } from './types';
import { colors } from '../../ui/theme';

export const TOPIC_PAGE_SIZE = 12;
export const SUBJECT_STORAGE_KEY = 'current-topic-subject';

type Props = {
  fetchers: TopicPanelFetchers;
  subjects: SubjectOption[];
  /** 에이전트 프리셋. 없으면 저장된 마지막 과목, 그것도 없으면 첫 과목 */
  initialSubject?: string;
  store?: { getString(k: string): string | undefined; set(k: string, v: string): void };
  pageSize?: number;
  onSelectTopic(topic: TopicSummary): void;
};

export function TopicTabsPanel({ fetchers, subjects, initialSubject, store, pageSize = TOPIC_PAGE_SIZE, onSelectTopic }: Props) {
  const { width } = useWindowDimensions();
  const [subject, setSubject] = useState(() => resolveInitialSubject(subjects, initialSubject, store));
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    if (initialSubject && subjects.some((s) => s.value === initialSubject)) setSubject(initialSubject);
  }, [initialSubject, subjects]);

  // 과목 변경: 목록 초기화 후 1페이지 + 총 페이지 수
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    setTopics([]);
    setPage(1);
    Promise.all([
      fetchers.fetchSubjectTopics({ subject, page: 1, pageSize }),
      fetchers.fetchTotalPageCount({ subject, pageSize }),
    ])
      .then(([list, total]) => {
        if (id !== requestId.current) return;
        setTopics(list);
        setTotalPages(total);
      })
      .catch((e) => id === requestId.current && setError(String(e?.message ?? e)))
      .finally(() => id === requestId.current && setLoading(false));
  }, [fetchers, subject, pageSize]);

  const onEndReached = useCallback(() => {
    if (loading || loadingMore || page >= totalPages) return;
    const next = page + 1;
    const id = requestId.current;
    setLoadingMore(true);
    fetchers
      .fetchSubjectTopics({ subject, page: next, pageSize })
      .then((list) => {
        if (id !== requestId.current) return;
        setTopics((prev) => [...prev, ...list]);
        setPage(next);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [fetchers, subject, page, totalPages, pageSize, loading, loadingMore]);

  const changeSubject = (value: string) => {
    if (value === subject) return;
    const s = subjects.find((x) => x.value === value);
    if (s) store?.set(SUBJECT_STORAGE_KEY, JSON.stringify(s));
    setSubject(value);
  };

  const renderItem = ({ item }: { item: TopicSummary }) => {
    const select = () => onSelectTopic(item);
    if (item.orgType === 'MATH_CONCEPT' && item.description) {
      return (
        <Pressable accessibilityRole="button" accessibilityLabel={`개념 ${item.title}`} onPress={select} style={styles.conceptCard}>
          <Text style={styles.conceptLabel}>개념</Text>
          <DynamicDimensionsImage source={{ uri: item.description }} width={Math.min(width, 900) - 64} />
        </Pressable>
      );
    }
    return (
      <Pressable accessibilityRole="button" onPress={select} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
        {item.founder?.imageUrl ? <Image source={{ uri: item.founder.imageUrl }} style={styles.avatar} /> : <View style={styles.avatar} />}
        <View style={styles.rowText}>
          <Text style={styles.title}>
            {item.title} - {item.unitCount ?? 0} 문제
          </Text>
          {!!item.description && <Text style={styles.desc}>{item.description}</Text>}
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.root}>
      <View style={styles.chips}>
        {subjects.map((s) => {
          const on = s.value === subject;
          return (
            <Pressable
              key={s.value}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => changeSubject(s.value)}
              style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{s.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {loading ? (
        <SkeletonCards count={6} lines={1} avatar divider={false} />
      ) : error ? (
        <Text style={styles.empty}>주제를 불러오지 못했어요. ({error})</Text>
      ) : (
        <FlatList
          data={topics}
          keyExtractor={(item, i) => (item.id != null ? String(item.id) : `idx-${i}`)}
          renderItem={renderItem}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.4}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          ListEmptyComponent={<Text style={styles.empty}>진행 중인 강의가 없습니다.</Text>}
          ListFooterComponent={
            topics.length > 0 ? (
              <View style={styles.footer}>
                {loadingMore ? <ActivityIndicator color="orange" /> : <Text style={styles.desc}>{`${page} / ${totalPages}`}</Text>}
              </View>
            ) : null
          }
          contentContainerStyle={{ paddingBottom: 280 }}
        />
      )}
    </View>
  );
}

export function resolveInitialSubject(
  subjects: SubjectOption[],
  preset: string | undefined,
  store?: { getString(k: string): string | undefined },
): string {
  if (preset && subjects.some((s) => s.value === preset)) return preset;
  try {
    const stored = store?.getString(SUBJECT_STORAGE_KEY);
    const value = stored ? (JSON.parse(stored) as SubjectOption).value : undefined;
    if (value && subjects.some((s) => s.value === value)) return value;
  } catch {}
  return subjects[0].value;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12, backgroundColor: '#FFFFFF' },
  chip: { minHeight: 36, paddingHorizontal: 14, justifyContent: 'center', borderRadius: 18, borderWidth: 1, borderColor: colors.lineStrong, backgroundColor: '#FFFFFF' },
  chipOn: { backgroundColor: 'orange' },
  chipText: { fontSize: 14, color: '#18181B' },
  chipTextOn: { fontWeight: '700' },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFFFF' },
  rowText: { flex: 1, gap: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#E4E4E7' },
  title: { fontSize: 15, fontWeight: '500', color: '#18181B' },
  desc: { fontSize: 13, color: '#52525B' },
  chevron: { fontSize: 24, color: '#52525B' },
  conceptCard: { padding: 16, gap: 8, backgroundColor: '#FFFFFF' },
  conceptLabel: { fontSize: 18, fontWeight: '700', color: 'orange', textDecorationLine: 'underline' },
  sep: { height: 1, backgroundColor: '#D4D4D8' },
  footer: { height: 44, alignItems: 'center', justifyContent: 'center' },
  empty: { padding: 24, fontSize: 14, color: '#52525B' },
  pressed: { opacity: 0.6 },
});
