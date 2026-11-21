import { act, render } from '@testing-library/react-native';
import { createRef } from 'react';

jest.mock('react-native/Libraries/Components/ActivityIndicator/ActivityIndicator', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="loading" /> };
});
const mockPosted: any[] = [];
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 800, height: 1280, scale: 1, fontScale: 1 }) }));
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    // eslint-disable-next-line react/display-name
    WebView: React.forwardRef((_p: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ postMessage: (m: string) => mockPosted.push(JSON.parse(m)) }));
      return null;
    }),
  };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({}), useIsFocused: () => true }));
jest.mock('../src/kit/ui/web-view', () => () => null);
jest.mock('../src/kit/math/MathJaxWrapper', () => () => null);
jest.mock('../src/kit/canvas/CanvasChrome', () => ({ CanvasChrome: () => null, canvasTool: (id: string) => ({ id }) }));
jest.mock('../src/kit/canvas/note-canvas/screen-wrapper', () => ({ __esModule: true, default: ({ children }: any) => children }));
jest.mock('../src/api/rest', () => ({ requestStorageUrl: jest.fn() }));
jest.mock('react-native-blob-util', () => ({ __esModule: true, default: {} }));
jest.mock('../src/kit/canvas/note-canvas/legacy', () => {
  const React = require('react');
  const store: Record<string, any> = {};
  return {
    AppCtx: React.createContext({ state: { appToken: '' }, dispatch: () => {} }),
    storage: {
      store,
      getString: (k: string) => store[k],
      getNumber: (k: string) => store[k],
      set: jest.fn((k: string, v: any) => void (store[k] = v)),
      remove: (k: string) => void delete store[k],
    },
    cacheLiveReleaseScriptUrl: jest.fn(() => false),
    getBase64StringFromDataURL: jest.fn(),
    sleep: jest.fn(async () => {}),
    findLargestSmallerThan: jest.fn(() => 0),
  };
});
const mockMenu = { contents: [{ actionType: 'BACKGROUND' }, { actionType: 'ADD', obj: { id: 'a' } }], backgroundCut: { actionType: 'BG' } };
jest.mock('../src/kit/canvas/note-canvas/script-maker', () => {
  const actual = jest.requireActual('@qoolla/script-parser');
  return {
    ...actual,
    scriptMaker: jest.fn(async () => ({ ...mockMenu })),
    makeTemporaryScript: jest.fn(() => mockMenu),
    safeJsonParse: (s: any, d: any) => d,
    handleLiveClassMessage: jest.fn(async () => {}),
  };
});

import { storage } from '../src/kit/canvas/note-canvas/legacy';
import { scriptMaker, makeTemporaryScript, handleLiveClassMessage } from '../src/kit/canvas/note-canvas/script-maker';
import HotlineClassCanvasPanel from '../src/kit/canvas/note-canvas/hotline-class-canvas';
import TopicLiveCanvas from '../src/kit/canvas/note-canvas/topic-live-canvas';
import template from '../src/kit/canvas/templates/live-class-canvas-template';

const scripts = [
  { id: 12, sourceType: 'UNIT', sourceId: 1, releaseScriptUrl: 'u12' },
  { sourceType: 'UNIT', sourceId: 2 },
];
const unit2 = (extra: any = {}) => ({ action: 'refresh', step: 'refresh', studyIdx: 0, scriptId: 0, sourceType: 'UNIT', sourceId: 2, ...extra });
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 60)); });
const types = () => mockPosted.map((m) => m.actionType);

