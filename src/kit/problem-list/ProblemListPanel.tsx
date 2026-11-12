/**
 * 문제 목록 — 기존 `TabletQuestionsViewerModal`(기출 검색 · 문제 모음 · 책갈피 문제 보기)을 모달 대신 Stage 위젯으로.
 * 카드 모양은 주제 문제 목록(TopicUnitList)과 같다: 'N번' + 문제 이미지, 넓으면 2열.
 * 데이터는 fetcher로 주입받고(어떤 출처의 문제인지는 source로 넘긴다), 고른 문제는 onSelectProblem으로 올린다.
 * 오른쪽 아래 연필 버튼(onSolve)은 마지막으로 고른 문제(없으면 1번)부터 풀이 화면을 연다.
 * renderFooter(선택)는 카드 이미지 아래 한 줄(폰 결과 화면의 해답·카메라 버튼).
 * 기본 버튼 줄의 '해답'은 그 문항을 말꼬리로 가리키는 해답 말풍선(WebView)을 연다. 버튼을 누른 문항은 카드를 누른 것처럼 현재 문제가 된다.
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { ADD_BOOKMARK, REMOVE_BOOKMARK } from '../../api/graphql/mutations';
import { UNITANSWER } from '../../config/api.constants';
import { apolloClient } from '../../state/bootstrap';
import { colors } from '../../ui/theme';
import DynamicDimensionsImage from '../ui/image-dynamic-dims';
import GoButton from '../ui/go-button';
import { PencilFab } from '../ui/PencilFab';
import { AnswerBubble } from './AnswerBubble';
import { placeAnswerBubble, type BubblePlacement, type Rect } from './answerBubblePlacement';

/** 출처: 타임라인 학습 기록(task), 기출 검색 조건(검색 dock · exam_search의 '가자') 또는 내 책갈피(Stage 헤더 책갈피 버튼) */
export type ProblemSource =
  | { kind: 'task'; taskId: number }
  | { kind: 'exam_query'; query: Record<string, unknown>; taskId?: number }
  | { kind: 'bookmarks'; taskId?: number }
  /** 앱이 이미 가진 문제 묶음(태블릿 Diary dock의 문제별 '가자!!!'). 조회 없이 그대로 보인다. taskId: 그 묶음을 받아 온 task */
  | { kind: 'list'; title: string; problems: Problem[]; taskId?: number }
  /** 실황 수업 dock: 선생님 수업(문제가 수업 중 늘거나 줄 수 있다 — subscribe) · 주제 실황 수업 */
  | { kind: 'hotline'; tutorId: string; title: string }
  | { kind: 'topic_live'; topicId: number; title: string };

export type Problem = { sourceType: string; sourceId: number; image: string };
export type ProblemSet = { title: string; subtitle?: string | null; problems: Problem[] };

