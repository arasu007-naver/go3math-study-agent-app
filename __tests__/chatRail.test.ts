import { NEAR_BOTTOM, NEAR_TOP, RAIL_H, RAIL_W, nextHorizontal, railMove } from '../src/agent/tablet/ChatRail';

// RAIL_H = 세로 툴바 높이 = 가로 툴바 폭
const H = 1400;

describe('ChatRail orientation', () => {
  it('turns horizontal when the vertical rail nears the top', () => {
    expect(nextHorizontal(false, NEAR_TOP, H)).toBe(true);
    expect(nextHorizontal(false, NEAR_TOP + 1, H)).toBe(false);
  });

  it('turns horizontal when the vertical rail bottom nears the ad top', () => {
    expect(nextHorizontal(false, H - RAIL_H - NEAR_BOTTOM, H)).toBe(true);
    expect(nextHorizontal(false, H - RAIL_H - NEAR_BOTTOM - 1, H)).toBe(false);
  });

  it('turns vertical once the horizontal rail is farther than its width from the top', () => {
    expect(nextHorizontal(true, RAIL_H, H)).toBe(true);
    expect(nextHorizontal(true, RAIL_H + 1, H)).toBe(false);
  });

  it('turns vertical once the horizontal rail bottom is farther than its width from the ad top', () => {
    expect(nextHorizontal(true, H - RAIL_W - RAIL_H, H)).toBe(true);
    expect(nextHorizontal(true, H - RAIL_W - RAIL_H - 1, H)).toBe(false);
  });

  it('keeps the vertical rail vertical in the middle', () => {
    expect(nextHorizontal(false, 500, H)).toBe(false);
  });
});

describe('railMove', () => {
  const W = 1192;
  // 손가락을 한 프레임씩 옮기며 방향이 바뀌는 순간 손잡이(x, y)가 손가락 위치에서 벗어나지 않는지 본다
  const drag = (from: { left: number; top: number }, to: { left: number; top: number }, horizontal = false) => {
    let h = horizontal;
    const frames = [];
    for (let i = 0; i <= 50; i++) {
      const left = from.left + ((to.left - from.left) * i) / 50;
      const top = from.top + ((to.top - from.top) * i) / 50;
      const m = railMove(h, left, top, W, H);
      frames.push({ ...m, left, top, switched: m.horizontal !== h });
      h = m.horizontal;
    }
    return frames;
  };

  it('keeps the handle under the finger when turning horizontal near the ad', () => {
    const frames = drag({ left: 100, top: 600 }, { left: 100, top: H - RAIL_H - 10 });
    const sw = frames.find((f) => f.switched)!;
    expect(sw.horizontal).toBe(true);
    expect(sw).toMatchObject({ x: sw.left, y: sw.top });
    expect(sw.y).toBeLessThan(H - RAIL_H); // 광고 위로 통째로 내려가지 않는다
  });

  it('keeps the handle under the finger when turning back vertical', () => {
    const frames = drag({ left: 100, top: H - RAIL_W - 20 }, { left: 100, top: 500 }, true);
    const sw = frames.find((f) => f.switched)!;
    expect(sw.horizontal).toBe(false);
    expect(sw).toMatchObject({ x: sw.left, y: sw.top });
  });

  it('keeps the handle under the finger when turning horizontal near the top', () => {
    const sw = drag({ left: 300, top: 400 }, { left: 300, top: 0 }).find((f) => f.switched)!;
    expect(sw).toMatchObject({ horizontal: true, x: sw.left, y: sw.top });
  });

  it('stays vertical near the right edge instead of pushing the bar sideways', () => {
    const frames = drag({ left: W - RAIL_W - 20, top: 400 }, { left: W - RAIL_W - 20, top: 0 });
    expect(frames.every((f) => !f.horizontal)).toBe(true);
  });
});