describe('hotline reload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPosted.length = 0;
    (storage as any).store['live-scripts'] = JSON.stringify(scripts);
    delete (storage as any).store.syncPoint;
  });
  const mount = async (Comp: any = HotlineClassCanvasPanel) => {
    const ref = createRef<any>();
    const r = await render(<Comp ref={ref} topicUnits={[]} changeUnit={jest.fn()} />);
    return { ref, r };
  };

  it('URL 없는 유닛 reload는 makeTemporaryScript로 처리하고 로딩에 빠지지 않는다', async () => {
    const { ref, r } = await mount();
    await act(async () => ref.current.onReceiveGuide(unit2()));
    await settle();
    (makeTemporaryScript as jest.Mock).mockClear();
    (scriptMaker as jest.Mock).mockClear();
    mockPosted.length = 0;
    await act(async () => ref.current.onReceiveGuide({ action: 'reload', mode: 'reload', step: 'main', studyIdx: 1, scriptId: 0, sourceType: 'UNIT', sourceId: 2 }));
    await settle();
    expect(scriptMaker).not.toHaveBeenCalled();
    expect(makeTemporaryScript).toHaveBeenCalledWith('UNIT', 2);
    expect(r.queryByTestId('loading')).toBeNull();
    expect(types()).toContain('RESET_BOARD');
  });

  it('URL이 있는 reload 성공 시 RESET_BOARD를 보내고 복귀 지점을 재생한다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide({ ...unit2(), sourceId: 1, scriptId: 12 }));
    await settle();
    (scriptMaker as jest.Mock).mockClear();
    mockPosted.length = 0;
    await act(async () => ref.current.onReceiveGuide({ action: 'reload', mode: 'reload', step: 'main', studyIdx: 1, scriptId: 12, sourceType: 'UNIT', sourceId: 1 }));
    await settle();
    expect((scriptMaker as jest.Mock).mock.calls[0][0]).toMatch(/^u12\?ts=/);
    expect(types()).toContain('RESET_BOARD');
    expect(handleLiveClassMessage).not.toHaveBeenCalled();
  });

  it('scriptMaker가 실패하거나 null이면 로딩·RESET_BOARD 없이 기존 상태를 유지한다', async () => {
    const { ref, r } = await mount();
    await act(async () => ref.current.onReceiveGuide({ ...unit2(), sourceId: 1, scriptId: 12 }));
    await settle();
    for (const impl of [() => Promise.reject(new Error('x')), () => Promise.resolve(null)]) {
      (scriptMaker as jest.Mock).mockImplementationOnce(impl);
      mockPosted.length = 0;
      (storage.set as jest.Mock).mockClear();
      await act(async () => ref.current.onReceiveGuide({ action: 'reload', step: 'main', studyIdx: 1, scriptId: 12, sourceType: 'UNIT', sourceId: 1 }));
      await settle();
      expect(r.queryByTestId('loading')).toBeNull();
      expect(types()).not.toContain('RESET_BOARD');
      expect((storage.set as jest.Mock).mock.calls.some(([k]) => k === 'syncPoint')).toBe(false);
    }
  });

  it('연속 reload는 마지막 요청 결과만 반영한다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide({ ...unit2(), sourceId: 1, scriptId: 12 }));
    await settle();
    mockPosted.length = 0;
    const g = { action: 'reload', step: 'main', studyIdx: 1, scriptId: 12, sourceType: 'UNIT', sourceId: 1 };
    await act(async () => { await Promise.all([ref.current.onReceiveGuide(g), ref.current.onReceiveGuide(g)]); });
    await settle();
    expect(types().filter((t) => t === 'RESET_BOARD')).toHaveLength(1);
  });

  it('currentScript에 URL이 없어도 패널 releaseScriptUrl 상태가 있으면 ?ts= 로 scriptMaker를 부른다', async () => {
    (storage as any).store['live-scripts'] = JSON.stringify([{ id: 12, sourceType: 'UNIT', sourceId: 1 }]);
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide({ ...unit2(), sourceId: 1, scriptId: 12 }));
    await settle();
    (scriptMaker as jest.Mock).mockClear();
    (makeTemporaryScript as jest.Mock).mockClear();
    await act(async () => ref.current.onReceiveGuide({ action: 'reload', step: 'main', studyIdx: 1, scriptId: 12, sourceType: 'UNIT', sourceId: 1 }));
    await settle();
    const urls = (scriptMaker as jest.Mock).mock.calls.map((c) => c[0]);
    if (urls.length) expect(urls[0]).toMatch(/\?ts=/);
    else expect(makeTemporaryScript).toHaveBeenCalled();
  });

  it('reload 성공 시 syncPoint는 guide의 studyIdx/step이며 mode는 step이 아니다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide({ ...unit2(), sourceId: 1, scriptId: 12 }));
    await settle();
    (storage.set as jest.Mock).mockClear();
    await act(async () => ref.current.onReceiveGuide({ action: 'reload', mode: 'reload', step: 'main', studyIdx: 1, scriptId: 12, sourceType: 'UNIT', sourceId: 1 }));
    const call = (storage.set as jest.Mock).mock.calls.find(([k]) => k === 'syncPoint');
    expect(call).toBeTruthy();
    expect(JSON.parse(call[1])).toEqual({ studyIdx: 1, step: 'main' });
  });

  it('reload 로딩 중 다른 스크립트로 전환되면 늦은 결과를 버린다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide({ ...unit2(), sourceId: 1, scriptId: 12 }));
    await settle();
    let resolve: any;
    (scriptMaker as jest.Mock).mockImplementationOnce(() => new Promise((r) => { resolve = r; }));
    mockPosted.length = 0;
    (storage.set as jest.Mock).mockClear();
    let pending: any;
    await act(async () => { pending = ref.current.onReceiveGuide({ action: 'reload', step: 'main', studyIdx: 1, scriptId: 12, sourceType: 'UNIT', sourceId: 1 }); });
    await act(async () => ref.current.onReceiveGuide(unit2()));
    await settle();
    mockPosted.length = 0;
    (storage.set as jest.Mock).mockClear();
    await act(async () => { resolve({ ...mockMenu }); await pending; });
    await settle();
    expect(types()).not.toContain('RESET_BOARD');
    expect((storage.set as jest.Mock).mock.calls.some(([k]) => k === 'syncPoint')).toBe(false);
  });

  it('cleanMessy는 CLEAN_ADHOCS, magnifyArea는 obj와 함께 STAND_OUT을 보낸다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide({ ...unit2(), sourceId: 1, scriptId: 12 }));
    await settle();
    const base = { scriptId: 12, sourceType: 'UNIT', sourceId: 1 };
    const impl = jest.requireActual('@qoolla/script-parser');
    const area = { left: 1, top: 2, width: 3, height: 4 };
    (handleLiveClassMessage as jest.Mock).mockImplementation(async (g: any, c: any) => {
      if (g.action === 'cleanMessy') c.canvas.removeFlyingObjs();
      if (g.action === 'magnifyArea') c.canvas.magnifyArea(g.obj);
    });
    mockPosted.length = 0;
    await act(async () => ref.current.onReceiveGuide({ ...base, action: 'cleanMessy' }));
    await act(async () => ref.current.onReceiveGuide({ ...base, action: 'magnifyArea', actionType: 'MAGNIFY', obj: area }));
    expect(impl).toBeDefined();
    expect(mockPosted).toContainEqual({ actionType: 'CLEAN_ADHOCS' });
    expect(mockPosted).toContainEqual({ actionType: 'STAND_OUT', obj: area });
    (handleLiveClassMessage as jest.Mock).mockImplementation(async () => {});
  });

  it('canvas-synch(studyIdx 없음)는 SYNCH를 objects와 함께 보낸다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide({ ...unit2(), sourceId: 1, scriptId: 12 }));
    await settle();
    mockPosted.length = 0;
    const objects = [{ id: 'fly:1', left: 5 }];
    await act(async () => ref.current.onReceiveGuide({ action: 'canvas-synch', scriptId: 12, sourceType: 'UNIT', sourceId: 1, objects }));
    expect(mockPosted).toContainEqual({ actionType: 'SYNCH', objects });
  });

  it('topic reload: URL 없으면 scriptMaker·RESET_BOARD 없이 WebView 유지', async () => {
    const { ref, r } = await mount(TopicLiveCanvas);
    await act(async () => ref.current.onReceiveGuide(unit2()));
    await settle();
    (scriptMaker as jest.Mock).mockClear();
    mockPosted.length = 0;
    await act(async () => ref.current.onReceiveGuide({ action: 'reload', mode: 'reload', step: 'main', studyIdx: 1, scriptId: 0, sourceType: 'UNIT', sourceId: 2 }));
    await settle();
    expect(scriptMaker).not.toHaveBeenCalled();
    expect(types()).not.toContain('RESET_BOARD');
    expect(r.queryByTestId('loading')).toBeNull();
  });

  it('topic reload: URL 있으면 성공 시 RESET_BOARD, 실패/null이면 아무것도 바꾸지 않는다', async () => {
    const { ref, r } = await mount(TopicLiveCanvas);
    await act(async () => ref.current.onReceiveGuide({ ...unit2(), sourceId: 1, scriptId: 12 }));
    await settle();
    const g = { action: 'reload', mode: 'reload', step: 'main', studyIdx: 1, scriptId: 12, sourceType: 'UNIT', sourceId: 1 };
    for (const impl of [() => Promise.reject(new Error('x')), () => Promise.resolve(null)]) {
      (scriptMaker as jest.Mock).mockImplementationOnce(impl);
      mockPosted.length = 0;
      (storage.set as jest.Mock).mockClear();
      await act(async () => ref.current.onReceiveGuide(g));
      await settle();
      expect(r.queryByTestId('loading')).toBeNull();
      expect(types()).not.toContain('RESET_BOARD');
      expect((storage.set as jest.Mock).mock.calls.some(([k]) => k === 'syncPoint')).toBe(false);
    }
    (scriptMaker as jest.Mock).mockClear();
    mockPosted.length = 0;
    (storage.set as jest.Mock).mockClear();
    await act(async () => ref.current.onReceiveGuide(g));
    await settle();
    expect((scriptMaker as jest.Mock).mock.calls[0][0]).toMatch(/^u12\?ts=/);
    expect(types()).toContain('RESET_BOARD');
    const call = (storage.set as jest.Mock).mock.calls.find(([k]) => k === 'syncPoint');
    expect(JSON.parse(call[1])).toEqual({ studyIdx: 1, step: 'main' });
  });

  it('snapshot은 SAVE 한 번', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide(unit2()));
    await settle();
    mockPosted.length = 0;
    await act(async () => ref.current.onReceiveGuide({ action: 'snapshot' }));
    expect(types().filter((t) => t === 'SAVE')).toHaveLength(1);
  });

  describe.each([['hotline', HotlineClassCanvasPanel], ['topic', TopicLiveCanvas]])('%s objState', (_n, Comp) => {
    it('select/magnify의 objState는 APPLY_OBJ_STATE로 먼저 전송, 없으면 보내지 않는다', async () => {
      const { ref } = await mount(Comp);
      await act(async () => ref.current.onReceiveGuide({ ...unit2(), sourceId: 1, scriptId: 12 }));
      await settle();
      const objState = { id: 'fly:1', left: 1, top: 2 };
      const base = { scriptId: 12, sourceType: 'UNIT', sourceId: 1, objId: 'fly:1' };
      mockPosted.length = 0;
      await act(async () => ref.current.onReceiveGuide({ ...base, action: 'select', objState }));
      expect(mockPosted).toContainEqual({ actionType: 'APPLY_OBJ_STATE', obj: objState });
      mockPosted.length = 0;
      await act(async () => ref.current.onReceiveGuide({ ...base, action: 'magnify' }));
      expect(types()).not.toContain('APPLY_OBJ_STATE');
    });
  });
});

