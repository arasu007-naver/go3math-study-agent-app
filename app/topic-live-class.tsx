import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useLazyQuery, useMutation, useSubscription } from '@apollo/client/react';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { useIsFocused } from '@react-navigation/native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import debounce from 'lodash/debounce';
import moment from 'moment';
import { CREATE_RECORD } from '@/src/api/graphql/mutations';
import { LAST_LIVE_TOPIC_MESSAGE, STUDY_TOPIC } from '@/src/api/graphql/queries';
import { TOPIC_LIVE_MESSAGE_ADDED } from '@/src/api/graphql/subscriptions';
import { UNITANSWER, UNITIMAGE } from '@/src/config/api.constants';
import { canvasAction } from '@/src/kit/canvas/CanvasChrome';
import { CANVAS_SHEET_SNAPS, useCanvasSheetBottomInset, type FloatingAction } from '@/src/kit/canvas/FloatingToolbar';
import LegacyTopicLiveClassCanvasPanel from '@/src/kit/canvas/note-canvas/topic-live-canvas';
import { storage } from '@/src/kit/canvas/note-canvas/legacy';
import { safeJsonParse } from '@/src/kit/canvas/note-canvas/script-maker';
import QuizResponseModal, { type LiveQuiz } from '@/src/kit/live-class/QuizResponseModal';
import DynamicDimensionsImage from '@/src/kit/ui/image-dynamic-dims';
import Go3MathLoader from '@/src/kit/ui/loading-view';
import { useSolveFinished } from '@/src/host/useSolveFinished';
import { authStore } from '@/src/state/auth';
import { SheetHandle } from '@/src/ui/SheetHandle';
import { colors, radius } from '@/src/ui/theme';

// 주제 실황 수업 화면: 기존 qoolla-student-app `pages/notebook/topic-live-class.tsx`를 옮김. 패널은 note-canvas/topic-live-canvas.tsx 그대로.
// 실황 수업 dock에서 주제를 누르면 Stage에 그 주제 문제 목록(ProblemListPanel)을 띄우고 이 화면으로 온다. 나가면 문제 목록이 그대로 남는다.
// 기존 route.params(topicId, taskId) 대신 경로 파라미터(?topicId=&taskId=). 하단 버튼 줄은 notebook처럼 캔버스 하단 툴바에 합쳤다.

type Unit = { sourceType: string; sourceId: number; scripts?: { id: number }[] | null };
type Guide = { action?: string; scriptId?: number | string } & Record<string, unknown>;
type PanelHandle = { onReceiveGuide(guide: Guide): void; getCurrentScript(): { scriptId?: number } };
// 옮겨 온 패널은 FC로 선언된 forwardRef라 ref 타입이 없다 → 쓰는 쪽에서만 타입을 붙인다
const TopicLiveClassCanvasPanel = LegacyTopicLiveClassCanvasPanel as unknown as ComponentType<{
  ref: Ref<PanelHandle>;
  saveWorkout(imageUrl: string, sourceType: string, sourceId: number): void;
  changeUnit(unit: Unit): void;
  loaded(): void;
  initScript?: number | string;
  topicUnits: Unit[];
  onQuizReceived(q: LiveQuiz): void;
  screenActions?: FloatingAction[];
}>;

