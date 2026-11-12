/**
 * 개인 사서함(내 쪽지함) — 기존 `components/panels/profile/my-tablet-memos.tsx`의 쪽지 카드 목록을 fetcher 주입형으로 재작성.
 * 보존: 요청 유형별 제목(주황) · 부제(요청 내용) · 답변 내용(빨강) · 문제 해설 요청의 문제 이미지 · 작성 시각,
 * 카드 사이 연주황 구분선, 페이지 단위 더 불러오기, 당겨서 새로고침.
 * 답변 첨부 PDF(response.fileLink, 비밀번호 response.sub)는 카드나 '가자 !!!'를 누르면 PdfViewerModal로 연다(기존 PDFViewPage 이동 대신).
 * 아직 안 옮김: 개선 요청 쪽지 쓰기(입력창), '읽음' 표시(setLastMemoVisitFlag·onConfirmResponse).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import moment from 'moment';
import { UNITIMAGE } from '../../config/api.constants';
import DynamicDimensionsImage from '../ui/image-dynamic-dims';
import { PdfViewerModal, type PdfDoc } from '../ui/PdfViewerModal';
import { SkeletonCards } from '../ui/SkeletonCards';
import { colors, type } from '../../ui/theme';

export type PrivateMessage = {
  id: number | string;
  requestType: string;
  content?: string | null;
  writtenAt?: string | number | null;
  response?: { id: number | string; content?: string | null; fileLink?: string | null; sub?: string | null } | null;
};

export interface MessageBoxFetchers {
  /** page는 0부터(기존 그대로). 로그인이 필요하면 throw */
  fetchMessages(a: { page: number; pageSize: number }): Promise<PrivateMessage[]>;
}

export const MESSAGE_PAGE_SIZE = 36; // 기존 TASKS_PAGE_SIZE

const TITLES: [string[], string][] = [
  [['SUBSCRIPTION_ORDER', 'SUBSCRIPTION', 'PDF_SERVICE_REQUEST'], '서비스 구독 요청'],
  [['SUBSCRIPTION_CANCELLATION_REQUEST', 'WEEKLY_SUBSCRIPTION_CANCELLATION_REQUEST'], '구독 정지 요청'],
  [['SUBSCRIPTION_REACTIVATION_REQUEST', 'WEEKLY_SUBSCRIPTION_REACTIVATION_REQUEST'], '구독 서비스 재개 요청'],
  [['SUBSCRIPTION_MODIFICATION_REQUEST', 'SERVICE_MODIFICATION_REQUEST'], '구독 서비스 요일 변경'],
  [['PDF_SUBSCRIPTION', 'SUB_BOOK'], '주간 PDF'],
  [['PDF_TICKET_ORDER'], 'PDF 사용권 구매 요청'],
  [['PDF_REQUEST', 'BOOKMARKS_PDF_REQUEST', 'NOTE_PDF_REQUEST', 'STUDY_NOTE_PDF_REQUEST'], 'PDF 요청'],
  [['MENTORING_REQUEST', 'MENTOR_REQUEST'], '멘토링 요청'],
  [['SERVICE_IMPROVEMENT_REQUEST', 'MEMO', 'SUGGESTION_REQUEST'], '서비스 개선 사항'],
  [['UNIT_CLASS_REQUEST', 'UNIT_CLASS'], '문제 해설 요청'],
  [['SUBSCRIPTION_WEEKDAY_CHANGE'], '요일 변경'],
  [['UNSUBSCRIPTION', 'UNSUBSCRIPTON'], '구독 해지'],
];
// 부제·답변을 표시하지 않는 유형(기존 renderSubtitle / renderContentBody)
const NO_SUBTITLE = [
  'SUBSCRIPTION_ORDER', 'SUBSCRIPTION', 'PDF_SERVICE_REQUEST', 'SUBSCRIPTION_CANCELLATION_REQUEST', 'WEEKLY_SUBSCRIPTION_CANCELLATION_REQUEST',
  'SUBSCRIPTION_REACTIVATION_REQUEST', 'WEEKLY_SUBSCRIPTION_REACTIVATION_REQUEST', 'SUBSCRIPTION_MODIFICATION_REQUEST', 'SERVICE_MODIFICATION_REQUEST',
  'PDF_SUBSCRIPTION', 'SUB_BOOK', 'PDF_TICKET_ORDER', 'UNIT_CLASS_REQUEST', 'UNIT_CLASS',
];
const NO_RESPONSE = [...NO_SUBTITLE.filter((t) => t !== 'UNIT_CLASS_REQUEST' && t !== 'UNIT_CLASS'), 'PDF_REQUEST'];
const UNIT_TYPES = ['UNIT', 'MATH_ESSAY', 'PREMISE', 'BUNDLE', 'MATH_CONCEPT'];