describe('template', () => {
  const html = template(1280, 1920, 'orange', 6);
  it('RESET_BOARD는 SAVE를 만들지 않는다', () => {
    const body = html.slice(html.indexOf('function resetBoard('), html.indexOf('function applyObjectState('));
    expect(body).toContain('resetEpoch += 1');
    expect(body).toContain('backgroundSubs');
    expect(body).not.toContain('SAVE');
    expect(body).not.toContain('toDataURL');
  });
  it('removeFlyingObjs는 fly:와 magnifier:를 지운다', () => {
    const body = html.slice(html.indexOf('function removeFlyingObjs('), html.indexOf('function removeMagnifiers('));
    expect(body).toContain("'fly:'");
    expect(body).toContain("'magnifier:'");
  });
  it('STAND_OUT은 objId 없고 영역이 있으면 magnifyArea를 부른다', () => {
    expect(html).toMatch(/case 'STAND_OUT':[\s\S]*?magnifyObj\(action\.objId\)[\s\S]*?magnifyArea\(action\.obj\)/);
  });
  it('applyObjectState는 opacity/src/width/height를 건드리지 않는다', () => {
    const body = html.slice(html.indexOf('function applyObjectState('), html.indexOf('function magnifyArea('));
    for (const k of ['opacity', 'src', 'width', 'height']) expect(body).not.toContain(k);
  });
  it('syncCanvasObjects는 기존 객체에 상태를 적용하되 magnifier/temporary는 제외한다', () => {
    const body = html.slice(html.indexOf('function syncCanvasObjects('));
    expect(body).toContain('applyObjectState(existing, parsedObj)');
    expect(body).toContain("'magnifier:'");
    expect(body).toContain("'temporary:'");
  });
  it('템플릿 스크립트 문법이 유효하다', () => {
    const script = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
    expect(() => new Function(script)).not.toThrow();
  });
});

