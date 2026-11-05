import { useCallback, useEffect, useRef, useState, type ComponentType, type Ref } from 'react';
import { Dimensions, FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useLazyQuery, useMutation } from '@apollo/client/react';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { Redirect, router } from 'expo-router';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CREATE_RECORD, SEND_REQUEST_MESSAGE, ADD_BOOKMARK } from '@/src/api/graphql/mutations';
import { UNIT_TRIES } from '@/src/api/graphql/queries';
import { UNITANSWER } from '@/src/config/api.constants';
import { canvasAction } from '@/src/kit/canvas/CanvasChrome';
import type { FloatingAction } from '@/src/kit/canvas/FloatingToolbar';
import ImageAdjustCard from '@/src/kit/canvas/note-canvas/image-adjust-card';
import LegacyNotebookCanvasPanel from '@/src/kit/canvas/note-canvas/notebook';
import GoButton from '@/src/kit/ui/go-button';
import Go3MathLoader from '@/src/kit/ui/loading-view';
import { solveStore, type SolveProblem } from '@/src/state/solve';
import { SheetHandle } from '@/src/ui/SheetHandle';
import { colors, radius } from '@/src/ui/theme';

// 문제 풀이 화면: 기존 pages/notebook/index.tsx를 옮김. 패널은 note-canvas/notebook.tsx 그대로,
// 하단 버튼 줄(나가기·목록·답안 예시·내 이전 풀이)은 아이콘 버튼으로 캔버스 하단 가운데 툴바(펜 설정 등)에 합쳤다. 모달·바텀시트는 기존 그대로다.
// '멘토링 요청' 버튼은 뺐다(2026-11-02 요청).
// 기존 route.params(unit, units, topicId, taskId) 대신 solveStore에서 받는다. 나가면 Stage의 문제 목록은 그대로 남는다.
type PanelHandle = { changeNotebookBackgroundImage(url: string): void; saveSnapshotForMentoring(): void };
// 옮겨 온 패널은 FC로 선언된 forwardRef라 ref 타입이 없다 → 쓰는 쪽에서만 타입을 붙인다
const NotebookCanvasPanel = LegacyNotebookCanvasPanel as unknown as ComponentType<{
  ref: Ref<PanelHandle>;
  loaded(): void;
  saveWorkout(imageUrl: string): void;
  saveMentorRequestShot(imageUrl: string): void;
  screenActions?: FloatingAction[];
}>;

const { width, height } = Dimensions.get('window');