/** 기존 카드 규칙: 제목, 부제, 답변(빨강), 문제 해설 요청이면 문제 이미지 */
export function describeMessage(m: PrivateMessage): { title: string; subtitle: string | null; response: string | null; image: string | null } {
  const title = TITLES.find(([types]) => types.includes(m.requestType))?.[1] ?? m.requestType;
  let subtitle: string | null = NO_SUBTITLE.includes(m.requestType) ? null : (m.content ?? null);
  if (m.requestType === 'PDF_REQUEST') {
    try {
      subtitle = JSON.parse(m.content ?? '').paymentSourceType === 'order' ? '구매 티켓 사용' : '쿠폰 사용';
    } catch {
      subtitle = m.content ?? null;
    }
  }
  let image: string | null = null;
  let response: string | null = NO_RESPONSE.includes(m.requestType) ? null : (m.response?.content ?? null);
  if (m.requestType === 'UNIT_CLASS_REQUEST' || m.requestType === 'UNIT_CLASS') {
    try {
      const unit = JSON.parse(m.content ?? '');
      if (unit && UNIT_TYPES.includes(unit.sourceType)) image = UNITIMAGE(unit.sourceType, unit.sourceId) ?? null;
    } catch {
      // 문제 정보가 아니면 내용을 그대로 보인다
    }
    response = image ? null : (m.content ?? null);
  }
  return { title, subtitle, response, image };
}

export function MessageBoxPanel({ fetchers, pageSize = MESSAGE_PAGE_SIZE }: { fetchers: MessageBoxFetchers; pageSize?: number }) {
  const [messages, setMessages] = useState<PrivateMessage[] | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageWidth, setImageWidth] = useState(0);
  const [pdf, setPdf] = useState<PdfDoc | null>(null);
  const requestId = useRef(0);

  const load = useCallback(
    async (nextPage: number) => {
      const id = ++requestId.current;
      try {
        const got = await fetchers.fetchMessages({ page: nextPage, pageSize });
        if (id !== requestId.current) return;
        setError(null);
        setHasMore(got.length >= pageSize);
        setPage(nextPage);
        setMessages((prev) => (nextPage === 0 || !prev ? got : [...prev, ...got]));
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

  return (
    <View style={styles.root} onLayout={(e) => setImageWidth(Math.round(e.nativeEvent.layout.width / 2))}>
      <Text style={styles.header}>개인 사서함</Text>
      {error && !messages ? (
        <Text style={styles.empty}>쪽지를 불러오지 못했어요. ({error})</Text>
      ) : !messages ? (
        <SkeletonCards count={3} button />
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => `message-${item.id}`}
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
          ListEmptyComponent={<Text style={styles.empty}>받은 쪽지가 없습니다.</Text>}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={styles.footer} color={colors.accent} /> : null}
          renderItem={({ item }) => {
            const d = describeMessage(item);
            const fileLink = item.response?.fileLink;
            return (
              <Pressable
                disabled={!fileLink}
                onPress={() => fileLink && setPdf({ url: fileLink, password: item.response?.sub })}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                <Text style={styles.title}>{d.title}</Text>
                {!!d.subtitle && <Text style={styles.subtitle} numberOfLines={item.requestType === 'PDF_REQUEST' ? 1 : 3}>{d.subtitle}</Text>}
                {!!d.image && imageWidth > 0 && <DynamicDimensionsImage source={{ uri: d.image }} width={imageWidth} />}
                {!!d.response && <Text style={item.requestType.startsWith('UNIT_CLASS') ? styles.subtitle : styles.response}>{d.response}</Text>}
                <View style={styles.actions}>
                  {item.writtenAt != null && <Text style={styles.date}>{moment(Number(item.writtenAt)).format('YYYY/MM/DD HH:mm')}</Text>}
                  {!!fileLink && <Text style={styles.go}>가자 !!!</Text>}
                </View>
              </Pressable>
            );
          }}
        />
      )}
      <PdfViewerModal doc={pdf} onClose={() => setPdf(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.card },
  header: { paddingHorizontal: 16, paddingBottom: 8, ...type.title, color: colors.text },
  card: { paddingHorizontal: 16, paddingVertical: 8, gap: 6, backgroundColor: colors.card },
  title: { ...type.title, color: colors.accentText },
  subtitle: { ...type.body, color: colors.text },
  response: { ...type.body, color: colors.danger },
  pressed: { opacity: 0.6 },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { ...type.caption, color: colors.muted },
  // 기존 GoButton('가자 !!!')
  go: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: colors.accent, color: colors.accentText, fontWeight: '700', overflow: 'hidden' },
  // 기존 cardDivider
  divider: { height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.line, marginVertical: 12, marginHorizontal: 16 },
  empty: { padding: 24, ...type.body, color: colors.subtle },
  footer: { padding: 12 },
});
