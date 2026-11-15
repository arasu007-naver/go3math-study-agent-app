/**
 * Study Log '이번 주 학습장' 탭 — 이번 주(KST 월요일부터) 손댄 학습장 카드와 카드별 '돌아보기'.
 * '돌아보기'를 누르면 그 task의 풀이 업로드·퀴즈 답을 시각순으로 펼친다(처음 펼칠 때 한 번만 조회).
 * refreshKey가 바뀌면 목록을 조용히 다시 받고, 펼쳐 둔 카드는 펼친 채로 그 기록만 다시 받는다.
 * 설계: docs/superpowers/specs/2026-11-15-study-log-review-design.md §4.
 */
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Image, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Zoomable } from '../diary/DailyRecordsList';
import { SkeletonCards } from '../ui/SkeletonCards';
import { describeNote, describeTask } from '../timeline/TimelinePanel';
import { Button, buttonLook } from '../../ui/Button';
import { IconButton } from '../../ui/IconButton';
import { colors, radius, space, type } from '../../ui/theme';
import { kstLabel, toTimelineTask, weekStartKst, type ReviewActivity, type StudyLogFetchers, type StudyNoteListItem } from './model';
import { cachedTopicTitle } from './topicTitles';

/** 타임라인과 같은 카드 종류만 보인다(다른 종류는 describeTask가 이름을 붙이지 못한다) */
const CARD_TYPES = ['selection', 'collection', 'topic', 'topic-live', 'hotline', 'bookmark'];

type Uploads = { status: 'loading' } | { status: 'failed' } | { status: 'done'; items: ReviewActivity[] };

const KIND_LABEL: Record<ReviewActivity['type'], string> = { SOLUTION_UPLOAD: '풀이 업로드', QUIZ_ANSWER: '퀴즈 답' };

export function cardTitle(item: StudyNoteListItem, topicTitle?: string | null): string {
  if (item.title) return item.title;
  if (item.taskType === 'topic') return topicTitle || '주제';
  if (item.taskType === 'collection') return '문제 모음';
  return describeTask(toTimelineTask(item)).title.replace(/^📝\s*/, '');
}

export function StudyNoteReviewList({
  fetchers,
  refreshKey,
  fetchTopicTitle,
  now = () => new Date(),
}: {
  fetchers: StudyLogFetchers;
  refreshKey: number;
  /** 주제 카드 제목(서버가 title을 주지 않을 때). 없으면 '주제' */
  fetchTopicTitle?(topicId: number): Promise<string>;
  now?: () => Date;
}) {
  const [notes, setNotes] = useState<StudyNoteListItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [topicTitles, setTopicTitles] = useState<Record<number, string>>({});
  const [open, setOpen] = useState<Set<number>>(() => new Set());
  const [uploads, setUploads] = useState<Record<number, Uploads>>({});
  const [viewing, setViewing] = useState<string | null>(null);
  const requestId = useRef(0);
  const openRef = useRef(open);
  openRef.current = open;

  const loadUploads = useCallback(
    (taskId: number, quiet: boolean) => {
      if (!quiet) setUploads((u) => ({ ...u, [taskId]: { status: 'loading' } }));
      fetchers.listActivities(taskId).then(
        (items) => setUploads((u) => ({ ...u, [taskId]: { status: 'done', items } })),
        () => setUploads((u) => (quiet && u[taskId]?.status === 'done' ? u : { ...u, [taskId]: { status: 'failed' } })),
      );
    },
    [fetchers],
  );

  const load = useCallback(async () => {
    const id = ++requestId.current;
    try {
      const got = (await fetchers.listNotes(weekStartKst(now()))).filter((n) => CARD_TYPES.includes(n.taskType));
      if (id !== requestId.current) return;
      setFailed(false);
      setNotes(got);
      // 펼쳐 둔 카드는 펼친 채로 기록만 조용히 다시 받는다
      openRef.current.forEach((taskId) => loadUploads(taskId, true));
      if (fetchTopicTitle) {
        got
          .filter((n) => n.taskType === 'topic' && !n.title && n.collectionId != null)
          .forEach((n) => {
            const topicId = Number(n.collectionId);
            cachedTopicTitle(topicId, fetchTopicTitle).then(
              (t) => setTopicTitles((m) => (m[topicId] === t ? m : { ...m, [topicId]: t })),
              () => undefined,
            );
          });
      }
    } catch {
      if (id === requestId.current) setFailed(true);
    } finally {
      if (id === requestId.current) setRefreshing(false);
    }
    // now는 시계 주입용(테스트)이라 바뀌어도 다시 만들지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchers, fetchTopicTitle, loadUploads]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const toggle = (taskId: number) => {
    const next = new Set(open);
    if (next.has(taskId)) {
      next.delete(taskId);
      // 접은 카드의 기록은 버린다 — 다음에 펼칠 때 새로 받는다
      setUploads((u) => {
        const { [taskId]: _drop, ...rest } = u;
        return rest;
      });
    } else {
      next.add(taskId);
      if (!uploads[taskId]) loadUploads(taskId, false);
    }
    setOpen(next);
  };

  if (failed && !notes) return <Text style={styles.empty}>학습장을 불러오지 못했어요</Text>;
  if (!notes) return <SkeletonCards />;

  return (
    <>
      <FlatList
        data={notes}
        keyExtractor={(n) => `note-${n.note.taskId}`}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          void load();
        }}
        ItemSeparatorComponent={() => <View style={styles.divider} />}
        ListEmptyComponent={<Text style={styles.empty}>이번 주에 쓴 학습장이 없어요</Text>}
        renderItem={({ item }) => {
          const taskId = item.note.taskId;
          const title = cardTitle(item, item.collectionId != null ? topicTitles[Number(item.collectionId)] : undefined);
          const summary = describeNote(toTimelineTask(item));
          const expanded = open.has(taskId);
          return (
            <View style={styles.card}>
              <View style={styles.titleRow}>
                <Ionicons name="document-text-outline" size={18} color={colors.text} />
                <Text style={styles.title} numberOfLines={2}>
                  {title}
                </Text>
              </View>
              {summary ? (
                <Text style={styles.note} numberOfLines={2}>
                  {summary.replace(/^✏️\s*/, '')}
                </Text>
              ) : null}
              <View style={styles.actions}>
                <ReviewToggle expanded={expanded} label={`${title} 돌아보기`} onPress={() => toggle(taskId)} />
              </View>
              {expanded ? <UploadList state={uploads[taskId]} onRetry={() => loadUploads(taskId, false)} onView={setViewing} /> : null}
            </View>
          );
        }}
      />
      <ImageViewer uri={viewing} onClose={() => setViewing(null)} />
    </>
  );
}