export default function NotebookScreen() {
  const { width, height } = useWindowDimensions();
  const session = solveStore.useStore();
  const panelRef = useRef<PanelHandle | null>(null);
  const sheetRef = useRef<BottomSheetModal>(null);
  const workoutSheetListRef = useRef<BottomSheetModal>(null);
  const [currentSheet, setCurrentSheet] = useState<SolveProblem | undefined>(session?.problems[session.index]);
  const [sheetListVisible, setSheetListVisible] = useState(false);
  const [workoutNotes, setWorkoutNotes] = useState<string[]>([]);
  const [pageLoadProgress, setPageLoadProgress] = useState(0);
  const [bookmarkedKeys, setBookmarkedKeys] = useState<Set<string>>(new Set());
  const [showingAnswerKeys, setShowingAnswerKeys] = useState<Set<string>>(new Set());

  const [createNewRecord] = useMutation<{ createRecord: { id: number } }>(CREATE_RECORD, {
    onError: (e) => console.warn('[notebook] createRecord failed:', e.message),
  });
  const [sendExplainRequest] = useMutation(SEND_REQUEST_MESSAGE, {
    onError: (e) => console.warn('[notebook] sendExplainRequest failed:', e.message),
  });
  const [addBookmark] = useMutation(ADD_BOOKMARK, {
    onError: (e) => console.warn('[notebook] addBookmark failed:', e.message),
  });
  const [getTries] = useLazyQuery<{ tries: { content: string }[] }>(UNIT_TRIES, { fetchPolicy: 'network-only' });

  const handleBookmark = useCallback(async (item: SolveProblem) => {
    const key = `${item.sourceType}-${item.sourceId}`;
    try {
      await addBookmark({
        variables: {
          sourceType: item.sourceType,
          sourceId: Number(item.sourceId),
        },
      });
      setBookmarkedKeys((prev) => new Set(prev).add(key));
    } catch (e) {
      console.warn('[notebook] handleBookmark failed:', e);
    }
  }, [addBookmark]);

  const toggleAnswer = useCallback((key: string) => {
    setShowingAnswerKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handlePresentModalPress = useCallback(() => sheetRef.current?.present(), []);
  const handlePresentWorkoutSheetListModalPress = useCallback(() => workoutSheetListRef.current?.present(), []);

  // 문제가 바뀌면 배경을 바꾸고 내 이전 풀이를 불러온다(있으면 바로 보여 준다) — 기존과 같음
  useEffect(() => {
    if (!currentSheet) return;
    panelRef.current?.changeNotebookBackgroundImage(currentSheet.image);
    setSheetListVisible(false);
    let alive = true;
    getTries({ variables: { sourceType: currentSheet.sourceType, sourceId: Number(currentSheet.sourceId) } })
      .then(({ data }) => {
        if (!alive || !data?.tries) return;
        const tries = data.tries.map((t) => t.content);
        setWorkoutNotes(tries);
        if (tries.length > 0) setTimeout(handlePresentWorkoutSheetListModalPress);
      })
      .catch((e) => console.warn('[notebook] tries failed:', e));
    return () => {
      alive = false;
    };
  }, [currentSheet, getTries, handlePresentWorkoutSheetListModalPress]);

  if (!session || !currentSheet) return <Redirect href="/" />;
  const units = session.problems;
  const answerUrl = UNITANSWER(currentSheet.sourceType, currentSheet.sourceId);

  const recordOf = (imageUrl: string) =>
    createNewRecord({
      variables: {
        sourceType: currentSheet.sourceType,
        sourceId: Number(currentSheet.sourceId),
        taskId: Number(session.taskId ?? 0),
        fileName: imageUrl,
        photoUnitId: 0,
      },
    });

  const onSave = (imageUrl: string) => {
    void recordOf(imageUrl);
    setWorkoutNotes((notes) => [imageUrl, ...notes]);
    setTimeout(handlePresentWorkoutSheetListModalPress, 20);
  };

  const onMentoringRequestSave = async (imageUrl: string) => {
    const record = await recordOf(imageUrl);
    const recordId = record.data?.createRecord.id;
    const detail = { sourceType: currentSheet.sourceType, sourceId: currentSheet.sourceId, workout: imageUrl, recordId };
    void sendExplainRequest({
      variables: {
        pinObjId: null,
        pinPointDescription: JSON.stringify(detail),
        topicId: session.topicId ? Number(session.topicId) : 0,
        scriptId: 0,
        content: JSON.stringify({ currentIdx: 0, ...detail }),
      },
    });
    setWorkoutNotes((notes) => [imageUrl, ...notes]);
    setTimeout(handlePresentWorkoutSheetListModalPress, 20);
  };

  const modalWidth = Math.round((width * 60) / 100);
  const modalHeight = Math.round(height * 0.65);
  const itemWidth = Math.min(380, Math.floor(modalWidth - 48));
  const bodyHeight = Math.max(260, modalHeight - 130);

  return (
    <SafeAreaView style={styles.root}>
      <Modal animationType="fade" transparent visible={sheetListVisible} onRequestClose={() => setSheetListVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSheetListVisible(false)} />
        <View
          style={[
            styles.listContainer,
            {
              width: modalWidth,
              height: modalHeight,
              top: Math.round((height - modalHeight) / 2),
              left: Math.round((width - modalWidth) / 2),
            },
          ]}
        >
          <FlatList
            data={units}
            keyExtractor={(item, index) => `${item.sourceType}-${item.sourceId}-${index}`}
            horizontal
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => {
              const itemKey = `${item.sourceType}-${item.sourceId}-${index}`;
              const isShowingAnswer = showingAnswerKeys.has(itemKey);
              const isBookmarked = bookmarkedKeys.has(`${item.sourceType}-${item.sourceId}`);
              const itemAnswerUrl = UNITANSWER(item.sourceType, item.sourceId);

              return (
                <View style={[styles.itemCard, { width: itemWidth }]}>
                  {/* 카드 바디 (문제 이미지 또는 해답 웹뷰) */}
                  <View style={[styles.itemBody, { height: bodyHeight }]}>
                    {isShowingAnswer ? (
                      <View style={styles.answerWrapper}>
                        <View style={[styles.answerContainer, { height: bodyHeight - 17 }]}>
                          {itemAnswerUrl ? (
                            <WebView
                              originWhitelist={['*']}
                              source={{ uri: itemAnswerUrl }}
                              style={styles.answerWebView}
                              startInLoadingState
                              nestedScrollEnabled
                              renderLoading={() => <Go3MathLoader style={styles.fullSize} />}
                            />
                          ) : null}
                        </View>
                        <View style={styles.accentBar} />
                      </View>
                    ) : (
                      <ScrollView style={styles.problemScrollView} contentContainerStyle={styles.problemScrollContent} showsVerticalScrollIndicator={false}>
                        <ImageAdjustCard imgPath={item.image} imgWidth={itemWidth} index={index}>
                          <></>
                        </ImageAdjustCard>
                      </ScrollView>
                    )}
                  </View>

                  {/* 아래 한 줄 버튼 그룹 */}
                  <View style={styles.cardButtonGroup}>
                    <GoButton title="교체" size="small" onPress={() => setCurrentSheet(item)} />
                    <View style={styles.cardButtonGroupRight}>
                      <GoButton
                        title={isBookmarked ? '책갈피됨' : '책갈피'}
                        size="small"
                        variant={isBookmarked ? 'filled' : 'outline'}
                        disabled={isBookmarked}
                        onPress={() => handleBookmark(item)}
                      />
                      <GoButton
                        title={isShowingAnswer ? '문제' : '해답'}
                        size="small"
                        variant={isShowingAnswer ? 'filled' : 'outline'}
                        onPress={() => toggleAnswer(itemKey)}
                      />
                    </View>
                  </View>
                </View>
              );
            }}
          />
          <View style={styles.buttonContainerStyle}>
            <GoButton title={'닫기'} onPress={() => setSheetListVisible(false)} />
          </View>
        </View>
      </Modal>
      <NotebookCanvasPanel
        ref={panelRef}
        loaded={() => panelRef.current?.changeNotebookBackgroundImage(currentSheet.image)}
        saveWorkout={onSave}
        saveMentorRequestShot={onMentoringRequestSave}
        screenActions={[
          canvasAction('exit', '나가기', 'chevron-back', () => (router.canGoBack() ? router.back() : router.replace('/'))),
          canvasAction('list', '목록', 'albums-outline', () => setSheetListVisible(true)),
          canvasAction('answer', '해답', 'eye-outline', handlePresentModalPress),
          canvasAction('workouts', '내 풀이', 'layers-outline', handlePresentWorkoutSheetListModalPress),
        ]}
      />
      <BottomSheetModal ref={sheetRef} handleComponent={SheetHandle}>
        <BottomSheetView>
          <View style={styles.bottomContainerStyle}>
            <View style={{ flex: 1, height: height / 2 - 64, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card }}>
              {answerUrl && (
                <WebView
                  originWhitelist={['*']}
                  source={{ uri: answerUrl }}
                  style={{ flex: 1, opacity: pageLoadProgress < 1 ? 0 : 1, width: '100%', height: '100%' }}
                  onLoadStart={() => setPageLoadProgress(0)}
                  startInLoadingState
                  nestedScrollEnabled
                  renderLoading={() => <Go3MathLoader style={{ width: '100%', height: '100%' }} />}
                  onLoadProgress={({ nativeEvent }) => setPageLoadProgress(nativeEvent.progress)}
                />
              )}
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
      <BottomSheetModal ref={workoutSheetListRef} handleComponent={SheetHandle}>
        <BottomSheetView>
          <View style={styles.workoutSheetContainerStyle}>
            <View style={{ flex: 1, height: height / 2 - 108, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card, width: width - 12 }}>
              <FlatList
                data={workoutNotes}
                keyExtractor={(_, index) => 'workout-sheet-' + index}
                horizontal
                renderItem={({ item, index }) => (
                  <View style={styles.tryContainer}>
                    <ReactNativeZoomableView maxZoom={2} minZoom={0.5} zoomStep={0.5} initialZoom={1} bindToBorders style={styles.tryImageContainer}>
                      <ImageAdjustCard imgPath={item} imgWidth={Math.ceil(width / 3 - 18)} index={index}>
                        <></>
                      </ImageAdjustCard>
                    </ReactNativeZoomableView>
                  </View>
                )}
              />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg }, // 흰 캔버스 카드가 보이도록 옅은 회색 바닥(좌우 6px 여백)
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  listContainer: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  listContent: {
    alignItems: 'flex-start',
  },
  itemCard: {
    marginRight: 16,
  },
  itemBody: {
    width: '100%',
  },
  problemScrollView: {
    width: '100%',
    height: '100%',
  },
  problemScrollContent: {
    alignItems: 'center',
  },
  answerWrapper: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  answerContainer: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
  answerWebView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  accentBar: {
    height: 9,
    backgroundColor: colors.accentSoftPress,
    width: '100%',
    marginTop: 8,
    borderRadius: radius.sm,
  },
  cardButtonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  cardButtonGroupRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fullSize: {
    width: '100%',
    height: '100%',
  },
  buttonContainerStyle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', width: '100%', height: 44, marginTop: 6 },
  bottomContainerStyle: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-end', width: '100%', height: height / 2 },
  tryContainer: { width: width / 3 + 18 },
  tryImageContainer: { alignItems: 'flex-start', justifyContent: 'flex-start', width: width / 3 + 12 },
  workoutSheetContainerStyle: { flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-end', width: '100%', height: height / 2 },
});
