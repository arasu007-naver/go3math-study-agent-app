import { layout } from '../../ui/theme';

/** 서비스 화이트보드 기본 크기(context px) */
export const BOARD_WIDTH = 1280;
export const BOARD_HEIGHT = 1920;

export type Size = { width: number; height: number };

/**
 * 풀이 캔버스가 화면에서 차지하는 크기(CSS px).
 * 폭 = 태블릿 전체 폭 - 6, 높이 = 전체 높이 - (상단 시스템 바 + 툴바 + 하단 시스템 바).
 */
export function canvasScreenSize(window: Size, insets: { top: number; bottom: number }): Size {
  return { width: window.width - 6, height: window.height - (insets.top + layout.toolbarH + insets.bottom) };
}

/**
 * 캔버스 context(좌표계) 크기. 화면 비율에 맞춰 1280×1920 기준 중 한 변을 고정해 모든 사용자가 같은 기준으로 본다.
 * - 화면이 기준보다 넓거나 같으면(폭/높이 >= 1280/1920): 높이 1920, 폭 = 화면 폭 × (1920 / 화면 높이)
 * - 더 좁으면: 폭 1280, 높이 = 1280 / 화면 폭 × 화면 높이
 * canvas 요소 크기는 정수여야 하므로 반올림한다.
 */
export function canvasContextSize(screen: Size): Size {
  if (screen.width / screen.height >= BOARD_WIDTH / BOARD_HEIGHT) {
    return { width: Math.round(screen.width * (BOARD_HEIGHT / screen.height)), height: BOARD_HEIGHT };
  }
  return { width: BOARD_WIDTH, height: Math.round((BOARD_WIDTH / screen.width) * screen.height) };
}
