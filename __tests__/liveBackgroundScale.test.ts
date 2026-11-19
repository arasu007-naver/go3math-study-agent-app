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
