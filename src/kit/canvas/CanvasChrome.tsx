import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog } from '../../ui/Dialog';
import { colors, layout } from '../../ui/theme';
import {
  FloatingToolbar,
  type FloatingAction,
  type FloatingTool,
  type ToolId,
} from './FloatingToolbar';
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

/**
 * 캔버스 화면 위 오버레이(design-spec P2-1·P2-5): 하단 가운데 FloatingToolbar, 가로 모드 안내 배너, 펜 속성 팝오버(children).
 * 캔버스 컨테이너를 가득 덮는 box-none View라 그 크기로 가로 여부를 재고, 버튼·배너·팝오버 밖의 터치는 캔버스로 간다.
 * 개념 조회는 각 화면의 '개념·해답' 시트(CanvasStudySheet)가 맡는다.
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
        actions={actions ?? []}
        tools={tools}
        onSelectTool={handleSelectTool}
        strokeColor={strokeColor}
        restricted={restricted}
        onRestrictedPress={onRestrictedPress}
      />
      {children}
      {/* 전체 지우기 확인 모달 */}
      <Dialog
        visible={clearConfirmVisible}
        title="전체 지우기"
        message="'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?"
        onDismiss={() => setClearConfirmVisible(false)}
        cancel={{}}
        confirm={{ title: '확인', variant: 'danger', onPress: handleConfirmClear }}
      />
    </View>
  );
}