export interface ProblemListFetchers {
  fetchProblems(source: ProblemSource): Promise<ProblemSet>;
  addBookmark?(sourceType: string, sourceId: number): Promise<void>;
  removeBookmark?(sourceType: string, sourceId: number): Promise<void>;
  /** 출처의 문제가 바뀔 때마다 onChange를 부른다(선생님 수업). 돌려준 함수로 구독을 끝낸다. 바뀌지 않는 출처면 undefined */
  subscribe?(source: ProblemSource, onChange: () => void): (() => void) | undefined;
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
  renderFooter?(a: { index: number; problem: Problem; set: ProblemSet }): ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const [set, setSet] = useState<ProblemSet | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(0);
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());
  // 열려 있는 해답 말풍선(한 번에 하나)
  const [answer, setAnswer] = useState<{ itemKey: string; url: string; placement: BubblePlacement } | null>(null);
  // 말풍선 자리 계산용: 패널 크기, 목록(ScrollView)의 패널 안 y, 스크롤 위치, 카드별 목록 안 자리
  const rootSize = useRef({ width: 0, height: 0 });
  const listY = useRef(0);
  const scrollY = useRef(0);
  const cardRects = useRef<Record<number, Rect>>({});
  const key = JSON.stringify(source);

  useEffect(() => {
    let alive = true;
    setSet(null);
    setError(null);
    setSelected(0);
    setAnswer(null);
    fetchers
      .fetchProblems(JSON.parse(key))
      .then((s) => {
        if (!alive) return;
        setSet(s);
        if (s.problems.length > 0) {
          setSelected((prev) => (prev !== null && prev < s.problems.length ? prev : 0));
        } else {
          setSelected(null);
        }
      })
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [fetchers, key]);

  // 문제가 바뀌었다는 알림이 오면 목록을 비우지 않고 새로 받아 바꾼다(고른 문제는 범위 안이면 그대로)
  useEffect(() => {
    let alive = true;
    const src: ProblemSource = JSON.parse(key);
    const unsubscribe = fetchers.subscribe?.(src, () => {
      fetchers
        .fetchProblems(src)
        .then((s) => {
          if (!alive) return;
          setSet(s);
          setSelected((prev) => (s.problems.length === 0 ? null : prev !== null && prev < s.problems.length ? prev : 0));
        })
        .catch((e) => console.warn('[ProblemListPanel] refetch failed:', e));
    });
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, [fetchers, key]);

  const isBookmarkList =
    source.kind === 'bookmarks' ||
    (source.kind === 'task' && (set?.title.includes('책갈피') ?? false));

  // '해답'·'책갈피'·'책갈피 해제'를 누른 문항은 카드를 누른 것처럼 현재 문제로 고른다
  const select = (index: number, problem: Problem) => {
    setSelected(index);
    onSelectProblem({ index, problem });
  };

  // 같은 문항이면 닫고, 아니면 그 문항 카드의 지금 자리를 기준으로 말풍선을 연다(다른 문항이면 옮겨 간다)
  const toggleAnswer = (index: number, problem: Problem, itemKey: string, url: string | undefined) => {
    if (answer?.itemKey === itemKey || !url) return setAnswer(null);
    select(index, problem);
    const card = cardRects.current[index] ?? { x: 0, y: 0, width: 0, height: 0 };
    const container = rootSize.current.width > 0 ? rootSize.current : { width, height };
    const placement = placeAnswerBubble({ ...card, y: card.y - scrollY.current + listY.current }, container, width >= 600);
    setAnswer({ itemKey, url, placement });
  };

  const handleAddBookmark = useCallback(
    async (problem: Problem, itemKey: string) => {
      try {
        if (fetchers.addBookmark) {
          await fetchers.addBookmark(problem.sourceType, Number(problem.sourceId));
        } else {
          await apolloClient.mutate({
            mutation: ADD_BOOKMARK,
            variables: {
              sourceType: problem.sourceType,
              sourceId: Number(problem.sourceId),
            },
          });
        }
        setBookmarkedKeys((prev) => new Set(prev).add(itemKey));
      } catch (e) {
        console.warn('[ProblemListPanel] handleAddBookmark failed:', e);
      }
    },
    [fetchers],
  );

  const handleRemoveBookmark = useCallback(
    async (problem: Problem, index: number) => {
      try {
        if (fetchers.removeBookmark) {
          await fetchers.removeBookmark(problem.sourceType, Number(problem.sourceId));
        } else {
          await apolloClient.mutate({
            mutation: REMOVE_BOOKMARK,
            variables: {
              sourceType: problem.sourceType,
              sourceId: Number(problem.sourceId),
            },
          });
        }
        setAnswer(null);
        setSet((prev) => {
          if (!prev) return prev;
          const nextProblems = prev.problems.filter((_, i) => i !== index);
          setSelected((curr) => {
            if (nextProblems.length === 0) return null;
            if (curr === null) return 0;
            if (curr === index) return Math.min(index, nextProblems.length - 1);
            if (curr > index) return curr - 1;
            return curr;
          });
          return { ...prev, problems: nextProblems };
        });
      } catch (e) {
        console.warn('[ProblemListPanel] handleRemoveBookmark failed:', e);
      }
    },
    [fetchers],
  );

  if (error) return <Text style={styles.empty}>문제를 불러오지 못했어요. ({error})</Text>;
  if (!set) return <ActivityIndicator style={styles.center} color="orange" />;

  const twoCol = width >= 600;
  const cardWidth = (twoCol ? Math.min(width, 1200) / 2 : Math.min(width, 600)) - 24;

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        rootSize.current = e.nativeEvent.layout;
      }}>
      <View style={styles.head}>
        <Text style={styles.heading}>{set.title}</Text>
        {!!set.subtitle && <Text style={styles.subtitle}>{set.subtitle}</Text>}
      </View>
      <ScrollView
        contentContainerStyle={styles.grid}
        scrollEventThrottle={16}
        onLayout={(e) => {
          listY.current = e.nativeEvent.layout.y;
        }}
        onScroll={(e) => {
          scrollY.current = e.nativeEvent.contentOffset.y;
          // 목록이 움직이면 말풍선이 문항과 어긋나므로 닫는다
          setAnswer(null);
        }}>
        {set.problems.length === 0 && <Text style={styles.empty}>문제가 없어요.</Text>}
        {set.problems.map((problem, index) => {
          const itemKey = `${problem.sourceType}-${problem.sourceId}-${index}`;
          const isShowingAnswer = answer?.itemKey === itemKey;
          const itemAnswerUrl = UNITANSWER(problem.sourceType, problem.sourceId);
          const isBookmarked = bookmarkedKeys.has(itemKey);

          return (
            <Pressable
              key={itemKey}
              accessibilityRole="button"
              accessibilityLabel={`${index + 1}번 문제`}
              accessibilityState={{ selected: index === selected }}
              onLayout={(e) => {
                cardRects.current[index] = e.nativeEvent.layout;
              }}
              onPress={() => {
                setAnswer(null);
                select(index, problem);
              }}
              style={({ pressed }) => [
                styles.card,
                { width: cardWidth },
                index === selected && styles.cardOn,
                pressed && styles.pressed,
              ]}>
              <Text style={styles.cardLabel}>{index + 1}번</Text>
              <DynamicDimensionsImage source={{ uri: problem.image }} width={cardWidth - 16} />
              {renderFooter ? (
                renderFooter({ index, problem, set })
              ) : (
                <View style={styles.cardActions}>
                  <GoButton
                    title={isShowingAnswer ? '닫기' : '해답'}
                    size="small"
                    variant={isShowingAnswer ? 'filled' : 'outline'}
                    onPress={() => toggleAnswer(index, problem, itemKey, itemAnswerUrl)}
                  />
                  {isBookmarkList ? (
                    <GoButton
                      title="책갈피 해제"
                      size="small"
                      variant="outline"
                      color={colors.danger}
                      textColor={colors.danger}
                      onPress={() => {
                        select(index, problem);
                        return handleRemoveBookmark(problem, index);
                      }}
                    />
                  ) : (
                    <GoButton
                      title={isBookmarked ? '책갈피됨' : '책갈피'}
                      size="small"
                      variant={isBookmarked ? 'filled' : 'outline'}
                      disabled={isBookmarked}
                      onPress={() => {
                        select(index, problem);
                        return handleAddBookmark(problem, itemKey);
                      }}
                    />
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
      {answer && <AnswerBubble url={answer.url} placement={answer.placement} />}
      {onSolve && set.problems.length > 0 && <PencilFab onPress={() => onSolve({ index: selected ?? 0, set })} />}
    </View>
  );
}

/** 북마크 목록 전용 패널 래퍼(source={ kind: 'bookmarks' } 기본값) */
export function BookmarksPanel(
  props: Omit<Parameters<typeof ProblemListPanel>[0], 'source'> & { source?: ProblemSource },
) {
  return <ProblemListPanel {...props} source={props.source ?? { kind: 'bookmarks' }} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  head: { padding: 12, gap: 2 },
  heading: { fontSize: 16, fontWeight: '700', color: '#18181B' },
  subtitle: { fontSize: 14, fontWeight: '700', color: 'orange' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 12, paddingBottom: 280 },
  card: {
    padding: 8,
    gap: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#E4E4E7',
    backgroundColor: '#FFFFFF',
  },
  cardOn: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: '#FFFDF9',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  cardLabel: { fontSize: 13, fontWeight: '500', color: '#52525B' },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 4,
  },
  empty: { padding: 24, fontSize: 14, color: '#52525B' },
  center: { padding: 32 },
  pressed: { opacity: 0.6 },
});
