/**
 * 검색 패널 — 기존 `pages/research/index.tsx`(+`tablet-home.tsx`)의
 * `<ResearchCategoriesSections />` + `contentsPanel()` 묶음을 하나로 합친 컴포넌트.
 * 위: 카테고리 칩(2026 / 모의 고사 / 주제·묶음), 아래: 선택한 카테고리의 세부 선택 패널.
 * AppCtx(currentStudyCategory) 대신 내부 상태 + 기존 키 `lastAgenda` 저장. 데이터·이동은 props/콜백으로 받는다.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '../../ui/Chip';
import { colors, space } from '../../ui/theme';
import { ExamSearchPanel, type ExamSearchMode } from '../exam-search/ExamSearchPanel';
import type { ExamQuery } from '../exam-search/query';
import { TopicTabsPanel } from '../topic-panel/TopicTabsPanel';
import type { SubjectOption, TopicPanelFetchers, TopicSummary } from '../topic-panel/types';

export type ResearchCategory = 'recent' | 'pre' | 'mentor';

export const RESEARCH_CATEGORY_KEY = 'lastAgenda';

// 기존 ResearchCategoriesSections 칩 순서·라벨('단원별'은 원본에서도 주석 처리).
// 단계 4b D2: '개념' 탭은 없앴다. 개념 검색은 풀이 화면(캔버스 개념 시트)에서만 쓴다.
const CATEGORIES: { key: ResearchCategory; label: string }[] = [
  { key: 'recent', label: '2026' },
  { key: 'pre', label: '모의 고사' },
  { key: 'mentor', label: '주제/묶음' },
];

const isCategory = (v: unknown): v is ResearchCategory => CATEGORIES.some((c) => c.key === v);

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

/** 프리셋 → 저장값 → 'recent'. 탭 목록에 없는 값(예전 'concept')은 건너뛴다(단계 4b D3). 저장값은 지우지 않는다 */
export function resolveInitialCategory(preset: string | undefined, store?: Pick<Store, 'getString'>): ResearchCategory {
  if (isCategory(preset)) return preset;
  const stored = store?.getString(RESEARCH_CATEGORY_KEY);
  return isCategory(stored) ? stored : 'recent';
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
        {CATEGORIES.map((c) => (
          <Chip key={c.key} label={c.label} accessibilityRole="tab" selected={c.key === category} onPress={() => change(c.key)} />
        ))}
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
  root: { flex: 1, backgroundColor: colors.card },
  // 가운데 정렬 탭 칩(공용 Chip, role=tab)
  chips: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.md },
  body: { flex: 1 },
});
