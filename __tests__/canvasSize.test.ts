import { BOARD_HEIGHT, BOARD_WIDTH, canvasContextSize, canvasScreenSize } from '../src/kit/canvas/canvasSize';
import classCanvasTemplate from '../src/kit/canvas/templates/whiteboard-canvas-template';
import { layout } from '../src/ui/theme';

describe('solve canvas size', () => {
  it('screen = full width - 6px margins on both sides, full height - (top bar + toolbar + bottom bar)', () => {
    expect(canvasScreenSize({ width: 1024, height: 1366 }, { top: 24, bottom: 20 })).toEqual({ width: 1024 - 12, height: 1366 - 24 - layout.toolbarH - 20 });
  });

  it('context width is always 1280, height = screen height × 1280 / screen width', () => {
    expect(canvasContextSize({ width: 1018, height: 1270 })).toEqual({ width: 1280, height: Math.round((1270 * 1280) / 1018) });
    expect(canvasContextSize({ width: 640, height: 960 })).toEqual({ width: BOARD_WIDTH, height: BOARD_HEIGHT });
    expect(canvasContextSize({ width: 600, height: 1200 })).toEqual({ width: 1280, height: 2560 });
  });

  it('template uses the context size for the canvas and the screen size for CSS', () => {
    const html = classCanvasTemplate(1539, 1920, 1018, 1270);
    expect(html).toContain("<canvas id='canvas' width='1539' height='1920'");
    expect(html).toContain("canvas.setDimensions({ width: '1018px', height: '1270px' }, { cssOnly: true });");
    expect(html).toContain('enableRetinaScaling: false');
    expect(html).toContain('multiplier: 1280/1539'); // 저장 이미지는 폭 1280 기준 그대로
  });
});
