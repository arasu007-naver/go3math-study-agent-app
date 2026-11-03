import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useRef, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, layout } from '../../ui/theme';
import { ConceptLookupPanel } from '../concepts/ConceptLookupPanel';
import { FloatingToolbar, type FloatingAction, type FloatingTool, type ToolId } from './FloatingToolbar';
import { LandscapeNotice } from './LandscapeNotice';
import { useCanvasLandscape } from './useCanvasLandscape';

const ICON_SIZE = layout.footerIcon;
const ICONS: Record<Exclude<ToolId, 'color'>, keyof typeof Ionicons.glyphMap> = {
  clearBoard: 'trash-outline',
  clearMemo: 'backspace-outline',
  save: 'save-outline',
};

/** 캔버스 도구 버튼 정의. label은 기존 GoButton 제목 그대로 쓴다. */
export function canvasTool(id: ToolId, label: string): FloatingTool {
  return { id, label, icon: id === 'color' ? undefined : <Ionicons name={ICONS[id]} size={ICON_SIZE} color={colors.subtle} /> };
}

/** 화면 버튼(나가기·목록 등) 정의 — 아이콘만 보이고 label은 스크린리더용 */
export function canvasAction(id: string, label: string, icon: keyof typeof Ionicons.glyphMap, onPress: () => void): FloatingAction {
  return { id, label, onPress, icon: <Ionicons name={icon} size={ICON_SIZE} color={colors.subtle} /> };
}

// 개념 검색 bottom sheet 높이. 내용(과목·단원·개념 칩)이 flex라 동적 크기 대신 고정 비율로 연다
const CONCEPT_SHEET_SNAPS = ['70%'];

/**
 * 캔버스 화면 위 오버레이(design-spec P2-1·P2-5): 하단 가운데 FloatingToolbar, 가로 모드 안내 배너, 펜 속성 팝오버(children).
 * 캔버스 컨테이너를 가득 덮는 box-none View라 그 크기로 가로 여부를 재고, 버튼·배너·팝오버 밖의 터치는 캔버스로 간다.
 * 툴바 화면 버튼 맨 끝의 검색 버튼은 개념 검색 패널(ConceptLookupPanel)을 bottom sheet로 연다.
 */
export function CanvasChrome({
  actions,
  tools,
  onSelectTool,
  strokeColor,
  children,
}: {
  /** 화면 버튼 — 툴바 왼쪽, 그리기 도구 앞 */
  actions?: FloatingAction[];
  tools: FloatingTool[];
  onSelectTool(id: ToolId): void;
  strokeColor?: string;
  children?: ReactNode;
}) {
  const { onLayout, restricted, noticeActive, ping, onRestrictedPress } = useCanvasLandscape();
  const conceptSheet = useRef<BottomSheetModal>(null);
  const search = canvasAction('conceptSearch', '개념 검색', 'search-outline', () => conceptSheet.current?.present());
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <LandscapeNotice active={noticeActive} ping={ping} />
      <FloatingToolbar
        mode="draw"
        actions={[...(actions ?? []), search]}
        tools={tools}
        onSelectTool={onSelectTool}
        strokeColor={strokeColor}
        restricted={restricted}
        onRestrictedPress={onRestrictedPress}
      />
      {children}
      {/* 시트 안 스크롤(칩 목록)이 시트 끌기와 다투지 않게 끌기는 손잡이로만 */}
      <BottomSheetModal ref={conceptSheet} snapPoints={CONCEPT_SHEET_SNAPS} enableDynamicSizing={false} enableContentPanningGesture={false}>
        <BottomSheetView style={styles.sheet}>
          <ConceptLookupPanel />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
});
