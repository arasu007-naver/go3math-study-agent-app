import { layout } from '../../ui/theme';

/** 서비스 화이트보드 기본 크기(context px) */
export const BOARD_WIDTH = 1280;
/** 스크립트 좌표계의 높이(재생 배율 계산에 사용) */
export const BOARD_HEIGHT = 1920;

export type Size = { width: number; height: number };

/**
 * 풀이 캔버스가 화면에서 차지하는 크기(CSS px).
 * 폭 = 태블릿 전체 폭 - 좌우 여백(6 × 2), 높이 = 전체 높이 - (상단 시스템 바 + 툴바 + 하단 시스템 바).
 */
export function canvasScreenSize(window: Size, insets: { top: number; bottom: number }): Size {
  return { width: window.width - layout.canvasMargin * 2, height: window.height - (insets.top + layout.toolbarH + insets.bottom) };
}

/**
 * 캔버스 context(좌표계) 크기. 폭은 항상 1280, 높이 = 화면 높이 × (1280 / 화면 폭).
 * 높이를 1920으로 고정하지 않는다. canvas 요소 크기는 정수여야 하므로 반올림한다.
 */
export function canvasContextSize(screen: Size): Size {
  return { width: BOARD_WIDTH, height: Math.round((screen.height * BOARD_WIDTH) / screen.width) };
}

/** 스크립트 재생 배율(cScale): 1280×1920 스크립트를 캔버스 안에 맞춘다(높이 기준, 폭이 넘치면 폭 기준). */
export function scriptPlayScale(canvas: Size): number {
  const s = canvas.height / BOARD_HEIGHT;
  return BOARD_WIDTH * s <= canvas.width ? s : canvas.width / BOARD_WIDTH;
}
