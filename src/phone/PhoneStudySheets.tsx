/**
 * 폰 문제 목록 화면의 bottom modal 둘 — 해답(눈 버튼)과 개념 조회(오른쪽 아래 FAB).
 * 폰에는 캔버스가 없어 캔버스 '개념·해답' 시트(CanvasStudySheet)가 하던 일을 목록 화면 위에서 한다
 * (docs/superpowers/specs/2026-11-15-phone-concept-answer-sheet-design.md).
 */
import { Ionicons } from '@expo/vector-icons';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { MathConcept } from '@qoolla/script-parser';
import { useEffect, useRef, useState, type ReactElement, type ReactNode, type RefObject } from 'react';
import { BackHandler, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UNITANSWER } from '../config/api.constants';
import { ConceptLookupPanel } from '../kit/concepts/ConceptLookupPanel';
import QoollaWebView from '../kit/ui/web-view';
import { pickedConceptsStore } from '../state/concepts';
import { SheetHandle } from '../ui/SheetHandle';
import { colors, radius, shadow, space } from '../ui/theme';

const ANSWER_SNAPS = ['50%', '70%', '90%'];
const CONCEPT_SNAPS = ['70%', '90%'];

/** 시트 안 스크롤(WebView·칩 목록)이 시트 끌기와 다투지 않게 끌기는 손잡이로만. Android 뒤로 가기는 시트만 닫는다 */
function PhoneSheet({ sheetRef, snapPoints, children }: { sheetRef: RefObject<BottomSheetModal | null>; snapPoints: string[]; children: ReactNode }) {
  const { bottom } = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      sheetRef.current?.dismiss();
      return true;
    });
    return () => sub.remove();
  }, [open, sheetRef]);
  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={1}
      onChange={(index) => setOpen(index >= 0)}
      onDismiss={() => setOpen(false)}
      enableDynamicSizing={false}
      enableContentPanningGesture={false}
      handleComponent={SheetHandle}
    >
      {/* BottomSheetView는 내용 높이만큼만 커져 높이 없는 WebView가 0이 된다 — 시트를 채우는 flex View */}
      <View style={[styles.body, { paddingBottom: bottom }]}>{children}</View>
    </BottomSheetModal>
  );
}

/** 해답 bottom modal. show(문제)로 열고, sheet를 화면에 그려 둔다 */
export function useAnswerSheet(): { show(problem: { sourceType: string; sourceId: number | string }): void; sheet: ReactElement } {
  const ref = useRef<BottomSheetModal>(null);
  const [url, setUrl] = useState<string>();
  return {
    show(problem) {
      setUrl(UNITANSWER(problem.sourceType, problem.sourceId) ?? undefined);
      ref.current?.present();
    },
    sheet: (
      <PhoneSheet sheetRef={ref} snapPoints={ANSWER_SNAPS}>
        {!!url && <QoollaWebView key={url} originWhitelist={['*']} source={{ uri: url }} />}
      </PhoneSheet>
    ),
  };
}

/** 개념 조회 FAB + bottom modal. 이번에 새로 고른 개념을 onAdded로 알린다(학습장 활동 기록) */
export function ConceptLookup({ onAdded }: { onAdded(concepts: MathConcept[]): void }) {
  const ref = useRef<BottomSheetModal>(null);
  // 고른 개념은 공용 store에 둔다 — 시트를 닫아도 남고, 캔버스·검색 dock과 같이 쓴다
  const picked = pickedConceptsStore.useStore();
  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="개념 조회" onPress={() => ref.current?.present()} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
        <Ionicons name="book-outline" size={28} color={colors.onAccent} />
      </Pressable>
      <PhoneSheet sheetRef={ref} snapPoints={CONCEPT_SNAPS}>
        <ConceptLookupPanel
          picked={picked}
          onPickedChange={(next) => {
            const added = next.filter((c) => !picked.some((p) => p.id === c.id));
            if (added.length) onAdded(added);
            pickedConceptsStore.dispatch(next);
          }}
        />
      </PhoneSheet>
    </>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  // 연필 FAB(PencilFab)와 같은 자리·모양 — 폰은 연필 FAB를 쓰지 않는다
  fab: {
    position: 'absolute',
    right: space.xl,
    bottom: space.xl,
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
  fabPressed: { backgroundColor: colors.accentPress },
});
