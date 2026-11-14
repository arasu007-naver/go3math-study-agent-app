import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client/react';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import debounce from 'lodash/debounce';
import moment from 'moment';
import { CREATE_RECORD } from '@/src/api/graphql/mutations';
import { LAST_ONLINE_CLASS_MESSAGE, ONLINE_CLASS_OF_TUTOR } from '@/src/api/graphql/queries';
import { ONLINE_TUTOR_CLASS_MESSAGE_ADDED } from '@/src/api/graphql/subscriptions';
import { UNITANSWER, UNITIMAGE } from '@/src/config/api.constants';
import { canvasAction } from '@/src/kit/canvas/CanvasChrome';
import { CanvasStudySheet } from '@/src/kit/canvas/CanvasStudySheet';
import { centerListItem } from '@/src/kit/canvas/centerListItem';
import type { FloatingAction } from '@/src/kit/canvas/FloatingToolbar';
import LegacyHotlineClassCanvasPanel from '@/src/kit/canvas/note-canvas/hotline-class-canvas';
import { storage } from '@/src/kit/canvas/note-canvas/legacy';
import { safeJsonParse } from '@/src/kit/canvas/note-canvas/script-maker';
import QuizResponseModal, { type LiveQuiz } from '@/src/kit/live-class/QuizResponseModal';
import DynamicDimensionsImage from '@/src/kit/ui/image-dynamic-dims';
import Go3MathLoader from '@/src/kit/ui/loading-view';
import { ensureTaskId, findLiveClassTaskId } from '@/src/adapters/ensureTask';
import { useSolveFinished } from '@/src/host/useSolveFinished';
import { hotlineSpec } from '@/src/host/widgets';
import { authStore } from '@/src/state/auth';
import { colors, radius, type } from '@/src/ui/theme';

// 선생님 수업(hotline class) 화면: 기존 qoolla-student-app `pages/notebook/hotline-class.tsx`를 옮김. 패널은 note-canvas/hotline-class-canvas.tsx 그대로.
// 실황 수업 dock에서 선생님 수업을 누르면 Stage에 그 선생님 수업 문제 목록(ProblemListPanel)을 띄우고 이 화면으로 온다. 나가면 문제 목록이 그대로 남는다.
// 기존 route.params(tutorId, taskId) 대신 경로 파라미터(?tutorId=&taskId=). 하단 버튼 줄은 notebook처럼 캔버스 하단 툴바에 합쳤다.
// 바뀐 점: 선생님이 수업 문제를 바꿨다는 안내({ action: 'units' })가 오면 문제(스크립트)를 다시 받는다 — 문제 목록과 같은 기준.

type Unit = { sourceType: string; sourceId: number; scripts?: { id: number }[] | null };
type Guide = { action?: string; scriptId?: number | string } & Record<string, unknown>;
type PanelHandle = { onReceiveGuide(guide: Guide): void; getCurrentScript(): { scriptId?: number } };
// 옮겨 온 패널은 forwardRef(any)라 ref 타입이 없다 → 쓰는 쪽에서만 타입을 붙인다
const HotlineClassCanvasPanel = LegacyHotlineClassCanvasPanel as unknown as ComponentType<{
  ref: Ref<PanelHandle>;
  saveWorkout(imageUrl: string, sourceType: string, sourceId: number): void;
  changeUnit(unit: Unit): void;
  loaded(): void;
  topicUnits: Unit[];
  onQuizReceived(q: LiveQuiz): void;
  screenActions?: FloatingAction[];
}>;

