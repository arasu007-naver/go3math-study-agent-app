/**
 * 개념 조회 패널 — 기존 `components/chat/ChatModal.tsx`(chat FAB 패널)의 과목 칩 + `ConceptsPanel.tsx`를 하나로 합친 컴포넌트.
 * 캔버스 개념·해답 시트의 '개념' 탭으로 쓴다. 위: 과목 칩, 그 아래 한 줄: 단원 칩. 단원을 누르면 그 단원의 개념 목록이 말풍선으로 뜨고,
 * 거기서 고른 개념은 '개념 목록' 영역에 X 칩으로 모인다(누르면 아래에 설명). 고른 개념은 부모가 들고 있어 시트를 닫아도 남는다.
 * 아직 안 옮김: 모의고사 일정·일정보기·오늘의 수업 버튼(이 앱에 해당 화면이 없음), 다른 화면에서 넘겨주는 과목/단원 자동 선택 키.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getChaptersOfSubject,
  getConceptsInChapter,
  getMathSubjectsByCurriculum,
  type HighSchoolMathSubject,
  type MathConcept,
  type MathSubjectChapter,
} from '@qoolla/script-parser';
import { MathChipLabel } from '../math/MathChipLabel';
import MathJaxWrapper, { cleanMathText } from '../math/MathJaxWrapper';

export interface ConceptFetchers {
  fetchSubjects(): Promise<HighSchoolMathSubject[]>;
  fetchChapters(subjectId: number): Promise<MathSubjectChapter[]>;
  fetchConcepts(chapterId: number): Promise<MathConcept[]>;
}

/** 공개 API(로그인 불필요)를 쓰는 기본 fetcher — 기존 ChatModal과 같은 호출 */
export const conceptFetchers: ConceptFetchers = {
  fetchSubjects: () => getMathSubjectsByCurriculum(),
  fetchChapters: (id) => getChaptersOfSubject(id),
  fetchConcepts: (id) => getConceptsInChapter(id),
};

const ACCENT = '#ea580c';

