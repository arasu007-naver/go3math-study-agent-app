/**
 * 주제 상세(문제 목록 + 가자) — 기존 `components/panels/topic/tablet.tsx`를 의존성 주입형으로 재작성.
 * 동작 보존: STUDY_TOPIC으로 문제 목록 표시, "가자"는 스크립트 있는 첫 문제(없으면 첫 문제)를 고른다(handleGoPress).
 * 바뀐 점: navigation.navigate(TopicNotebook|Notebook) 대신 onSelectUnit 콜백, AppCtx TOPIC dispatch 없음.
 * 제외: 책갈피 추가(ADD_BOOKMARK 쓰기 — M3는 읽기 전용, 화면 동등성 단계에서 추가).
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { UNITIMAGE } from '../../config/api.constants';
import DynamicDimensionsImage from '../ui/image-dynamic-dims';
import type { TopicDetail, TopicPanelFetchers, TopicUnit } from './types';

type Props = {
  fetchers: Pick<TopicPanelFetchers, 'fetchTopic'>;
  topicId: number;
  onSelectUnit(a: { unitIdx: number; unit: TopicUnit }): void;
};

/** 기존 handleGoPress: releaseScriptUrl이 있는 첫 문제, 없으면 0번 */
export function pickGoUnitIndex(units: TopicUnit[]): number {
  const idx = units.findIndex((u) => Array.isArray(u.scripts) && u.scripts.some((s) => s.releaseScriptUrl != null && s.releaseScriptUrl !== ''));
  return idx === -1 ? 0 : idx;
}

export function TopicUnitList({ fetchers, topicId, onSelectUnit }: Props) {
  const { width } = useWindowDimensions();
  const [topic, setTopic] = useState<TopicDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setTopic(null);
    setError(null);
    fetchers
      .fetchTopic(topicId)
      .then((t) => alive && setTopic(t))
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [fetchers, topicId]);

  if (error) return <Text style={styles.empty}>문제를 불러오지 못했어요. ({error})</Text>;
  if (!topic) return <ActivityIndicator style={styles.center} color="orange" />;

  const units = topic.units ?? [];
  const twoCol = width >= 600;
  const cardWidth = (twoCol ? Math.min(width, 1200) / 2 : Math.min(width, 600)) - 24;

  return (
    <View style={styles.root}>
      <Text style={styles.heading}>{topic.title}</Text>
      <ScrollView contentContainerStyle={styles.grid}>
        {units.length === 0 && <Text style={styles.empty}>문제가 없어요.</Text>}
        {units.map((unit, unitIdx) => (
          <Pressable
            key={`${unit.sourceType}-${unit.sourceId}-${unitIdx}`}
            accessibilityRole="button"
            accessibilityLabel={`${unitIdx + 1}번 문제`}
            onPress={() => onSelectUnit({ unitIdx, unit })}
            style={({ pressed }) => [styles.card, { width: cardWidth }, pressed && styles.pressed]}>
            <Text style={styles.cardLabel}>{unitIdx + 1}번</Text>
            <DynamicDimensionsImage source={{ uri: UNITIMAGE(unit.sourceType, unit.sourceId) }} width={cardWidth - 16} />
          </Pressable>
        ))}
      </ScrollView>
      {units.length > 0 && (
        <View style={styles.goBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              const unitIdx = pickGoUnitIndex(units);
              onSelectUnit({ unitIdx, unit: units[unitIdx] });
            }}
            style={({ pressed }) => [styles.go, pressed && styles.pressed]}>
            <Text style={styles.goText}>가자 !!!</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heading: { fontSize: 16, fontWeight: '700', color: '#18181B', padding: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 12, paddingBottom: 280 },
  card: { padding: 8, gap: 6, borderRadius: 8, borderWidth: 1, borderColor: '#D4D4D8', backgroundColor: '#FFFFFF' },
  cardLabel: { fontSize: 13, fontWeight: '500', color: '#52525B' },
  goBar: { position: 'absolute', right: 16, top: 8 },
  go: { minHeight: 38, paddingHorizontal: 18, borderRadius: 19, borderWidth: 2, borderColor: '#FFC256', backgroundColor: '#FFFFFF', justifyContent: 'center' },
  goText: { color: 'darkorange', fontSize: 16, fontWeight: '600' },
  empty: { padding: 24, fontSize: 14, color: '#52525B' },
  center: { padding: 32 },
  pressed: { opacity: 0.6 },
});
