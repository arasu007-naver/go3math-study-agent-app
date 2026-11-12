/**
 * 공지 패널 — 기존 `components/panels/profile/tablet-notices.tsx`(+폰 `notices.tsx`)를 fetcher 주입형으로 재작성.
 * 보존: 카드(주황 제목 · 이미지 · 본문 · 수업 예정일 · 작성 시각), 카드 사이 연주황 구분선, 페이지 단위 더 불러오기, 당겨서 새로고침.
 * 아직 안 옮김: 수업 예정일 캘린더 추가(expo-calendar 필요), 첨부 링크 PDF 보기(PDF 뷰어 화면 필요).
 */
import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import moment from 'moment';
import DynamicDimensionsImage from '../ui/image-dynamic-dims';
import { SkeletonCards } from '../ui/SkeletonCards';
import { colors, type } from '../../ui/theme';

export type Notice = {
  id: number | string;
  title: string;
  description?: string | null;
  createdAt?: string | number | null;
  image?: string | null;
  link?: string | null;
  sub?: string | null;
  classDate?: string | null;
};

export interface NoticeFetchers {
  /** page는 0부터(기존 그대로). 로그인이 필요하면 throw */
  fetchNotices(a: { page: number; pageSize: number }): Promise<Notice[]>;
  /** month: 'YYYY-MM'. 그 달에 작성된 공지 전부(페이지 없음) */
  fetchMonthNotices?(month: string): Promise<Notice[]>;
}

export const NOTICE_PAGE_SIZE = 36; // 기존 TASKS_PAGE_SIZE

/** month를 주면 그 달 공지만 한 번에 받고(더 불러오기 없음), 달이 바뀌면 다시 받는다(Diary 달력과 맞춤) */
export function NoticesPanel({
  fetchers,
  pageSize = NOTICE_PAGE_SIZE,
  month,
  scrollable = true,
}: {
  fetchers: NoticeFetchers;
  pageSize?: number;
  month?: string;
  /** false면 FlatList 대신 공지를 모두 그려 바깥 ScrollView가 스크롤한다(month와 함께 쓴다) */
  scrollable?: boolean;
}) {
  const { width } = useWindowDimensions();
  const [notices, setNotices] = useState<Notice[] | null>(null);
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
        const got =
          month && fetchers.fetchMonthNotices
            ? await fetchers.fetchMonthNotices(month)
            : await fetchers.fetchNotices({ page: nextPage, pageSize });
        if (id !== requestId.current) return;
        setError(null);
        setHasMore(!month && got.length >= pageSize);
        setPage(nextPage);
        setNotices((prev) => (nextPage === 0 || !prev ? got : [...prev, ...got]));
      } catch (e) {
        if (id === requestId.current) setError(String((e as Error)?.message ?? e));
      } finally {
        if (id === requestId.current) {
          setLoadingMore(false);
          setRefreshing(false);
        }
      }
    },
    [fetchers, pageSize, month],
  );

  useEffect(() => {
    // 달이 바뀌면 지난 달 목록 대신 로딩 표시
    if (month) setNotices(null);
    void load(0);
  }, [load, month]);

  if (error && !notices) return <Text style={styles.empty}>공지를 불러오지 못했어요. ({error})</Text>;
  if (!notices) return <SkeletonCards lines={3} />;

  const renderNotice = (item: Notice) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      {!!item.image && (
        <View style={styles.imageWrap}>
          <DynamicDimensionsImage source={{ uri: item.image }} width={Math.min(width - 96, 480)} />
        </View>
      )}
      {!!item.description && <Text style={styles.body}>{item.description}</Text>}
      {!!item.classDate && <Text style={styles.classDate}>{item.classDate} 예정</Text>}
      {item.createdAt != null && <Text style={styles.date}>{moment(Number(item.createdAt)).format('YYYY/MM/DD HH:mm')}</Text>}
    </View>
  );

  // 바깥 ScrollView 안에 둘 때(태블릿 Diary dock, 월 단위라 더 불러오기 없음): 공지를 모두 그린다
  if (!scrollable) {
    if (notices.length === 0) return <Text style={styles.empty}>공지 사항이 없습니다.</Text>;
    return (
      <View>
        {notices.map((n, i) => (
          <Fragment key={`qoolla-notice-${n.id}`}>
            {i > 0 && <View style={styles.divider} />}
            {renderNotice(n)}
          </Fragment>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      data={notices}
      keyExtractor={(item) => `qoolla-notice-${item.id}`}
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
      ListEmptyComponent={<Text style={styles.empty}>공지 사항이 없습니다.</Text>}
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.accent} /> : null}
      renderItem={({ item }) => renderNotice(item)}
    />
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, backgroundColor: colors.card },
  title: { ...type.title, color: colors.accentText },
  imageWrap: { alignItems: 'center' },
  body: { ...type.body, color: colors.text },
  classDate: { ...type.bodyStrong, color: colors.text },
  date: { ...type.caption, color: colors.subtle },
  // 단계 4b: 타임라인(D1)과 같은 얇은 구분선
  divider: { height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.line, marginVertical: 12, marginHorizontal: 16 },
  empty: { padding: 24, ...type.body, color: colors.subtle },
  footer: { padding: 12 },
});
