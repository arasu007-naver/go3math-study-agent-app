/**
 * 공개 문제 목록(미인증) — 기존 `pages/welcome/public-questions-view.tsx`(PublicQuestionsViewScreen)를 옮김.
 * 출처 두 가지(쿼리 문자열):
 * - 기출 검색 '가자': 계열·연도·시행월·번호. 공개 API는 (계열, 연도, 월) 하나씩만 받으므로(getMontlyMathPreExams)
 *   연도×월마다 불러와 합치고, 고른 번호(qorder)만 남긴다.
 * - 과목별 토픽 선택: topicId·title. GET_UNITS_IN_TOPIC(비로그인 공개)의 units → UNITIMAGE.
 * 각 문제의 '해답'은 public-solution(PublicSolutionViewScreen)으로 해답 페이지를 연다.
 */
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GET_UNITS_IN_TOPIC } from '@/src/api/graphql/queries';
import { getMontlyMathPreExams } from '@/src/api/rest';
import { UNITIMAGE } from '@/src/config/api.constants';
import { PRE_EXAMS_ASSETS } from '@/src/config/exam.constants';
import GoButton from '@/src/kit/ui/go-button';
import DynamicDimensionsImage from '@/src/kit/ui/image-dynamic-dims';
import Go3MathLoader from '@/src/kit/ui/loading-view';
import { apolloClient } from '@/src/state/bootstrap';
import { colors, type } from '@/src/ui/theme';

type PublicUnit = { id: number; qPath: string; year: number; month: number; qorder: number };
type Question = { key: string; caption: string; image: string; sourceType: string; sourceId: number };
type Params = { subject: string; years: string; months: string; numbers: string; topicId: string; title: string };

const toNumbers = (s?: string) => (s ? s.split(',').map(Number) : []);

async function fetchExamQuestions(p: Params): Promise<Question[]> {
  const years = toNumbers(p.years);
  const months = toNumbers(p.months);
  const numbers = toNumbers(p.numbers);
  const results = await Promise.all(years.flatMap((y) => months.map((m) => getMontlyMathPreExams(p.subject, y, m))));
  const all: PublicUnit[] = results.flatMap((r) => r.data?.data?.result?.units ?? []);
  const picked = all.filter((u) => numbers.length === 0 || numbers.includes(u.qorder));
  picked.sort((a, b) => a.year - b.year || a.month - b.month || a.qorder - b.qorder);
  return picked.map((u) => ({ key: 'q' + u.id, caption: `${u.year}년 ${u.month}월 ${u.qorder}번`, image: u.qPath, sourceType: 'UNIT', sourceId: u.id }));
}

async function fetchTopicQuestions(topicId: number): Promise<Question[]> {
  const { data } = await apolloClient.query<{ getUnitsInTopic: string | null }>({
    query: GET_UNITS_IN_TOPIC,
    variables: { topicId },
    fetchPolicy: 'network-only',
  });
  const units = JSON.parse(data?.getUnitsInTopic ?? '[]');
  // 서버가 비로그인 조회를 막으면 배열 대신 0을 돌려준다
  if (!Array.isArray(units)) throw new Error('topic units not public');
  return units.map((u: { sourceType: string; sourceId: number }, i: number) => ({
    key: `t${i}-${u.sourceId}`,
    caption: `${i + 1}번`,
    image: UNITIMAGE(u.sourceType, u.sourceId) ?? '',
    sourceType: u.sourceType,
    sourceId: u.sourceId,
  }));
}

export default function PublicQuestionsViewScreen() {
  const params = useLocalSearchParams<Params>();
  const { width } = useWindowDimensions();
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const title = params.topicId
    ? params.title
    : `${PRE_EXAMS_ASSETS.subjects.find((s) => s.value === params.subject)?.label ?? params.subject} 기출`;

  useEffect(() => {
    (params.topicId ? fetchTopicQuestions(Number(params.topicId)) : fetchExamQuestions(params))
      .then(setQuestions)
      .catch((e) => {
        console.warn('[public-questions] load failed:', e);
        setError('문제를 불러오지 못했어요.');
        setQuestions([]);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.subject, params.years, params.months, params.numbers, params.topicId]);

  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: true, title, headerBackTitle: '뒤로' }} />
      {questions === null ? (
        <Go3MathLoader />
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(q) => q.key}
          ListEmptyComponent={<Text style={styles.empty}>{error ?? '조건에 맞는 문제가 없어요.'}</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.caption}>{item.caption}</Text>
              <DynamicDimensionsImage source={{ uri: item.image }} width={width - 24} />
              <View style={styles.buttonRow}>
                <GoButton
                  title="해답"
                  onPress={() =>
                    router.push({ pathname: '/public-solution', params: { sourceType: item.sourceType, sourceId: String(item.sourceId) } })
                  }
                />
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  card: { padding: 6, paddingLeft: 12, borderColor: '#F5F5F5', borderWidth: 1, borderRadius: 12, backgroundColor: '#FFFFFF' },
  caption: { ...type.body, color: colors.muted, paddingBottom: 4 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 6, paddingVertical: 6 },
  empty: { padding: 24, ...type.body, color: colors.muted, textAlign: 'center' },
});
