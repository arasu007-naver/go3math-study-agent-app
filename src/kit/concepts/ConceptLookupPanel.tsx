/**
 * 개념 조회 패널 — 기존 `components/chat/ChatModal.tsx`(chat FAB 패널)의 과목 칩 + `ConceptsPanel.tsx`를 하나로 합친 컴포넌트.
 * 캔버스 개념·해답 시트의 '개념' 탭으로 쓴다. 위: 과목 칩, 그 아래 단원 칩, 개념 칩(누르면 칩 아래에 개념 설명). 제목·닫기는 시트가 맡으므로 주황 헤더는 뺐다.
 * 아직 안 옮김: 모의고사 일정·일정보기·오늘의 수업 버튼(이 앱에 해당 화면이 없음), 다른 화면에서 넘겨주는 과목/단원 자동 선택 키.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  getChaptersOfSubject,
  getConceptsInChapter,
  getMathSubjectsByCurriculum,
  type HighSchoolMathSubject,
  type MathConcept,
  type MathSubjectChapter,
} from '@qoolla/script-parser';
import MathJaxWrapper from '../math/MathJaxWrapper';

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

export function ConceptLookupPanel({ fetchers = conceptFetchers }: { fetchers?: ConceptFetchers }) {
  const [subjects, setSubjects] = useState<HighSchoolMathSubject[]>([]);
  const [subjectId, setSubjectId] = useState(0);
  const [chapters, setChapters] = useState<MathSubjectChapter[]>([]);
  const [chapterId, setChapterId] = useState(0);
  const [concepts, setConcepts] = useState<MathConcept[]>([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [conceptLoading, setConceptLoading] = useState(false);
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

  // 과목 변경 시 단원 로드 → 첫 단원 선택
  useEffect(() => {
    if (subjectId <= 0) return;
    setChapterLoading(true);
    setChapters([]);
    setConcepts([]);
    setChapterId(0);
    setSelected(null); // 단원이 없는 과목이면 단원 effect가 돌지 않는다
    fetchers
      .fetchChapters(subjectId)
      .then((list) => {
        setChapters(list);
        if (list.length > 0) setChapterId(list[0].id);
      })
      .catch(() => setChapters([]))
      .finally(() => setChapterLoading(false));
  }, [fetchers, subjectId]);

  // 단원 변경 시 개념 목록 로드
  useEffect(() => {
    if (chapterId <= 0) return;
    setConceptLoading(true);
    setConcepts([]);
    setSelected(null); // 다른 단원의 설명이 남지 않게
    fetchers
      .fetchConcepts(chapterId)
      .then((list) => setConcepts(Array.isArray(list) ? list : []))
      .catch(() => setConcepts([]))
      .finally(() => setConceptLoading(false));
  }, [fetchers, chapterId]);

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

      <View style={styles.chapterSection}>
        <Text style={styles.sectionLabel}>📚 단원 선택</Text>
        {chapterLoading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#ea580c" />
            <Text style={styles.loadingText}>단원 목록 로딩 중...</Text>
          </View>
        ) : chapters.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
            {chapters.map((ch) => {
              const on = ch.id === chapterId;
              return (
                <Pressable
                  key={`chap-${ch.id}`}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  onPress={() => setChapterId(ch.id)}
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
        {conceptLoading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator size="large" color="#ea580c" />
            <Text style={styles.loadingText}>개념 목록을 가져오는 중입니다...</Text>
          </View>
        ) : concepts.length > 0 ? (
          <ScrollView style={styles.conceptList} contentContainerStyle={styles.conceptContent}>
            <View style={styles.conceptGrid}>
              {concepts.map((c, i) => {
                const on = selected?.id === c.id;
                return (
                  <Pressable
                    key={`concept-${c.id || i}`}
                    accessibilityRole="button"
                    onPress={() => setSelected(c)}
                    style={[styles.conceptChip, on ? styles.chipOn : styles.conceptChipOff]}>
                    {/* 수식을 MathJax(WebView)로 그린다. WebView가 터치를 가져가지 않게 막아 칩이 눌리게 한다 */}
                    <View pointerEvents="none">
                      <MathJaxWrapper
                        iPath={c.imgPath ?? ''}
                        statement={c.rawTitle || `개념 ${i + 1}`}
                        fontSize={13}
                        color={on ? '#ffffff' : '#ea580c'}
                        backgroundColor={on ? '#ea580c' : '#ffffff'}
                        fullView={true}
                        autoSize={true}
                        maxWidth={320}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.centerLoading}>
            <Text style={styles.emptyText}>
              {chapterId > 0 ? '해당 단원에 등록된 개념이 없습니다.' : '단원을 선택하면 개념 목록이 표시됩니다.'}
            </Text>
          </View>
        )}
        {/* 개념 설명: 모달 대신 칩 목록 아래 남은 높이를 채운다 */}
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
  chipOn: { backgroundColor: '#ea580c', borderColor: '#ea580c' },
  chipOff: { backgroundColor: '#ffffff', borderColor: '#fed7aa' },
  textOn: { color: '#ffffff' },
  textAccent: { color: '#ea580c' },
  textGray: { color: '#4b5563' },
  chapterSection: { paddingVertical: 10, backgroundColor: '#fff7ed' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: '#9a3412', marginBottom: 8, paddingHorizontal: 12 },
  chapterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginRight: 8, borderWidth: 1.2 },
  chapterChipText: { fontSize: 12, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#fed7aa', marginHorizontal: 12 },
  conceptSection: { flex: 1, paddingTop: 10 },
  conceptContent: { paddingHorizontal: 12, paddingBottom: 24 },
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
  conceptChipOff: { backgroundColor: '#ffffff', borderColor: '#ea580c' },
  loadingRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 4 },
  centerLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 32 },
  loadingText: { fontSize: 12, color: '#6b7280', marginLeft: 8 },
  emptyText: { fontSize: 12, color: '#9ca3af', paddingHorizontal: 16, paddingVertical: 6 },
  conceptList: { flexGrow: 0, maxHeight: '40%' },
  detail: { flex: 1, borderTopWidth: 1, borderTopColor: '#fed7aa' },
});