describe('template 실행', () => {
  const html = template(1280, 1920, 'orange', 6);
  const slice = (from: string, to: string) => html.slice(html.indexOf(from), html.indexOf(to));
  const mkObj = (o: any) => ({ ...o, set(p: any) { Object.assign(this, p); }, setCoords: jest.fn() });
  const build = (objs: any[], classScale = 0.5) => {
    const canvas: any = {
      objs,
      getObjects() { return this.objs; },
      remove(o: any) { this.objs = this.objs.filter((x: any) => x !== o); },
      add(o: any) { this.objs.push(o); },
      requestRenderAll: jest.fn(),
      renderAll: jest.fn(),
      toDataURL: jest.fn(() => 'data:image/png;base64,x'),
    };
    const src = [
      slice('function removeFlyingObjs(', 'function magnifyObj('),
      html.slice(html.indexOf('function syncCanvasObjects('), html.indexOf('function syncCanvasObjects(') + 6000).split(/\n {8}(?:async )?function (?!syncCanvasObjects)/)[0],
    ].join('\n');
    const ctx: any = { canvas, classScale, resetEpoch: 0, backgroundSubs: ['bg'], fabric: null };
    const groups: any[] = [];
    ctx.fabric = {
      Image: { fromURL: (_u: string, cb: any) => cb({ width: 200, height: 100, set(p: any) { Object.assign(this, p); } }) },
      Rect: function (this: any, o: any) { Object.assign(this, o); },
      Group: function (this: any, items: any[], o: any) { Object.assign(this, o, { items }); this.setCoords = () => {}; this.animate = jest.fn(); groups.push(this); },
      util: { ease: { easeOutBack: 1 }, enlivenObjects: (arr: any[], cb: any) => cb(arr.map(mkObj)) },
    };
    const fn = new Function('canvas', 'classScale', 'window', 'fabric', 'backgroundSubs', 'ctx',
      `var resetEpoch = 0; ${src}; return { removeFlyingObjs, removeMagnifiers, resetBoard, applyObjectState, magnifyArea, syncCanvasObjects, epoch: () => resetEpoch };`);
    const api = fn(canvas, classScale, { fabric: ctx.fabric }, ctx.fabric, ['bg'], ctx);
    return { canvas, api, groups };
  };

  it('resetBoard는 background 외 객체를 지우고 SAVE 없이 epoch를 올린다', () => {
    const { canvas, api } = build([mkObj({ id: 'bg' }), mkObj({ id: 'a' })]);
    api.resetBoard();
    expect(canvas.objs.map((o: any) => o.id)).toEqual(['bg']);
    expect(api.epoch()).toBe(1);
    expect(canvas.toDataURL).not.toHaveBeenCalled();
  });

  it('removeFlyingObjs는 fly:와 magnifier:를 지우고 나머지는 남긴다', () => {
    const { canvas, api } = build([mkObj({ id: 'fly:1' }), mkObj({ id: 'magnifier:1' }), mkObj({ id: 'keep' })]);
    api.removeFlyingObjs();
    expect(canvas.objs.map((o: any) => o.id)).toEqual(['keep']);
  });

  it('REMOVE_OBJ의 magnifier: id는 removeMagnifiers로 라우팅된다', () => {
    expect(html).toMatch(/case 'REMOVE_OBJ':[\s\S]*?startsWith\('magnifier:'\)\) \{\s*removeMagnifiers\(\)/);
    const { canvas, api } = build([mkObj({ id: 'magnifier:1' }), mkObj({ id: 'magnifier:2' }), mkObj({ id: 'x' })]);
    api.removeMagnifiers();
    expect(canvas.objs.map((o: any) => o.id)).toEqual(['x']);
  });

  it('applyObjectState는 classScale 적용, opacity/width/height/src 무시, 비숫자 건너뜀', () => {
    const { api } = build([]);
    const t = mkObj({ left: 0, top: 0, scaleX: 1, scaleY: 1, opacity: 1, width: 10, height: 10, src: 's' });
    api.applyObjectState(t, { left: 100, top: 200, scaleX: 2, scaleY: 'x', angle: 30, flipX: true, flipY: 'no', opacity: 0.1, width: 99, height: 99, src: 'n' });
    expect(t).toMatchObject({ left: 50, top: 100, scaleX: 1, scaleY: 1, angle: 30, flipX: true, opacity: 1, width: 10, height: 10, src: 's' });
    expect(t.flipY).toBeUndefined();
    expect(t.setCoords).toHaveBeenCalled();
  });

  it('syncCanvasObjects: 기존 객체 갱신·수 불변, 없던 객체 추가, 미언급 객체 유지, magnifier/temporary 제외', () => {
    const a = mkObj({ id: 'fly:1', left: 0, top: 0, scaleX: 1, scaleY: 1 });
    const keep = mkObj({ id: 'keep' });
    const mag = mkObj({ id: 'magnifier:1', left: 7 });
    const tmp = mkObj({ id: 'temporary:1', left: 7 });
    const { canvas, api } = build([a, keep, mag, tmp]);
    api.syncCanvasObjects([
      { id: 'fly:1', left: 100, top: 40, scaleX: 2, scaleY: 4 },
      { id: 'magnifier:1', left: 999 },
      { id: 'temporary:1', left: 999 },
    ]);
    expect(a).toMatchObject({ left: 50, top: 20, scaleX: 1, scaleY: 2 });
    expect(mag.left).toBe(7);
    expect(tmp.left).toBe(7);
    expect(canvas.objs).toHaveLength(4);
    api.syncCanvasObjects([{ id: 'new:1', left: 10, top: 10, scaleX: 1, scaleY: 1 }]);
    expect(canvas.objs).toHaveLength(5);
    expect(canvas.objs.map((o: any) => o.id)).toContain('keep');
  });

  it('magnifyArea: 단일 magnifier, 표시 범위 제한, 이미지 표시 크기는 영역 크기', () => {
    const { canvas, api, groups } = build([mkObj({ id: 'magnifier:old' })]);
    api.magnifyArea({ left: 1000, top: 1800, width: 600, height: 600, scale: 5 });
    const mags = canvas.objs.filter((o: any) => String(o.id).startsWith('magnifier:'));
    expect(mags).toHaveLength(1);
    expect(mags[0].id).not.toBe('magnifier:old');
    expect(mags[0].selectable).toBe(false);
    const g = groups[0];
    const img = g.items[1];
    expect(img.scaleX * 200).toBeCloseTo(300);
    expect(img.scaleY * 100).toBeCloseTo(300);
    const finalScale = g.animate.mock.calls[0][1];
    expect(300 * finalScale).toBeLessThanOrEqual(640);
    expect(g.originX).toBe('right');
    expect(g.originY).toBe('bottom');
    expect(g.left).toBeLessThanOrEqual(640);
    expect(g.top).toBeLessThanOrEqual(960);
  });

  it('magnifyArea는 캡처 실패 시 오류 없이 무시한다', () => {
    const { canvas, api } = build([]);
    canvas.toDataURL = () => { throw new Error('x'); };
    expect(() => api.magnifyArea({ left: 0, top: 0, width: 10, height: 10 })).not.toThrow();
    expect(canvas.objs).toHaveLength(0);
  });

  it('없는 id의 APPLY_OBJ_STATE는 오류를 내지 않는 분기로 처리된다', () => {
    expect(html).toMatch(/if \(stateTarget\) applyObjectState/);
  });
});
