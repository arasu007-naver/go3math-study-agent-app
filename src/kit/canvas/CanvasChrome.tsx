import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, layout } from '../../ui/theme';
import { FloatingToolbar, type FloatingTool, type ToolId } from './FloatingToolbar';
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

/**
 * 캔버스 화면 위 오버레이(design-spec P2-1·P2-5): 하단 가운데 FloatingToolbar, 가로 모드 안내 배너, 펜 속성 팝오버(children).
 * 캔버스 컨테이너를 가득 덮는 box-none View라 그 크기로 가로 여부를 재고, 버튼·배너·팝오버 밖의 터치는 캔버스로 간다.
 */
export function CanvasChrome({
  tools,
  onSelectTool,
  strokeColor,
  children,
}: {
  tools: FloatingTool[];
  onSelectTool(id: ToolId): void;
  strokeColor?: string;
  children?: ReactNode;
}) {
  const { onLayout, restricted, noticeActive, ping, onRestrictedPress } = useCanvasLandscape();
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill} onLayout={onLayout}>
      <LandscapeNotice active={noticeActive} ping={ping} />
      <FloatingToolbar
        mode="draw"
        tools={tools}
        onSelectTool={onSelectTool}
        strokeColor={strokeColor}
        restricted={restricted}
        onRestrictedPress={onRestrictedPress}
      />
      {children}
    </View>
  );
}