export function ConceptLookupPanel({
  picked,
  onPickedChange,
  fetchers = conceptFetchers,
}: {
  /** 고른 개념 — 부모가 들고 있어 패널이 다시 마운트되어도 남는다 */
  picked: MathConcept[];
  onPickedChange(next: MathConcept[]): void;
  fetchers?: ConceptFetchers;
}) {
  const [subjects, setSubjects] = useState<HighSchoolMathSubject[]>([]);
  const [subjectId, setSubjectId] = useState(0);
  const [chapters, setChapters] = useState<MathSubjectChapter[]>([]);
  const [chapterId, setChapterId] = useState(0);
  const [concepts, setConcepts] = useState<MathConcept[]>([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [conceptLoading, setConceptLoading] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [selected, setSelected] = useState<MathConcept | null>(null);

  // 과목 목록 로드 → 첫 과목 선택
  useEffect(() => {
    fetchers
      .fetchSubjects()
      .then((list) => {
        setSubjects(list);
        if (list.length > 0) setSubjectId(list[0].id);
      })
      .catch(() => {});
  }, [fetchers]);

  // 과목 변경 시 단원 로드. 단원은 눌러야 고른다
  useEffect(() => {
    if (subjectId <= 0) return;
    setChapterLoading(true);
    setChapters([]);
    setConcepts([]);
    setChapterId(0);
    setTooltipOpen(false);
    fetchers
      .fetchChapters(subjectId)
      .then(setChapters)
      .catch(() => setChapters([]))
      .finally(() => setChapterLoading(false));
  }, [fetchers, subjectId]);

  // 단원 변경 시 개념 목록 로드
  useEffect(() => {
    if (chapterId <= 0) return;
    setConceptLoading(true);
    setConcepts([]);
    fetchers
      .fetchConcepts(chapterId)
      .then((list) => setConcepts(Array.isArray(list) ? list : []))
      .catch(() => setConcepts([]))
      .finally(() => setConceptLoading(false));
  }, [fetchers, chapterId]);

  const pressChapter = (id: number) => {
    if (id === chapterId) return setTooltipOpen((open) => !open);
    setChapterId(id);
    setTooltipOpen(true);
  };

  const pick = (c: MathConcept) => {
    if (!picked.some((p) => p.id === c.id)) onPickedChange([...picked, c]);
    setSelected(c);
    setTooltipOpen(false);
  };

  const unpick = (c: MathConcept) => {
    onPickedChange(picked.filter((p) => p.id !== c.id));
    if (selected?.id === c.id) setSelected(null);
  };

  return (
    <View style={styles.root}>
      <View style={styles.subjectBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {subjects.map((s) => {
            const on = s.id === subjectId;
            return (
              <Pressable
                key={`subj-${s.id}`}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setSubjectId(s.id)}
                style={[styles.subjectChip, on ? styles.chipOn : styles.chipOff]}>
                <Text style={[styles.subjectChipText, on ? styles.textOn : styles.textAccent]}>{s.title}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 한 줄: 라벨 오른쪽에 가로로 넘기는 단원 칩 */}
      <View style={styles.chapterSection}>
        <Text style={styles.chapterLabel}>📚 단원 선택</Text>
        {chapterLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={ACCENT} />
            <Text style={styles.loadingText}>단원 목록 로딩 중...</Text>
          </View>
        ) : chapters.length > 0 ? (
          <ScrollView horizontal style={styles.flex} showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {chapters.map((ch) => {
              const on = ch.id === chapterId;
              return (
                <Pressable
                  key={`chap-${ch.id}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => pressChapter(ch.id)}
                  style={[styles.chapterChip, on ? styles.chipOn : styles.chipOff]}>
                  <Text style={[styles.chapterChipText, on ? styles.textOn : styles.textGray]}>{ch.chapterName}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>선택된 과목의 단원이 없습니다.</Text>
        )}
      </View>

      <View style={styles.divider} />

      <View style={styles.conceptSection}>
        <Text style={styles.sectionLabel}>💡 개념 목록 (터치하여 설명 보기)</Text>
        {picked.length > 0 ? (
          <ScrollView style={styles.conceptList} contentContainerStyle={styles.conceptContent}>
            <View style={styles.conceptGrid}>
              {picked.map((c) => {
                const title = cleanMathText(c.rawTitle ?? '');
                return (
                  <View key={`picked-${c.id}`} style={[styles.conceptChip, styles.pickedChip, selected?.id === c.id && styles.pickedChipOn]}>
                    <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => setSelected(c)} style={styles.pickedLabel}>
                      <MathChipLabel label={c.rawTitle ?? ''} color={ACCENT} />
                    </Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`${title} 빼기`} onPress={() => unpick(c)} hitSlop={8} style={styles.pickedRemove}>
                      <Ionicons name="close" size={14} color={ACCENT} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <Text style={styles.emptyText}>단원을 누르고 개념을 고르면 여기에 모입니다.</Text>
        )}
        {/* 개념 설명: 칩 목록 아래 남은 높이를 채운다 */}
        <View style={styles.detail}>
          {selected ? (
            <MathJaxWrapper
              iPath={selected.imgPath ?? ''}
              titleStatement={selected.rawTitle ?? ''}
              statement={selected.rawStatement ?? ''}
              fontSize={15}
              color="#1f2937"
              fullView={true}
            />
          ) : (
            <Text style={styles.emptyText}>개념을 누르면 여기에 설명이 나옵니다.</Text>
          )}
        </View>

        {/* 단원의 개념 목록 말풍선 — 꼬리가 위 구분선 가운데를 향한다. 바깥을 누르면 닫힌다 */}
        {tooltipOpen && (
          <>
            <Pressable accessibilityLabel="개념 목록 닫기" onPress={() => setTooltipOpen(false)} style={StyleSheet.absoluteFill} />
            <View testID="concept-tooltip" style={styles.tooltip}>
              <View style={styles.tooltipTail} />
              {conceptLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator size="small" color={ACCENT} />
                  <Text style={styles.loadingText}>개념 목록을 가져오는 중입니다...</Text>
                </View>
              ) : concepts.length > 0 ? (
                <ScrollView>
                  <View style={styles.conceptGrid}>
                    {concepts.map((c, i) => (
                      <Pressable
                        key={`concept-${c.id || i}`}
                        accessibilityRole="button"
                        accessibilityLabel={cleanMathText(c.rawTitle ?? '') || `개념 ${i + 1}`}
                        onPress={() => pick(c)}
                        style={[styles.conceptChip, styles.conceptChipOff]}>
                        <MathChipLabel label={c.rawTitle || `개념 ${i + 1}`} color={ACCENT} />
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              ) : (
                <Text style={styles.emptyText}>해당 단원에 등록된 개념이 없습니다.</Text>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// 기존 ChatModal·ConceptsPanel의 주황 계열 색과 칩 모양을 그대로 옮겼다
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#ffffff' },
  flex: { flex: 1 },
  subjectBar: { backgroundColor: '#fff7ed', borderBottomWidth: 1, borderBottomColor: '#fed7aa', paddingVertical: 10 },
  chipRow: { paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center' },
  subjectChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, marginRight: 8, borderWidth: 1.5 },
  subjectChipText: { fontSize: 13, fontWeight: '600' },
  chipOn: { backgroundColor: ACCENT, borderColor: ACCENT },
  chipOff: { backgroundColor: '#ffffff', borderColor: '#fed7aa' },
  textOn: { color: '#ffffff' },
  textAccent: { color: ACCENT },
  textGray: { color: '#4b5563' },
  chapterSection: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, backgroundColor: '#fff7ed' },
  chapterLabel: { fontSize: 12, fontWeight: '700', color: '#9a3412', paddingLeft: 12 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9a3412', marginBottom: 8, paddingHorizontal: 12 },
  chapterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginRight: 8, borderWidth: 1.2 },
  chapterChipText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#fed7aa', marginHorizontal: 12 },
  conceptSection: { flex: 1, paddingTop: 10 },
  conceptContent: { paddingHorizontal: 12, paddingBottom: 8 },
  conceptGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  conceptChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1.2,
    marginRight: 8,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conceptChipOff: { backgroundColor: '#ffffff', borderColor: ACCENT },
  // 고른 개념 칩: 라벨 + X. 보고 있는 칩은 바탕만 바꾼다(글자색을 바꾸면 수식 WebView를 다시 불러온다)
  pickedChip: { flexDirection: 'row', paddingRight: 8, backgroundColor: '#ffffff', borderColor: ACCENT },
  pickedChipOn: { backgroundColor: '#ffedd5' },
  pickedLabel: { justifyContent: 'center' },
  pickedRemove: { marginLeft: 6, justifyContent: 'center' },
  tooltip: {
    position: 'absolute',
    top: 8,
    left: 12,
    right: 12,
    maxHeight: '85%',
    padding: 12,
    paddingBottom: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    backgroundColor: '#ffffff',
    elevation: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  tooltipTail: {
    position: 'absolute',
    top: -7,
    alignSelf: 'center',
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    borderLeftWidth: 1,
    borderTopWidth: 1,
    borderColor: '#fed7aa',
    backgroundColor: '#ffffff',
  },
  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4 },
  loadingText: { fontSize: 12, color: '#6b7280', marginLeft: 8 },
  emptyText: { fontSize: 12, color: '#9ca3af', paddingHorizontal: 16, paddingVertical: 6 },
  conceptList: { flexGrow: 0, maxHeight: '40%' },
  detail: { flex: 1, borderTopWidth: 1, borderTopColor: '#fed7aa' },
});
