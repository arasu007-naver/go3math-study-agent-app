import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { SheetHandle } from '../../ui/SheetHandle';
import { colors, layout, radius, space, type } from '../../ui/theme';
import GoButton from '../ui/go-button';
import { ConceptLookupPanel } from '../concepts/ConceptLookupPanel';
import { FloatingToolbar, type FloatingAction, type FloatingTool, type ToolId } from './FloatingToolbar';
import { LandscapeNotice } from './LandscapeNotice';
import { useCanvasLandscape } from './useCanvasLandscape';

const ICON_SIZE = layout.footerIcon;
const ICONS: Record<Exclude<ToolId, 'color' | 'clearBoard'>, keyof typeof Ionicons.glyphMap> = {
  clearMemo: 'backspace-outline',
  save: 'save-outline', // 내 풀이 저장
};

const DEFAULT_TOOL_LABELS: Record<ToolId, string> = {
  color: 'Options',
  clearBoard: '전체 지우기',
  clearMemo: '내 필기 지우기',
  save: '저장',
};

/** 캔버스 도구 버튼 정의. label은 아이콘 아래 라벨 */
export function canvasTool(id: ToolId, label?: string): FloatingTool {
  const displayLabel = label ?? DEFAULT_TOOL_LABELS[id];
  if (id === 'color') return { id, label: displayLabel };
  // 보드 지우기는 필기만 지우고 문제(배경 이미지)는 남기므로 지우개. Ionicons에 지우개가 없어 MaterialCommunityIcons를 쓴다.
  if (id === 'clearBoard') return { id, label: displayLabel, icon: <MaterialCommunityIcons name="eraser" size={ICON_SIZE} color={colors.subtle} /> };
  return { id, label: displayLabel, icon: <Ionicons name={ICONS[id]} size={ICON_SIZE} color={colors.subtle} /> };
}

/** 화면 버튼(나가기·목록 등) 정의 — label은 아이콘 아래 라벨(나가기 제외) */
export function canvasAction(
  id: string,
  label: string,
  icon: keyof typeof Ionicons.glyphMap,
  onPress: () => void,
  options?: { hideLabel?: boolean }
): FloatingAction {
  return {
    id,
    label,
    onPress,
    icon: <Ionicons name={icon} size={ICON_SIZE} color={colors.subtle} />,
    hideLabel: options?.hideLabel ?? (id === 'exit'),
  };
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
  const [clearConfirmVisible, setClearConfirmVisible] = useState(false);
  const conceptSheet = useRef<BottomSheetModal>(null);
  const search = canvasAction('conceptSearch', '개념', 'search-outline', () => conceptSheet.current?.present());

  const handleSelectTool = (id: ToolId) => {
    if (id === 'clearBoard') {
      setClearConfirmVisible(true);
      return;
    }
    onSelectTool(id);
  };

  const handleConfirmClear = () => {
    setClearConfirmVisible(false);
    onSelectTool('clearBoard');
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <LandscapeNotice active={noticeActive} ping={ping} />
      <FloatingToolbar
        mode="draw"
        actions={[...(actions ?? []), search]}
        tools={tools}
        onSelectTool={handleSelectTool}
        strokeColor={strokeColor}
        restricted={restricted}
        onRestrictedPress={onRestrictedPress}
      />
      {children}
      {/* 전체 지우기 확인 모달 */}
      <Modal
        visible={clearConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setClearConfirmVisible(false)}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setClearConfirmVisible(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>전체 지우기</Text>
            <Text style={styles.dialogMessage}>'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?</Text>
            <View style={styles.dialogActions}>
              <GoButton
                title="취소"
                variant="outline"
                size="small"
                onPress={() => setClearConfirmVisible(false)}
              />
              <GoButton
                title="확인"
                variant="filled"
                size="small"
                onPress={handleConfirmClear}
              />
            </View>
          </View>
        </View>
      </Modal>
      {/* 시트 안 스크롤(칩 목록)이 시트 끌기와 다투지 않게 끌기는 손잡이로만 */}
      <BottomSheetModal ref={conceptSheet} snapPoints={CONCEPT_SHEET_SNAPS} enableDynamicSizing={false} enableContentPanningGesture={false} handleComponent={SheetHandle}>
        <BottomSheetView style={styles.sheet}>
          <ConceptLookupPanel />
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: colors.scrim,
    alignItems: 'center',
    justifyContent: 'center',
    padding: space.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space.xl,
    gap: space.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  dialogTitle: {
    ...type.title,
    color: colors.text,
  },
  dialogMessage: {
    ...type.body,
    color: colors.subtle,
    lineHeight: 22,
  },
  dialogActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: space.xs,
  },
});