export default function HotlineClassScreen() {
  const params = useLocalSearchParams<{ tutorId?: string; taskId?: string }>();
  const tutorId = params.tutorId ?? '';
  // 이어 푸는 task가 있으면 그 id, 없으면 0 — 첫 풀이를 저장할 때 task를 만들어 채운다
  const [taskId, setTaskId] = useState(Number(params.taskId ?? 0));
  const { countSolved } = useSolveFinished({ taskId: taskId || undefined, kind: 'hotline' });
  // 같은 수업에 여러 번 들어올 수 있다: 이 수업(lesson_note)의 내 task가 이미 있으면 그 task를 이어서 쓴다(없으면 첫 풀이 저장 때 만든다)
  useEffect(() => {
    if (!tutorId || Number(params.taskId ?? 0)) return;
    let alive = true;
    void findLiveClassTaskId(hotlineSpec(tutorId)).then((id) => {
      if (alive && id) setTaskId((cur) => cur || id);
    });
    return () => {
      alive = false;
    };
  }, [tutorId, params.taskId]);
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();
  const panelRef = useRef<PanelHandle | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const sheetListRef = useRef<FlatList>(null);

  const [topicUnits, setTopicUnits] = useState<Unit[]>([]);
  const [currentSheet, setCurrentSheet] = useState<Unit | null>(null);
  const [sheetListVisible, setSheetListVisible] = useState(false);
  const [savedMessage, setSavedMessage] = useState('🟡 ' + moment().format('MM/DD HH:mm'));
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveQuiz, setLiveQuiz] = useState<LiveQuiz | null>(null);
  const [pageLoadProgress, setPageLoadProgress] = useState(0);

  const showToast = useCallback((msg: string, durationMs = 2500) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), durationMs);
  }, []);
  const goBack = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/')), []);

  const [createNewRecord] = useMutation(CREATE_RECORD, {
    onCompleted: () => setSavedMessage('🟡 ' + moment().format('MM/DD HH:mm')),
    onError: (e) => console.warn('[hotline-class] createRecord failed:', e.message),
  });
  const [getAgenda] = useLazyQuery<{ onlineClassOfTutor: { units: Unit[] | null } | null }>(ONLINE_CLASS_OF_TUTOR, {
    fetchPolicy: 'network-only',
  });
  const [getLastMessage] = useLazyQuery<{ lastOnlineClassMessage: { content: string } | null }>(LAST_ONLINE_CLASS_MESSAGE, {
    fetchPolicy: 'network-only',
  });

  const loadAgenda = useCallback(async () => {
    try {
      const { data } = await getAgenda({ variables: { tutorId } });
      setTopicUnits(data?.onlineClassOfTutor?.units ?? []);
    } catch (e) {
      console.warn('[hotline-class] onlineClassOfTutor failed:', e);
    }
  }, [getAgenda, tutorId]);

  const callGetLastMessage = useCallback(async () => {
    try {
      const { data } = await getLastMessage({ variables: { tutorId } });
      const guide = safeJsonParse(data?.lastOnlineClassMessage?.content, null) as Guide | null;
      if (!guide) return;
      if (panelRef.current) panelRef.current.onReceiveGuide(guide);
      else storage.set('syncPoint', JSON.stringify(guide));
    } catch (e) {
      console.warn('[hotline-class] lastOnlineClassMessage failed:', e);
    }
  }, [getLastMessage, tutorId]);

  useSubscription<{ newOnlineClassMessage: { content: string } | null }>(ONLINE_TUTOR_CLASS_MESSAGE_ADDED, {
    variables: { tutorId },
    skip: !isFocused || !tutorId,
    onData: ({ data }) => {
      const guide = safeJsonParse(data?.data?.newOnlineClassMessage?.content, null) as Guide | null;
      if (guide) {
        if (guide.action === 'quiz') {
          setLiveQuiz({ quizId: guide.quizId as number, content: guide.quiz as string });
          return;
        }
        if (guide.action === 'units') void loadAgenda();
        panelRef.current?.onReceiveGuide(guide);
      }
      setSavedMessage('🟡 ' + moment().format('MM/DD HH:mm'));
    },
    onError: (e) => console.warn('[hotline-class] subscription error:', e.message),
  });

  // 화면에 들어올 때마다 수업 문제(스크립트 포함)를 새로 받는다. 떠나면 비워 캔버스를 내린다 — 기존과 같음
  useEffect(() => {
    if (!isFocused || !tutorId) {
      setTopicUnits([]);
      return;
    }
    storage.remove('syncPoint');
    void loadAgenda();
  }, [isFocused, tutorId, loadAgenda]);

  // 패널은 스크립트 목록을 storage 'live-scripts'에서 읽는다(스크립트 없는 문제도 한 줄). 채운 뒤 마지막 수업 메시지로 맞춘다
  useEffect(() => {
    if (topicUnits.length === 0) return;
    const scripts = topicUnits.flatMap((u) =>
      u.scripts?.length ? u.scripts.map((s) => ({ ...s, sourceType: u.sourceType, sourceId: u.sourceId })) : [{ sourceType: u.sourceType, sourceId: u.sourceId }],
    );
    storage.set('live-scripts', JSON.stringify(scripts));
    const t = setTimeout(() => void callGetLastMessage(), 20);
    return () => clearTimeout(t);
  }, [topicUnits, callGetLastMessage]);

  const syncBoard = useMemo(() => debounce(() => void callGetLastMessage(), 1000, { leading: true, trailing: false, maxWait: 1000 }), [callGetLastMessage]);
  const playLastStep = useMemo(
    () =>
      debounce(
        () => {
          const res = panelRef.current?.getCurrentScript();
          panelRef.current?.onReceiveGuide({ action: 'lastStep', scriptId: res?.scriptId });
        },
        1000,
        { leading: true, trailing: false, maxWait: 1000 },
      ),
    [],
  );

  if (!tutorId) return <Redirect href="/" />;

  // task(study)는 캔버스에 들어올 때가 아니라 첫 풀이를 저장할 때 만든다. 그 뒤 저장과 solve_finished는 그 task를 쓴다
  const onSave = async (imageUrl: string, sourceType: string, sourceId: number) => {
    countSolved();
    const recordTaskId = (await ensureTaskId(taskId || undefined, hotlineSpec(tutorId))) ?? 0;
    if (recordTaskId && recordTaskId !== taskId) setTaskId(recordTaskId);
    void createNewRecord({
      variables: { sourceType, sourceId: Number(sourceId), taskId: recordTaskId, fileName: imageUrl, photoUnitId: 0, tutorId },
    });
  };

  const answerUrl = currentSheet ? UNITANSWER(currentSheet.sourceType, currentSheet.sourceId) : undefined;
  const problemUrl = currentSheet ? UNITIMAGE(currentSheet.sourceType, currentSheet.sourceId) : undefined;
  // 목록을 열 때 가운데에 둘 현재 문제(패널이 changeUnit으로 알려 준 것)
  const currentIndex = topicUnits.findIndex((u) => u.sourceType === currentSheet?.sourceType && Number(u.sourceId) === Number(currentSheet?.sourceId));
  const modalWidth = Math.round(width * 0.82);
  const modalHeight = Math.round(height * 0.65);

  const actions: FloatingAction[] = [
    canvasAction('exit', '나가기', 'chevron-back', goBack),
    canvasAction('sync', '필기 따라가기', 'sync-outline', syncBoard),
    canvasAction('lastStep', '마지막 단계', 'checkmark-done-outline', playLastStep),
    ...(topicUnits.length > 1 ? [canvasAction('list', '목록', 'albums-outline', () => setSheetListVisible(true))] : []),
    canvasAction('study', '개념·해답', 'book-outline', () => sheetRef.current?.present()),
  ];

  return (
    <SafeAreaView style={styles.root}>
      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
      <Text style={styles.savedMessage}>{savedMessage}</Text>
      <Modal animationType="fade" transparent visible={sheetListVisible} onRequestClose={() => setSheetListVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSheetListVisible(false)} />
        <View
          style={[
            styles.listContainer,
            { width: modalWidth, height: modalHeight, top: Math.round((height - modalHeight) / 2), left: Math.round((width - modalWidth) / 2) },
          ]}>
          <FlatList
            {...centerListItem(sheetListRef, currentIndex, 360, 16)}
            data={topicUnits}
            horizontal
            keyExtractor={(item, index) => `${item.sourceType}-${item.sourceId}-${index}`}
            renderItem={({ item }) => (
              <View style={styles.listItem}>
                <DynamicDimensionsImage source={{ uri: UNITIMAGE(item.sourceType, item.sourceId) ?? '' }} width={360} />
              </View>
            )}
          />
        </View>
      </Modal>
      {isFocused ? (
        <HotlineClassCanvasPanel
          ref={panelRef}
          saveWorkout={onSave}
          changeUnit={setCurrentSheet}
          loaded={() => showToast('Notes가 준비되었습니다', 3600)}
          topicUnits={topicUnits}
          onQuizReceived={setLiveQuiz}
          screenActions={actions}
        />
      ) : (
        <Go3MathLoader style={styles.fullSize} />
      )}
      <QuizResponseModal
        quiz={liveQuiz}
        appToken={authStore.getState().appToken ?? ''}
        onClose={() => setLiveQuiz(null)}
        onSubmitted={() => showToast('답안을 보냈습니다.')}
        onError={(msg) => showToast(msg)}
      />
      <CanvasStudySheet
        sheetRef={sheetRef}
        answerLabel="답안 예시"
        answer={
          <View style={styles.answerRow}>
            <View style={styles.answerPane}>
              {problemUrl && <DynamicDimensionsImage source={{ uri: problemUrl }} width={360} />}
            </View>
            <View style={styles.answerPane}>
              {answerUrl && (
                <WebView
                  originWhitelist={['*']}
                  source={{ uri: answerUrl }}
                  style={[styles.fullSize, { opacity: pageLoadProgress < 1 ? 0 : 1 }]}
                  onLoadStart={() => setPageLoadProgress(0)}
                  startInLoadingState
                  nestedScrollEnabled
                  renderLoading={() => <Go3MathLoader style={styles.fullSize} />}
                  onLoadProgress={({ nativeEvent }) => setPageLoadProgress(nativeEvent.progress)}
                />
              )}
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fullSize: { flex: 1, width: '100%', height: '100%' },
  savedMessage: { position: 'absolute', top: 8, left: 12, zIndex: 10, ...type.caption, color: colors.danger },
  toast: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 9999,
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 5,
  },
  toastText: { ...type.bodyStrong, color: colors.onAccent },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: colors.scrim },
  listContainer: { position: 'absolute', backgroundColor: colors.card, padding: 20, borderRadius: 12, elevation: 5 },
  // 폭 고정 — 이미지가 오기 전에도 카드 자리가 있어야 목록을 열 때 현재 문제로 스크롤된다
  listItem: { width: 360, marginRight: 16 },
  // 시트 높이(보기·넓게)를 내용이 채운다(고정 높이 대신 flex)
  answerRow: { flex: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 6 },
  answerPane: { flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card },
});
