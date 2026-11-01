import { drawerWidth, initialMode, nextMode } from '../src/layout/deviceMode';

describe('device mode (§4.7.1)', () => {
  it('starts with a plain 600 short-side threshold', () => {
    expect(initialMode(599, 900)).toBe('phone');
    expect(initialMode(600, 900)).toBe('tablet');
    expect(initialMode(1194, 834)).toBe('tablet');
  });

  it('enters tablet at >= 600 and leaves only below 560', () => {
    expect(nextMode('phone', 600, 1000)).toBe('tablet');
    expect(nextMode('phone', 599, 1000)).toBe('phone');
    expect(nextMode('tablet', 580, 1000)).toBe('tablet'); // 560~599 keeps previous
    expect(nextMode('phone', 580, 1000)).toBe('phone');
    expect(nextMode('tablet', 559, 1000)).toBe('phone');
  });

  it('does not switch on rotation alone', () => {
    expect(nextMode('phone', 956, 440)).toBe('phone'); // Pro Max landscape
    expect(nextMode('tablet', 1194, 834)).toBe('tablet');
    expect(nextMode('phone', 960, 411)).toBe('phone'); // Fold cover landscape
  });

  it('classifies foldable states', () => {
    expect(initialMode(411, 960)).toBe('phone'); // Fold7 cover
    expect(initialMode(750, 832)).toBe('tablet'); // Fold7 main
    expect(initialMode(673, 841)).toBe('tablet'); // reference foldable
  });

  it('caps the drawer at 40% on near-square screens', () => {
    expect(drawerWidth(1194, 834)).toBeCloseTo(358.2); // iPad 11" landscape: 30%
    expect(drawerWidth(834, 1194)).toBe(300); // portrait: 30% = 250.2 → min 300
    expect(drawerWidth(884, 1104)).toBe(300); // Fold open: min 300, under the 40% cap (353.6)
    expect(drawerWidth(1366, 1024)).toBe(400); // max 400
    expect(drawerWidth(673, 841)).toBeCloseTo(269.2); // 40% wins over the 300 minimum
  });
});
