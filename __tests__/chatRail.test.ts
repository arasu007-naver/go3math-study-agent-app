import { NEAR_BOTTOM, NEAR_TOP, RAIL_H, RAIL_W, nextHorizontal } from '../src/agent/tablet/ChatRail';

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
