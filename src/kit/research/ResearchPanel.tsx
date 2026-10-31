/**
 * 검색 패널 — 기존 `pages/research/index.tsx`(+`tablet-home.tsx`)의
 * `<ResearchCategoriesSections />` + `contentsPanel()` 묶음을 하나로 합친 컴포넌트.
 * 위: 카테고리 칩(2026 / 모의 고사 / 주제·묶음), 아래: 선택한 카테고리의 세부 선택 패널.
 * AppCtx(currentStudyCategory) 대신 내부 상태 + 기존 키 `lastAgenda` 저장. 데이터·이동은 props/콜백으로 받는다.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ExamSearchPanel, type ExamSearchMode } from '../exam-search/ExamSearchPanel';
import type { ExamQuery } from '../exam-search/query';
import { TopicTabsPanel } from '../topic-panel/TopicTabsPanel';
import type { SubjectOption, TopicPanelFetchers, TopicSummary } from '../topic-panel/types';

export type ResearchCategory = 'recent' | 'pre' | 'mentor';

export const RESEARCH_CATEGORY_KEY = 'lastAgenda';

// 기존 ResearchCategoriesSections 칩 순서·라벨('단원별'은 원본에서도 주석 처리)
const CATEGORIES: { key: ResearchCategory; label: string }[] = [
  { key: 'recent', label: '2026' },
  { key: 'pre', label: '모의 고사' },
  { key: 'mentor', label: '주제/묶음' },
];

const EXAM_MODE: Record<'recent' | 'pre', ExamSearchMode> = { recent: 'this_year', pre: 'pre_exam' };

type Store = { getString(k: string): string | undefined; set(k: string, v: string): void };

type Props = {
  fetchers: TopicPanelFetchers;
  topicSubjects: SubjectOption[];
  store?: Store;
  /** 프리셋. 없으면 저장된 마지막 카테고리, 그것도 없으면 'recent' */
  initialCategory?: ResearchCategory;
  onSubmitSearch(query: ExamQuery, mode: ExamSearchMode): void;
  onSelectTopic(topic: TopicSummary): void;
};

export function resolveInitialCategory(preset: ResearchCategory | undefined, store?: Pick<Store, 'getString'>): ResearchCategory {
  if (preset) return preset;
  const stored = store?.getString(RESEARCH_CATEGORY_KEY);
  return CATEGORIES.some((c) => c.key === stored) ? (stored as ResearchCategory) : 'recent';
}

export function ResearchPanel({ fetchers, topicSubjects, store, initialCategory, onSubmitSearch, onSelectTopic }: Props) {
  const [category, setCategory] = useState<ResearchCategory>(() => resolveInitialCategory(initialCategory, store));

  const change = (next: ResearchCategory) => {
    if (next === category) return;
    store?.set(RESEARCH_CATEGORY_KEY, next);
    setCategory(next);
  };

  return (
    <View style={styles.root}>
      <View style={styles.chips}>
        {CATEGORIES.map((c) => {
          const on = c.key === category;
          return (
            <Pressable
              key={c.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => change(c.key)}
              style={[styles.chip, on && styles.chipOn]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.body}>
        {category === 'mentor' ? (
          <TopicTabsPanel fetchers={fetchers} subjects={topicSubjects} store={store} onSelectTopic={onSelectTopic} />
        ) : (
          <ExamSearchPanel
            key={category}
            mode={EXAM_MODE[category]}
            store={store}
            onSubmit={(q) => onSubmitSearch(q, EXAM_MODE[category])}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  // 기존: 높이 36, 가운데 정렬, gap 12, 선택 'orange' / 기본 '#E5E5E5'
  chips: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  chip: { minHeight: 36, minWidth: 64, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E5E5E5' },
  chipOn: { backgroundColor: 'orange' },
  chipText: { fontSize: 14, color: '#18181B' },
  chipTextOn: { fontWeight: '700' },
  body: { flex: 1 },
});
