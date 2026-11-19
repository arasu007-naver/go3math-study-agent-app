import liveClassCanvasTemplate from '../src/kit/canvas/templates/live-class-canvas-template';

type Obj = any;
const setup = () => {
  const objects: Obj[] = [];
  const posted: any[] = [];
  const pending: Array<() => void> = [];
  const state = { delay: false, throwDataUrl: false };
  const mkObj = (raw: any): Obj => ({
    ...raw,
    animate: jest.fn(),
    bringToFront: jest.fn(),
    moveTo: jest.fn(),
  });
  const canvas: any = {
    add: (o: Obj) => { objects.push(o); },
    remove: (o: Obj) => { const i = objects.indexOf(o); if (i >= 0) objects.splice(i, 1); },
    getObjects: () => objects.slice(),
    toDataURL: () => { if (state.throwDataUrl) throw new Error('tainted'); return 'data:img'; },
    renderAll: jest.fn(),
    requestRenderAll: jest.fn(),
    clear: () => { objects.length = 0; },
    setBackgroundImage: jest.fn(),
    on: jest.fn(),
    setDimensions: jest.fn(),
    discardActiveObject: () => canvas,
    freeDrawingBrush: {},
    wrapperEl: { appendChild: jest.fn() },
  };
  const fabric: any = {
    Canvas: function () { return canvas; },
    Image: { fromURL: jest.fn() },
    util: {
      enlivenObjects: (raws: any[], cb: (o: Obj[]) => void) => {
        const run = () => cb(raws.map(mkObj));
        if (state.delay) pending.push(run); else run();
      },
      animate: jest.fn(),
      ease: {},
    },
  };
  const html = liveClassCanvasTemplate(1280, 1900, 'orange', 6);
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  const body = scripts[scripts.length - 1][1];
  const rnwv = { postMessage: (m: string) => posted.push(JSON.parse(m)) };
  const win: any = { fabric, addEventListener: jest.fn(), ReactNativeWebView: rnwv };
  const doc: any = { addEventListener: jest.fn(), createElement: () => ({ style: {} }) };
  const dispatch = new Function(
    'fabric', 'window', 'document', 'navigator', 'ReactNativeWebView',
    body + '\n;return dispatchCanvasAction;',
  )(fabric, win, doc, { appVersion: 'iOS' }, rnwv);
  const ids = () => objects.map((o) => o.id);
  const flushEnliven = () => { while (pending.length) pending.shift()!(); };
  return { dispatch, ids, posted, state, flushEnliven, objects };
};
const add = (id: string, actionType = 'ADD') => ({ actionType, obj: { id, scaleX: 1, scaleY: 1, left: 0, top: 0 } });

describe('live class template reset ordering', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('ADD a → CLEAN → ADD c 는 c만 남긴다', () => {
    const t = setup();
    t.dispatch(add('a')); t.dispatch({ actionType: 'CLEAN' }); t.dispatch(add('c'));
    jest.runAllTimers();
    expect(t.ids()).toEqual(['c']);
  });

  it('enliven 지연된 ADD는 CLEAN 뒤에 추가되지 않는다', () => {
    const t = setup();
    t.state.delay = true;
    t.dispatch(add('a'));
    jest.advanceTimersByTime(20);
    t.dispatch({ actionType: 'CLEAN' });
    t.flushEnliven(); jest.runAllTimers(); t.flushEnliven(); jest.runAllTimers();
    expect(t.ids()).not.toContain('a');
  });

  it('showSyncMembers 이전 CLEAN이면 a와 sync 모두 없다', () => {
    const t = setup();
    t.dispatch({ actionType: 'SYNCS', content: [{ id: 'sync:a:1', obj: { id: 'sync:a:1', left: 0, top: 0, scaleX: 1, scaleY: 1 } }] });
    t.dispatch(add('a'));
    jest.advanceTimersByTime(200);
    t.dispatch({ actionType: 'CLEAN' });
    jest.runAllTimers();
    expect(t.ids()).toEqual([]);
  });

  it('여러 리셋이 섞여도 마지막 리셋 뒤 객체만 남는다', () => {
    const t = setup();
    ['a', 'CLEAN', 'b', 'CLEAR', 'c', 'CLEAN_SCENE', 'd', 'e'].forEach((x) =>
      t.dispatch(x === x.toUpperCase() ? { actionType: x } : add(x)));
    jest.runAllTimers();
    expect(t.ids()).toEqual(['d', 'e']);
  });

  it('backgroundSubs는 CLEAN에서 유지된다', () => {
    const t = setup();
    t.dispatch({ actionType: 'BACKGROUND_SUBS', obj: ['paper'] });
    t.dispatch(add('paper')); t.dispatch(add('a'));
    jest.runAllTimers();
    t.dispatch({ actionType: 'CLEAN' });
    jest.runAllTimers();
    expect(t.ids()).toEqual(['paper']);
  });

  it('CLEAN은 동기로 지우고 SAVE를 보낸다', () => {
    const t = setup();
    t.dispatch(add('a'));
    jest.runAllTimers();
    expect(t.ids()).toEqual(['a']);
    t.dispatch({ actionType: 'CLEAN' });
    expect(t.ids()).toEqual([]);
    expect(t.posted.some((p) => p.contentMeta === 'SAVE')).toBe(true);
  });

  it('toDataURL이 던져도 CLEAN은 객체를 지운다', () => {
    const t = setup();
    t.dispatch(add('a'));
    jest.runAllTimers();
    t.state.throwDataUrl = true;
    expect(() => t.dispatch({ actionType: 'CLEAN' })).not.toThrow();
    expect(t.ids()).toEqual([]);
  });

  const lateKinds = () => {
    const t = setup();
    t.dispatch({ actionType: 'PREPS', obj: [] });
    t.dispatch({ actionType: 'GROUPS', obj: [] });
    return t;
  };
  const sendAll = (t: ReturnType<typeof setup>, ids: string[]) => {
    t.dispatch(add(ids[0], 'PROLOGUE'));
    t.dispatch(add(ids[1], 'FOLLOW'));
    t.dispatch(add(ids[2], 'EPILOGUE'));
    t.dispatch({ actionType: 'FLY', obj: { id: ids[3], scaleX: 1, scaleY: 1, left: 0, top: 0 } });
    t.dispatch({ actionType: 'SYNCH', objects: [{ id: ids[4], scaleX: 1, scaleY: 1, left: 0, top: 0 }] });
  };

  it('지연된 PROLOGUE/FOLLOW/EPILOGUE/FLY/SYNCH는 CLEAN 뒤 버려진다', () => {
    const t = lateKinds();
    t.state.delay = true;
    sendAll(t, ['x', 'y', 'z', 'f', 's']);
    t.dispatch({ actionType: 'CLEAN' });
    t.flushEnliven(); jest.runAllTimers(); t.flushEnliven(); jest.runAllTimers();
    expect(t.ids()).toEqual([]);
  });

  it('CLEAN 뒤 dispatch한 객체는 정상 추가된다', () => {
    const t = lateKinds();
    t.dispatch({ actionType: 'CLEAN' });
    sendAll(t, ['x', 'y', 'z', 'f', 's']);
    jest.runAllTimers();
    expect(t.ids().sort()).toEqual(['f', 's', 'x', 'y', 'z']);
  });
});
