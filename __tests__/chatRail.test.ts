import { isHorizontalAt } from '../src/agent/tablet/ChatRail';

describe('ChatRail orientation', () => {
  const H = 600;

  it('is horizontal within the top and bottom sixth of the screen', () => {
    expect(isHorizontalAt(0, H)).toBe(true);
    expect(isHorizontalAt(99, H)).toBe(true);
    expect(isHorizontalAt(501, H)).toBe(true);
    expect(isHorizontalAt(600, H)).toBe(true);
  });

  it('is vertical elsewhere, including the boundaries', () => {
    expect(isHorizontalAt(100, H)).toBe(false);
    expect(isHorizontalAt(300, H)).toBe(false);
    expect(isHorizontalAt(500, H)).toBe(false);
  });
});
