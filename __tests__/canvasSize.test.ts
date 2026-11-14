import { BOARD_HEIGHT, BOARD_WIDTH, canvasContextSize, canvasScreenSize } from '../src/kit/canvas/canvasSize';
import classCanvasTemplate from '../src/kit/canvas/templates/whiteboard-canvas-template';
import { layout } from '../src/ui/theme';

describe('solve canvas size', () => {
  it('screen = full width - 6px margins on both sides, full height - (top bar + toolbar + bottom bar)', () => {
    expect(canvasScreenSize({ width: 1024, height: 1366 }, { top: 24, bottom: 20 })).toEqual({ width: 1024 - 12, height: 1366 - 24 - layout.toolbarH - 20 });
  });

  it('wider than 1280:1920 → context height 1920, width scaled by 1920/screen height', () => {
    const ctx = canvasContextSize({ width: 1018, height: 1270 }); // iPad 12.9" portrait
    expect(ctx.height).toBe(BOARD_HEIGHT);
    expect(ctx.width).toBe(Math.round(1018 * (1920 / 1270)));
  });

  it('exactly 1280:1920 → 1280×1920', () => {
    expect(canvasContextSize({ width: 640, height: 960 })).toEqual({ width: BOARD_WIDTH, height: BOARD_HEIGHT });
  });

  it('narrower than 1280:1920 → context width 1280, height = 1280 / screen width × screen height', () => {
    const ctx = canvasContextSize({ width: 600, height: 1200 });
    expect(ctx.width).toBe(BOARD_WIDTH);
    expect(ctx.height).toBe(Math.round((1280 / 600) * 1200));
  });

  it('template uses the context size for the canvas and the screen size for CSS', () => {
    const html = classCanvasTemplate(1539, 1920, 1018, 1270);
    expect(html).toContain("<canvas id='canvas' width='1539' height='1920'");
    expect(html).toContain("canvas.setDimensions({ width: '1018px', height: '1270px' }, { cssOnly: true });");
    expect(html).toContain('enableRetinaScaling: false');
    expect(html).toContain('multiplier: 1280/1539'); // 저장 이미지는 폭 1280 기준 그대로
  });
});