export default function TopicLiveClassScreen() {
  const params = useLocalSearchParams<{ topicId?: string; taskId?: string }>();
  const topicId = Number(params.topicId);
  const taskId = Number(params.taskId ?? 0);
  const { countSolved } = useSolveFinished({ taskId: taskId || undefined, kind: 'topic_live' });
  const { width, height } = useWindowDimensions();
  const isFocused = useIsFocused();
  const panelRef = useRef<PanelHandle | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const sheetBottomInset = useCanvasSheetBottomInset();

  const [topicUnits, setTopicUnits] = useState<Unit[]>([]);
  const [currentSheet, setCurrentSheet] = useState<Unit | null>(null);
  const [sheetListVisible, setSheetListVisible] = useState(false);
  const [savedMessage, setSavedMessage] = useState('🟡 ' + moment().format('MM/DD HH:mm'));
  const [lastPoint, setLastPoint] = useState<Guide>({ scriptId: 0 });
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [liveQuiz, setLiveQuiz] = useState<LiveQuiz | null>(null);
  const [pageLoadProgress, setPageLoadProgress] = useState(0);

  const showToast = useCallback((msg: string, then?: () => void) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
      then?.();
    }, 2500);
  }, []);
  const goBack = useCallback(() => (router.canGoBack() ? router.back() : router.replace('/')), []);

  useSubscription<{ liveTopicClassMessage: { content: string } | null }>(TOPIC_LIVE_MESSAGE_ADDED, {
    variables: { topicId },
    skip: !isFocused || !topicId,
    onData: ({ data }) => {
      const guide = safeJsonParse(data?.data?.liveTopicClassMessage?.content, null) as Guide | null;
      if (guide) {
        if (guide.action === 'quiz') {
          setLiveQuiz({ quizId: guide.quizId as number, content: guide.quiz as string });
          return;
        }
        if (guide.action !== 'snapshot' && guide.action !== 'canvas-synch') setLastPoint(guide);
        panelRef.current?.onReceiveGuide(guide);
      }
      setSavedMessage('🟡 ' + moment().format('MM/DD HH:mm'));
    },
    onError: (e) => console.warn('[topic-live-class] subscription error:', e.message),
  });

  const [createNewRecord] = useMutation(CREATE_RECORD, {
    onCompleted: () => setSavedMessage('🟡 ' + moment().format('MM/DD HH:mm')),
    onError: (e) => console.warn('[topic-live-class] createRecord failed:', e.message),
  });
  const [getTopic] = useLazyQuery<{ topicForStudy: { units: Unit[] } | null }>(STUDY_TOPIC, { fetchPolicy: 'network-only' });
  const [getLastTopicMessage] = useLazyQuery<{ lastLiveTopicMessage: { content: string } | null }>(LAST_LIVE_TOPIC_MESSAGE, {
    fetchPolicy: 'network-only',
  });

  const notReady = useCallback(() => showToast('주제 실황 강의가 준비되지 않았습니다', goBack), [showToast, goBack]);

  const callGetLastTopicMessage = useCallback(async () => {
    try {
      const { data } = await getLastTopicMessage({ variables: { topicId } });
      const guide = safeJsonParse(data?.lastLiveTopicMessage?.content, null) as Guide | null;
      if (!guide) return;
      if (panelRef.current) panelRef.current.onReceiveGuide(guide);
      else storage.set('syncPoint', JSON.stringify(guide));
    } catch (e) {
      console.warn('[topic-live-class] lastLiveTopicMessage failed:', e);
      notReady();
    }
  }, [getLastTopicMessage, topicId, notReady]);

  // 화면에 들어올 때마다 주제 문제(스크립트 포함)를 새로 받는다. 떠나면 비워 캔버스를 내린다 — 기존과 같음
  useEffect(() => {
    if (!isFocused || !topicId) {
      setTopicUnits([]);
      return;
    }
    storage.remove('syncPoint');
    let alive = true;
    getTopic({ variables: { topicId } })
      .then(({ data }) => {
        if (!alive) return;
        if (!data?.topicForStudy) throw new Error('topicForStudy is null');
        setTopicUnits(data.topicForStudy.units ?? []);
      })
      .catch((e) => {
        console.warn('[topic-live-class] topicForStudy failed:', e);
        if (alive) notReady();
      });
    return () => {
      alive = false;
    };
  }, [isFocused, topicId, getTopic, notReady]);

  // 패널은 스크립트 목록을 storage 'live-scripts'에서 읽는다. 채운 뒤 마지막 실황 메시지로 맞춘다
  useEffect(() => {
    if (topicUnits.length === 0) return;
    const allScripts = topicUnits.flatMap((u) => (u.scripts ?? []).map((s) => ({ ...s, sourceType: u.sourceType, sourceId: u.sourceId })));
    storage.set('live-scripts', JSON.stringify(allScripts));
    const t = setTimeout(() => void callGetLastTopicMessage(), 20);
    return () => clearTimeout(t);
  }, [topicUnits, callGetLastTopicMessage]);

  const syncBoard = useMemo(() => debounce(() => void callGetLastTopicMessage(), 1000, { leading: true, trailing: false, maxWait: 1000 }), [callGetLastTopicMessage]);
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

  if (!topicId) return <Redirect href="/" />;

  const onSave = (imageUrl: string, sourceType: string, sourceId: number) => {
    countSolved();
    void createNewRecord({
      variables: { sourceType, sourceId: Number(sourceId), taskId, fileName: imageUrl, photoUnitId: 0, topicId },
    });
  };

  const answerUrl = currentSheet ? UNITANSWER(currentSheet.sourceType, currentSheet.sourceId) : undefined;
  const problemUrl = currentSheet ? UNITIMAGE(currentSheet.sourceType, currentSheet.sourceId) : undefined;
  const modalWidth = Math.round(width * 0.6);
  const modalHeight = Math.round(height * 0.65);

  const actions: FloatingAction[] = [
    canvasAction('exit', '나가기', 'chevron-back', goBack),
    canvasAction('sync', '필기 따라가기', 'sync-outline', syncBoard),
    canvasAction('lastStep', '마지막 단계', 'checkmark-done-outline', playLastStep),
    ...(topicUnits.length > 1 ? [canvasAction('list', '목록', 'albums-outline', () => setSheetListVisible(true))] : []),
    canvasAction('answer', '답안 예시', 'eye-outline', () => sheetRef.current?.present()),
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
        <TopicLiveClassCanvasPanel
          ref={panelRef}
          saveWorkout={onSave}
          changeUnit={setCurrentSheet}
          loaded={() => panelRef.current?.onReceiveGuide(lastPoint)}
          initScript={lastPoint.scriptId}
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
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={CANVAS_SHEET_SNAPS}
        index={0}
        bottomInset={sheetBottomInset}
        enableDynamicSizing={false}
        enableContentPanningGesture={false}
        handleComponent={SheetHandle}
      >
        <BottomSheetView style={styles.sheetBody}>
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
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fullSize: { flex: 1, width: '100%', height: '100%' },
  savedMessage: { position: 'absolute', top: 8, left: 12, zIndex: 10, fontSize: 12, color: colors.danger },
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
  toastText: { color: 'white', fontSize: 14, fontWeight: 'bold' },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  listContainer: { position: 'absolute', backgroundColor: '#FFF', padding: 20, borderRadius: 12, elevation: 5 },
  listItem: { marginRight: 16 },
  // 시트 높이(보기·넓게)를 내용이 채운다(고정 높이 대신 flex)
  sheetBody: { flex: 1 },
  answerRow: { flex: 1, flexDirection: 'row', gap: 6, paddingHorizontal: 6 },
  answerPane: { flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card },
});
