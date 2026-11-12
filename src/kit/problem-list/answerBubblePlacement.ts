/**
 * 해답 말풍선 자리 — 문항 카드가 패널 안 어디에 있는지에 따라 말풍선을 문항 옆(2열) 또는 위·아래(1열)에 놓는다.
 * 말풍선이 문항을 가리지 않도록 빈 쪽에 맞춰 크기를 줄이고, 말꼬리는 문항 중앙을 향한다.
 * 좌표는 모두 패널(root) 기준.
 */
export type Rect = { x: number; y: number; width: number; height: number };

export type BubblePlacement = {
  left: number;
  top: number;
  width: number;
  height: number;
  /** 말꼬리가 붙는 말풍선의 변(= 문항이 있는 쪽) */
  tailSide: 'left' | 'right' | 'top' | 'bottom';
  /** 그 변을 따라 말꼬리 중심까지의 거리(left/right면 위에서, top/bottom이면 왼쪽에서) */
  tailOffset: number;
};

export const BUBBLE_TAIL = 10;
const MARGIN = 8;
const MAX_W = 480;
const MAX_H = 420;
const MIN_H = 160;
/** 말꼬리가 말풍선 둥근 모서리에 걸리지 않게 두는 여유 */
const TAIL_INSET = 20;

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));

export function placeAnswerBubble(card: Rect, container: { width: number; height: number }, twoCol: boolean): BubblePlacement {
  const centerX = card.x + card.width / 2;
  const centerY = card.y + card.height / 2;

  if (twoCol) {
    const spaceRight = container.width - (card.x + card.width);
    const onRight = spaceRight >= card.x;
    const width = Math.min(MAX_W, (onRight ? spaceRight : card.x) - BUBBLE_TAIL - MARGIN);
    const height = Math.min(MAX_H, container.height - 2 * MARGIN);
    const left = onRight ? card.x + card.width + BUBBLE_TAIL : card.x - BUBBLE_TAIL - width;
    const top = clamp(centerY - height / 2, MARGIN, container.height - MARGIN - height);
    return { left, top, width, height, tailSide: onRight ? 'left' : 'right', tailOffset: clamp(centerY - top, TAIL_INSET, height - TAIL_INSET) };
  }

  const spaceBelow = container.height - (card.y + card.height);
  const below = spaceBelow >= card.y;
  const width = Math.min(MAX_W, container.width - 2 * MARGIN);
  const height = Math.max(MIN_H, Math.min(MAX_H, (below ? spaceBelow : card.y) - BUBBLE_TAIL - MARGIN));
  const left = clamp(centerX - width / 2, MARGIN, container.width - MARGIN - width);
  const top = clamp(below ? card.y + card.height + BUBBLE_TAIL : card.y - BUBBLE_TAIL - height, MARGIN, container.height - MARGIN - height);
  return { left, top, width, height, tailSide: below ? 'top' : 'bottom', tailOffset: clamp(centerX - left, TAIL_INSET, width - TAIL_INSET) };
}
