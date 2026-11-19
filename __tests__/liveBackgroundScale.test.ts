import { LIVE_BG_SCALE_JS } from '../src/kit/canvas/templates/notebook-background-scale';
import liveTemplate from '../src/kit/canvas/templates/live-class-canvas-template';

const fn = new Function(`${LIVE_BG_SCALE_JS}; return liveBackgroundScale;`)() as (w?: number, h?: number) => number;

describe('liveBackgroundScale', () => {
  it('follows the mentor rule', () => {
    expect(fn(1280, 1000)).toBeCloseTo(810 / 1280);
    expect(fn(810, 1000)).toBe(1);
    expect(fn(1620, 1000)).toBe(0.5);
    expect(fn(810, 2000)).toBeCloseTo(0.72);
  });
  it('falls back for invalid width', () => {
    expect(fn(0, 1000)).toBeCloseTo(810 / 1280);
    expect(fn(undefined, undefined)).toBeCloseTo(810 / 1280);
  });
});

describe('live template', () => {
  const html: string = (liveTemplate as any)(818, 1212, 'orange', 6) ?? '';
  it('does not use the fixed scale in the background functions', () => {
    const start = html.indexOf('function changeBackgroundImage');
    const end = html.indexOf('function changeNotebookBackgroundImage');
    const seg = html.slice(start, end);
    expect(seg).not.toContain('810/1280*classScale');
    expect(seg.match(/liveBackgroundScale\(oImg\.width, oImg\.height\)/g)?.length).toBe(2);
    expect(seg.match(/10\*classScale/g)?.length).toBe(4);
  });
});

describe('live template runtime (mock fabric)', () => {
  const run = (actionType: string, imgW: number, imgH: number) => {
    const canvas: any = {
      clear: jest.fn(), renderAll: jest.fn(), setBackgroundImage: jest.fn(),
      on: jest.fn(), setDimensions: jest.fn(), getObjects: () => [],
      discardActiveObject: () => canvas, freeDrawingBrush: {}, wrapperEl: { appendChild: jest.fn() },
    };
    const fabric: any = {
      Canvas: function () { return canvas; },
      Image: { fromURL: (_u: string, cb: (o: any) => void) => cb({ width: imgW, height: imgH }) },
      util: { enlivenObjects: jest.fn(), animate: jest.fn(), ease: {} },
    };
    const html = (liveTemplate as any)(1280, 1728, 'orange', 6) as string;
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
    const body = scripts[scripts.length - 1][1];
    const posted: any[] = [];
    const rnwv = { postMessage: (m: string) => posted.push(JSON.parse(m)) };
    const win: any = { fabric, addEventListener: jest.fn(), ReactNativeWebView: rnwv };
    const doc: any = { addEventListener: jest.fn(), createElement: () => ({ style: {} }) };
    const dispatch = new Function('fabric', 'window', 'document', 'navigator', 'ReactNativeWebView',
      body + '\n;return dispatchCanvasAction;')(fabric, win, doc, { appVersion: 'iOS' }, rnwv);
    dispatch({ actionType, obj: { imageUrl: 'http://x/a.png' } });
    return { opts: canvas.setBackgroundImage.mock.calls[0][2], posted };
  };

  it.each(['BACKGROUND', 'INIT_BACKGROUND'])('%s: 810 폭 이미지는 scale=classScale, offset=9', (type) => {
    const { opts } = run(type, 810, 1000);
    expect(opts.scaleX).toBeCloseTo(0.9);
    expect(opts.scaleY).toBeCloseTo(0.9);
    expect(opts.top).toBeCloseTo(9);
    expect(opts.left).toBeCloseTo(9);
  });

  it.each(['BACKGROUND', 'INIT_BACKGROUND'])('%s: 1280 폭 이미지는 기존과 동일(0.9*810/1280)', (type) => {
    const { opts } = run(type, 1280, 1000);
    expect(opts.scaleX).toBeCloseTo((0.9 * 810) / 1280);
    expect(opts.scaleY).toBeCloseTo((0.9 * 810) / 1280);
  });
});
