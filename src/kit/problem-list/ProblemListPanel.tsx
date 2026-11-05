/**
 * 문제 목록 — 기존 `TabletQuestionsViewerModal`(기출 검색 · 문제 모음 · 책갈피 문제 보기)을 모달 대신 Stage 위젯으로.
 * 카드 모양은 주제 문제 목록(TopicUnitList)과 같다: 'N번' + 문제 이미지, 넓으면 2열.
 * 데이터는 fetcher로 주입받고(어떤 출처의 문제인지는 source로 넘긴다), 고른 문제는 onSelectProblem으로 올린다.
 * 오른쪽 아래 연필 버튼(onSolve)은 마지막으로 고른 문제(없으면 1번)부터 풀이 화면을 연다.
 * renderFooter(선택)는 카드 이미지 아래 한 줄(폰 결과 화면의 해답·카메라 버튼).
 */
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import DynamicDimensionsImage from '../ui/image-dynamic-dims';
import { PencilFab } from '../ui/PencilFab';
import { colors } from '../../ui/theme';

/** 출처: 타임라인 학습 기록(task) 또는 기출 검색 조건(검색 dock · exam_search의 '가자') */
export type ProblemSource =
  | { kind: 'task'; taskId: number }
  | { kind: 'exam_query'; query: Record<string, unknown> };

export type Problem = { sourceType: string; sourceId: number; image: string };
export type ProblemSet = { title: string; subtitle?: string | null; problems: Problem[] };

export interface ProblemListFetchers {
  fetchProblems(source: ProblemSource): Promise<ProblemSet>;
}

export function ProblemListPanel({
  fetchers,
  source,
  onSelectProblem,
  onSolve,
  renderFooter,
}: {
  fetchers: ProblemListFetchers;
  source: ProblemSource;
  onSelectProblem(a: { index: number; problem: Problem }): void;
  onSolve?(a: { index: number; set: ProblemSet }): void;
  renderFooter?(a: { index: number; problem: Problem }): ReactNode;
}) {
  const { width } = useWindowDimensions();
  const [set, setSet] = useState<ProblemSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const key = JSON.stringify(source);

  useEffect(() => {
    let alive = true;
    setSet(null);
    setError(null);
    setSelected(null);
    fetchers
      .fetchProblems(JSON.parse(key))
      .then((s) => alive && setSet(s))
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [fetchers, key]);

  if (error) return <Text style={styles.empty}>문제를 불러오지 못했어요. ({error})</Text>;
  if (!set) return <ActivityIndicator style={styles.center} color="orange" />;

  const twoCol = width >= 600;
  const cardWidth = (twoCol ? Math.min(width, 1200) / 2 : Math.min(width, 600)) - 24;

  return (
    <View style={styles.root}>
      <View style={styles.head}>
        <Text style={styles.heading}>{set.title}</Text>
        {!!set.subtitle && <Text style={styles.subtitle}>{set.subtitle}</Text>}
      </View>
      <ScrollView contentContainerStyle={styles.grid}>
        {set.problems.length === 0 && <Text style={styles.empty}>문제가 없어요.</Text>}
        {set.problems.map((problem, index) => (
          <Pressable
            key={`${problem.sourceType}-${problem.sourceId}-${index}`}
            accessibilityRole="button"
            accessibilityLabel={`${index + 1}번 문제`}
            accessibilityState={{ selected: index === selected }}
            onPress={() => {
              setSelected(index);
              onSelectProblem({ index, problem });
            }}
            style={({ pressed }) => [styles.card, { width: cardWidth }, index === selected && styles.cardOn, pressed && styles.pressed]}>
            <Text style={styles.cardLabel}>{index + 1}번</Text>
            <DynamicDimensionsImage source={{ uri: problem.image }} width={cardWidth - 16} />
            {renderFooter?.({ index, problem })}
          </Pressable>
        ))}
      </ScrollView>
      {onSolve && set.problems.length > 0 && <PencilFab onPress={() => onSolve({ index: selected ?? 0, set })} />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { padding: 12, gap: 2 },
  heading: { fontSize: 16, fontWeight: '700', color: '#18181B' },
  subtitle: { fontSize: 14, fontWeight: '700', color: 'orange' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 12, paddingBottom: 280 },
  card: { padding: 8, gap: 6, borderRadius: 8, borderWidth: 1, borderColor: '#D4D4D8', backgroundColor: '#FFFFFF' },
  cardOn: { borderColor: colors.accent, borderWidth: 2 },
  cardLabel: { fontSize: 13, fontWeight: '500', color: '#52525B' },
  empty: { padding: 24, fontSize: 14, color: '#52525B' },
  center: { padding: 32 },
  pressed: { opacity: 0.6 },
});