/** '돌아보기' + 뒤 화살표(펼치면 위로). 공용 Button은 아이콘이 글자 앞이라 텍스트 버튼 모양을 그대로 따라 그린다 */
function ReviewToggle({ expanded, label, onPress }: { expanded: boolean; label: string; onPress(): void }) {
  const look = buttonLook('text', 'default', false);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded }}
      hitSlop={space.sm}
      onPress={onPress}
      style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
    >
      <Text style={[styles.toggleText, { color: look.label }]}>돌아보기</Text>
      <Ionicons testID="review-chevron" name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={look.label} />
    </Pressable>
  );
}

function UploadList({ state, onRetry, onView }: { state: Uploads | undefined; onRetry(): void; onView(uri: string): void }) {
  if (!state || state.status === 'loading') {
    return (
      <View style={styles.skeleton}>
        <SkeletonCards count={1} lines={1} divider={false} />
      </View>
    );
  }
  if (state.status === 'failed') {
    return (
      <View style={styles.failedRow}>
        <Text style={styles.muted}>불러오지 못했어요</Text>
        <Button variant="text" size="sm" title="다시 시도" onPress={onRetry} />
      </View>
    );
  }
  if (state.items.length === 0) return <Text style={styles.muted}>이 학습에서 올린 풀이가 없어요</Text>;
  return (
    <View style={styles.uploads}>
      {state.items.map((a) => (
        <View key={`${a.type}-${a.id}`} style={styles.upload}>
          <View style={styles.uploadText}>
            <Text style={styles.uploadKind}>{KIND_LABEL[a.type]}</Text>
            <Text style={styles.muted}>{kstLabel(a.createdAt)}</Text>
          </View>
          <Pressable accessibilityRole="imagebutton" accessibilityLabel={`${KIND_LABEL[a.type]} 크게 보기`} onPress={() => onView(a.imageUrl)}>
            <Image source={{ uri: a.imageUrl }} style={styles.thumb} resizeMode="cover" />
          </Pressable>
        </View>
      ))}
    </View>
  );
}

function ImageViewer({ uri, onClose }: { uri: string | null; onClose(): void }) {
  const { width } = useWindowDimensions();
  return (
    <Modal visible={uri !== null} animationType="fade" onRequestClose={onClose}>
      <View style={styles.viewer}>
        <View style={styles.viewerBar}>
          <IconButton icon="close" accessibilityLabel="닫기" onPress={onClose} />
        </View>
        {uri ? <Zoomable uri={uri} width={width} /> : null}
      </View>
    </Modal>
  );
}

const THUMB = 72;

const styles = StyleSheet.create({
  card: { paddingHorizontal: space.lg, paddingVertical: space.md, gap: space.xs, backgroundColor: colors.card },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  title: { ...type.title, color: colors.text, flexShrink: 1 },
  note: { ...type.body, color: colors.subtle },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space.sm },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: space.xxs, paddingVertical: space.xs, paddingHorizontal: space.sm },
  toggleText: { ...type.bodyStrong },
  pressed: { opacity: 0.6 },
  uploads: { gap: space.sm, paddingTop: space.xs },
  upload: { flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.cardMuted, borderRadius: radius.md, padding: space.sm },
  uploadText: { flex: 1, gap: space.xxs },
  uploadKind: { ...type.bodyStrong, color: colors.text },
  thumb: { width: THUMB, height: THUMB, borderRadius: radius.sm, backgroundColor: colors.card },
  muted: { ...type.body, color: colors.muted },
  failedRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  skeleton: { marginHorizontal: -space.lg },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  empty: { ...type.body, color: colors.muted, padding: space.lg, textAlign: 'center' },
  viewer: { flex: 1, backgroundColor: colors.bg },
  viewerBar: { flexDirection: 'row', justifyContent: 'flex-end', padding: space.md },
});
