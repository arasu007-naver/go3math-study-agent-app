import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useState, type ReactNode, type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '../../ui/Chip';
import { SheetHandle } from '../../ui/SheetHandle';
import { space } from '../../ui/theme';
import { ConceptLookupPanel } from '../concepts/ConceptLookupPanel';
import { CANVAS_SHEET_SNAPS, useCanvasSheetBottomInset } from './FloatingToolbar';

type Tab = 'concept' | 'answer';

/**
 * 캔버스 '개념·해답' bottom sheet(docs/superpowers/specs/2026-11-12-canvas-concept-answer-sheet-design.md).
 * 위 탭 칩으로 개념 조회와 화면이 넘긴 해답 내용을 오간다. 마지막 탭을 기억하고(처음엔 해답), 해답은 50%·개념은 70%로 연다.
 * 두 탭은 둘 다 마운트해 두고 숨기기만 한다 — 해답 WebView를 다시 불러오지 않고, 고른 개념도 남는다.
 */
export function CanvasStudySheet({
  sheetRef,
  answerLabel,
  answer,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  /** 해답 탭 라벨 — '해답' 또는 '답안 예시' */
  answerLabel: string;
  answer: ReactNode;
}) {
  const [tab, setTab] = useState<Tab>('answer');
  // 여는 높이는 닫힐 때만 정한다 — index prop이 열린 동안 바뀌면 시트가 움직인다(실기기 확인)
  const [openIndex, setOpenIndex] = useState(0);
  const bottomInset = useCanvasSheetBottomInset();

  return (
    // 시트 안 스크롤이 시트 끌기와 다투지 않게 끌기는 손잡이로만
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={CANVAS_SHEET_SNAPS}
      index={openIndex}
      onDismiss={() => setOpenIndex(tab === 'concept' ? 1 : 0)}
      bottomInset={bottomInset}
      enableDynamicSizing={false}
      enableContentPanningGesture={false}
      handleComponent={SheetHandle}
    >
      {/* BottomSheetView는 내용 높이만큼만 커져 높이 없는 WebView가 0이 된다 — 시트를 채우는 flex View */}
      <View style={styles.body}>
        <View style={styles.tabs}>
          <Chip label="개념" accessibilityRole="tab" selected={tab === 'concept'} onPress={() => setTab('concept')} />
          <Chip label={answerLabel} accessibilityRole="tab" selected={tab === 'answer'} onPress={() => setTab('answer')} />
        </View>
        <View testID="study-tab-concept" style={[styles.body, tab !== 'concept' && styles.hidden]}>
          <ConceptLookupPanel />
        </View>
        <View testID="study-tab-answer" style={[styles.body, tab !== 'answer' && styles.hidden]}>
          {answer}
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1 },
  tabs: { flexDirection: 'row', gap: space.sm, paddingHorizontal: space.md, paddingBottom: space.sm },
  hidden: { display: 'none' },
});
