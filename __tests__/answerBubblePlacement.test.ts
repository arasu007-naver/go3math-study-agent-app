import { placeAnswerBubble } from '../src/kit/problem-list/answerBubblePlacement';

const container = { width: 900, height: 700 };

describe('placeAnswerBubble', () => {
  it('2열 왼쪽 문항: 오른쪽에 뜨고 말꼬리는 왼쪽(문항 쪽)', () => {
    const card = { x: 12, y: 100, width: 426, height: 300 };
    const p = placeAnswerBubble(card, container, true);
    expect(p.tailSide).toBe('left');
    expect(p.left).toBeGreaterThanOrEqual(card.x + card.width);
    expect(p.left + p.width).toBeLessThanOrEqual(container.width);
    // 말꼬리가 문항 세로 중앙을 가리킨다
    expect(p.top + p.tailOffset).toBe(250);
  });

  it('2열 오른쪽 문항: 왼쪽에 뜨고 말꼬리는 오른쪽', () => {
    const card = { x: 450, y: 100, width: 426, height: 300 };
    const p = placeAnswerBubble(card, container, true);
    expect(p.tailSide).toBe('right');
    expect(p.left).toBeGreaterThanOrEqual(0);
    expect(p.left + p.width).toBeLessThanOrEqual(card.x);
  });

  it('2열: 문항이 화면 아래쪽이어도 말풍선은 화면 안, 말꼬리는 말풍선 안', () => {
    const card = { x: 12, y: 600, width: 426, height: 300 };
    const p = placeAnswerBubble(card, container, true);
    expect(p.top + p.height).toBeLessThanOrEqual(container.height);
    expect(p.tailOffset).toBeLessThan(p.height);
    expect(p.tailOffset).toBeGreaterThan(0);
  });

  it('1열 위쪽 문항: 아래에 뜨고 말꼬리는 위', () => {
    const narrow = { width: 400, height: 800 };
    const card = { x: 12, y: 60, width: 376, height: 200 };
    const p = placeAnswerBubble(card, narrow, false);
    expect(p.tailSide).toBe('top');
    expect(p.top).toBeGreaterThanOrEqual(card.y + card.height);
    expect(p.top + p.height).toBeLessThanOrEqual(narrow.height);
    expect(p.left + p.tailOffset).toBe(200);
  });

  it('1열 아래쪽 문항: 위에 뜨고 말꼬리는 아래', () => {
    const narrow = { width: 400, height: 800 };
    const card = { x: 12, y: 560, width: 376, height: 200 };
    const p = placeAnswerBubble(card, narrow, false);
    expect(p.tailSide).toBe('bottom');
    expect(p.top).toBeGreaterThanOrEqual(0);
    expect(p.top + p.height).toBeLessThanOrEqual(card.y);
  });
});
