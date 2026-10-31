/**
 * 공지 패널 — 기존 `components/panels/profile/tablet-notices.tsx`(+폰 `notices.tsx`)를 fetcher 주입형으로 재작성.
 * 보존: 카드(주황 제목 · 이미지 · 본문 · 수업 예정일 · 작성 시각), 카드 사이 연주황 구분선, 페이지 단위 더 불러오기, 당겨서 새로고침.
 * 아직 안 옮김: 수업 예정일 캘린더 추가(expo-calendar 필요), 첨부 링크 PDF 보기(PDF 뷰어 화면 필요).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import moment from 'moment';
import DynamicDimensionsImage from '../ui/image-dynamic-dims';

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
}

export const NOTICE_PAGE_SIZE = 36; // 기존 TASKS_PAGE_SIZE

export function NoticesPanel({ fetchers, pageSize = NOTICE_PAGE_SIZE }: { fetchers: NoticeFetchers; pageSize?: number }) {
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
        const got = await fetchers.fetchNotices({ page: nextPage, pageSize });
        if (id !== requestId.current) return;
        setError(null);
        setHasMore(got.length >= pageSize);
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
    [fetchers, pageSize],
  );

  useEffect(() => {
    void load(0);
  }, [load]);

  if (error && !notices) return <Text style={styles.empty}>공지를 불러오지 못했어요. ({error})</Text>;
  if (!notices) return <ActivityIndicator style={styles.center} color="orange" />;

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
      ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color="orange" /> : null}
      renderItem={({ item }) => (
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
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, backgroundColor: '#FFFFFF' },
  title: { fontSize: 18, fontWeight: '700', color: 'orange' },
  imageWrap: { alignItems: 'center' },
  body: { fontSize: 14, lineHeight: 21, color: '#18181B' },
  classDate: { fontSize: 16, fontWeight: '700', color: '#212121' },
  date: { fontSize: 12, color: '#52525B' },
  // 기존 cardDivider
  divider: { height: 9, backgroundColor: '#FFE5CC', borderRadius: 4.5, marginVertical: 12, marginHorizontal: 16 },
  empty: { padding: 24, fontSize: 14, color: '#52525B' },
  center: { padding: 32 },
  footer: { padding: 12 },
});
