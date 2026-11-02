import { NOTEBOOK_BG_MAX_HEIGHT, NOTEBOOK_BG_SCALE_JS } from '../src/kit/canvas/templates/notebook-background-scale';
import classCanvasTemplate from '../src/kit/canvas/templates/whiteboard-canvas-template';

// 템플릿 안에서 쓰는 것과 같은 소스를 실행한다
const scaleOf = new Function(`${NOTEBOOK_BG_SCALE_JS}; return notebookBackgroundScale;`)() as (cw: number, w: number, h: number) => number;

describe('notebook background scale', () => {
  it('keeps the width-based scale (half the canvas width) for normal images', () => {
    const s = scaleOf(1024, 800, 600); // → width 512, height 384
    expect(s).toBeCloseTo(1024 / 1600);
    expect(600 * s).toBeLessThanOrEqual(NOTEBOOK_BG_MAX_HEIGHT);
  });

  it('switches to a height-based scale when the scaled height would exceed 1440', () => {
    const s = scaleOf(1024, 800, 4000); // width rule → height 2560
    expect(4000 * s).toBeCloseTo(NOTEBOOK_BG_MAX_HEIGHT);
    expect(800 * s).toBeLessThan(1024 / 2);
  });

  it('leaves an image whose scaled height is exactly 1440 on the width rule', () => {
    const s = scaleOf(1000, 500, 1440); // width rule → height 1440
    expect(s).toBeCloseTo(1);
  });

  it('is embedded in the solve canvas template', () => {
    const html = classCanvasTemplate(1024, 1270);
    expect(html).toContain('function notebookBackgroundScale(');
    expect(html).toContain('notebookBackgroundScale(canvasWidth, oImg.width, oImg.height)');
  });
});
