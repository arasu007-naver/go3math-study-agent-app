import liveClassCanvasTemplate from '../src/kit/canvas/templates/live-class-canvas-template';
import classCanvasTemplate from '../src/kit/canvas/templates/whiteboard-canvas-template';
import * as base from '../src/kit/canvas/templates/canvas-template-base';
const buildCanvasTemplate = (base as any).buildCanvasTemplate;

// '전체 지우기'(CLEAN_BOARD → resetCanvas)와 SNAPSHOT은 지우기 전 판서를 이미지로 떠서 풀이로 올린다.
// 배율이 1920/classScale(수천 배)이면 캔버스 한도를 넘어 toDataURL이 빈 "data:,"를 돌려주고 0바이트 풀이가 저장됐다.
describe('live class canvas template snapshot scale', () => {
  const html = liveClassCanvasTemplate(818, 1212, 'orange', 6);
  const body = (name: string) => html.slice(html.indexOf(`function ${name}(`)).split('\n').slice(0, 8).join('\n');

  it('resetCanvas and uploadSnapshot scale the board to the 1280 reference width', () => {
    for (const name of ['resetCanvas', 'uploadSnapshot']) {
      expect(body(name)).toContain('multiplier: 1280/canvasWidth');
      expect(body(name)).not.toContain('multiplier: 1/classScale');
    }
    expect(html).not.toContain('1920/classScale');
  });

  it('uses 1280-width classScale and CSS-only scaling when a css size is given', () => {
    const h = liveClassCanvasTemplate(1280, 1900, 'orange', 6, 788, 1170);
    expect(h).toContain("<canvas id='canvas' width='1280' height='1900'");
    expect(h).toContain(`var classScale = ${1900 / 1920};`);
    expect(liveClassCanvasTemplate(1280, 2560, 'orange', 6)).toContain('var classScale = 1;');
    expect(h).toContain('enableRetinaScaling: false');
    expect(h).toContain("canvas.setDimensions({ width: '788px', height: '1170px' }, { cssOnly: true });");
    expect(h).not.toMatch(/classScale = \d+\/1920/);
  });

  it('script play paths keep * classScale, boardScale stays width-based', () => {
    const h = liveClassCanvasTemplate(1280, 1900, 'orange', 6, 788, 1170);
    const fnBody = (marker: string) => {
      const i = h.indexOf(marker);
      expect(i).toBeGreaterThan(-1);
      return h.slice(i, i + 4000);
    };
    for (const m of ['function addObjToCanvas(', 'showSyncMembers = (', 'function syncCanvasObjects(', 'async function importObjectFromClipboard(', 'function showEpilogues(']) {
      expect(fnBody(m)).toContain('* classScale');
    }
    expect(h).toMatch(/var boardScale = 1280\/1280/);
    expect(h).not.toMatch(/classScale = [\d.]+\/1280/);
    expect(h).not.toContain('classScale = 1280/1280');
  });

  it('has no setDimensions without css size', () => {
    const h = liveClassCanvasTemplate(1280, 1900, 'orange', 6);
    expect(h).toContain('enableRetinaScaling: true');
    expect(h).not.toContain('setDimensions');
  });

  it('removes vertical whitespace', () => {
    for (const h of [html, classCanvasTemplate(1280, 1900), buildCanvasTemplate({ width: 1280, height: 1900, scriptBody: '' })]) {
      expect(h).toContain('html, body { margin: 0; padding: 0; overflow: hidden; }');
      expect(h).toContain('canvas { display: block; margin: 0; padding: 0; }');
      expect(h).toContain('.canvas-container { margin: 0 !important; padding: 0 !important; }');
    }
  });
});
