import { act, render, waitFor } from '@testing-library/react-native';
import { createRef } from 'react';

const mockLog: any[] = [];
const mockPosted: any[] = [];
let mockWebViewProps: any = null;
let mockEdges: any = null;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 800, height: 1280, scale: 1, fontScale: 1 }) }));
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: React.forwardRef((_p: any, ref: any) => {
      mockWebViewProps = _p;
      React.useImperativeHandle(ref, () => ({ postMessage: (m: string) => { const j = JSON.parse(m); mockPosted.push(j); mockLog.push(j.actionType + (j.obj?.id ? ':' + j.obj.id : '')); } }));
      return null;
    }),
  };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }) }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({}), useIsFocused: () => true }));
jest.mock('../src/kit/ui/web-view', () => () => null);
jest.mock('../src/kit/math/MathJaxWrapper', () => () => null);
jest.mock('../src/kit/canvas/CanvasChrome', () => ({ CanvasChrome: () => null, canvasTool: (id: string) => ({ id }) }));
jest.mock('../src/kit/canvas/note-canvas/screen-wrapper', () => ({ __esModule: true, default: ({ children, edges }: any) => { mockEdges = edges; return children; } }));
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
    sleep: jest.fn(async (ms: number) => { mockLog.push('sleep' + ms); if (mockSleepDelay) await new Promise((r) => setTimeout(r, mockSleepDelay)); }),
    findLargestSmallerThan: jest.fn(() => 0),
  };
});
let mockMenu: any = {};
let mockCtx: any = null;
let mockSleepDelay = 0;
jest.mock('../src/kit/canvas/note-canvas/script-maker', () => {
  const actual = jest.requireActual('@qoolla/script-parser');
  return {
    ...actual,
    scriptMaker: jest.fn(async () => ({ ...mockMenu })),
    makeTemporaryScript: jest.fn(() => mockMenu),
    safeJsonParse: (s: any, d: any) => d,
    handleLiveClassMessage: jest.fn(async (_g: any, ctx: any) => { mockCtx = ctx; }),
    fastforward: jest.fn((...a: any[]) => actual.fastforward(...a)),
    playToPoint: jest.fn((...a: any[]) => actual.playToPoint(...a)),
    runAt: jest.fn(),
  };
});

import fs from 'fs';
import { fastforward, playToPoint } from '../src/kit/canvas/note-canvas/script-maker';
import { storage } from '../src/kit/canvas/note-canvas/legacy';
import HotlineClassCanvasPanel from '../src/kit/canvas/note-canvas/hotline-class-canvas';
import TopicLiveClassCanvasPanel from '../src/kit/canvas/note-canvas/topic-live-canvas';
import { layout } from '../src/ui/theme';
import { canvasContextSize, canvasScreenSize, scriptPlayScale } from '../src/kit/canvas/canvasSize';

const add = (id: string) => ({ actionType: 'ADD', obj: { id } });
const build = (resetType: string | null, extra: any = {}) => {
  const contents: any[] = [{ actionType: 'BACKGROUND' }, add('a'), add('b')];
  if (resetType) contents.push({ actionType: resetType });
  contents.push(add('c'), add('d'));
  return { contents, backgroundCut: { actionType: 'BG' }, ...extra };
};
const guide = (studyIdx: number) => ({ scriptId: 12, sourceType: 'UNIT', sourceId: 1, studyIdx, step: 'main' });

describe.each([
  ['hotline', HotlineClassCanvasPanel],
  ['topic', TopicLiveClassCanvasPanel],
])('%s canvas 진입 재생', (_n, Panel: any) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPosted.length = 0;
    mockLog.length = 0;
    (storage as any).store['live-scripts'] = JSON.stringify([{ id: 11, sourceType: 'UNIT', sourceId: 0, releaseScriptUrl: 'u11' }, { id: 12, sourceType: 'UNIT', sourceId: 1, releaseScriptUrl: 'u12' }]);
    delete (storage as any).store.syncPoint;
  });
  const enter = async (menu: any, idx: number, step = 'main') => {
    mockMenu = menu;
    const ref = createRef<any>();
    await render(<Panel ref={ref} topicUnits={[]} changeUnit={jest.fn()} />);
    await act(async () => ref.current.onReceiveGuide({ ...guide(idx), step }));
    await waitFor(() => expect(mockLog.filter((l) => l.startsWith('ADD')).length).toBeGreaterThan(0));
    return ref;
  };
  const adds = () => mockLog.filter((l) => l.startsWith('ADD')).map((l) => l.split(':')[1]);

  it('WebView 크기·세로 여백·edges·context 폭 1280', async () => {
    await enter(build('CLEAN'), 5);
    const st = mockWebViewProps.style;
    expect(st.width).toBe(800 - 12);
    expect(st.height).toBe(1280 - 24 - layout.toolbarH);
    for (const k of ['padding', 'paddingVertical', 'paddingTop', 'paddingBottom', 'margin', 'marginVertical', 'marginTop', 'marginBottom']) expect(st[k] ?? 0).toBe(0);
    expect(mockWebViewProps.source.html).toContain("width='1280'");
    expect(mockEdges).not.toContain('top');
  });

  it('html의 classScale은 scriptPlayScale(context 크기)와 같다', async () => {
    await enter(build('CLEAN'), 5);
    const expected = scriptPlayScale(canvasContextSize(canvasScreenSize({ width: 800, height: 1280 }, { top: 24, bottom: 0 })));
    expect(mockWebViewProps.source.html).toContain(`var classScale = ${expected};`);
  });

  it.each(['CLEAN', 'CLEAR', 'CLEAN_SCENE'])('%s 이전 컷은 보내지 않는다', async (type) => {
    await enter(build(type), 5);
    await waitFor(() => expect(adds()).toContain('d'));
    expect(adds()).toEqual(['c', 'd']);
    expect(mockLog).toContain(type);
    expect(mockLog[0]).toBe('BG');
  });

  it('리셋 컷이 없으면 0부터 재생', async () => {
    await enter(build(null, {}), 4);
    await waitFor(() => expect(adds()).toContain('d'));
    expect(adds()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('리셋 컷 뒤 120ms 대기 후 다음 ADD', async () => {
    await enter(build('CLEAN'), 5);
    await waitFor(() => expect(adds()).toContain('d'));
    const i = mockLog.indexOf('CLEAN');
    expect(mockLog[i + 1]).toBe('sleep120');
    expect(mockLog.indexOf('ADD:c')).toBeGreaterThan(i + 1);
  });

  it('runCurtains: backgroundSubs인 연습지만 ADD', async () => {
    const menu = build('CLEAN', {
      // 파서(parseDocument)가 내는 형태 그대로: objs 는 객체 id 문자열, canvasBackStuffs 는 id -> 객체
      curtains: [{ seq: 3, objs: ['paper', 'other'] }, { seq: 1, objs: ['x'] }],
      canvasBackStuffs: { paper: { id: 'paper' } },
    });
    await enter(menu, 5);
    await waitFor(() => expect(adds()).toContain('d'));
    expect(adds()).toEqual(['paper', 'c', 'd']);
    expect(mockLog.indexOf('ADD:paper')).toBeLessThan(mockLog.indexOf('CLEAN'));
  });

  it('refresh 단계면 마지막 컷 main을 실행하지 않는다', async () => {
    await enter(build('CLEAN'), 5, 'refresh');
    await waitFor(() => expect(adds()).toContain('c'));
    expect(adds()).toEqual(['c']);
  });
});

describe('템플릿의 리셋 컷 처리', () => {
  it.each(['live-class-canvas-template.ts', 'topic-canvas-template.ts'])('%s 는 CLEAR를 clearCanvas로 처리', (f) => {
    const s = fs.readFileSync(__dirname + '/../src/kit/canvas/templates/' + f, 'utf8');
    expect(s).toMatch(/case 'CLEAR_CANVAS':\s*case 'CLEAN':\s*case 'CLEAR':/);
  });
  it('live 템플릿은 CLEAN_SCENE도 처리', () => {
    const s = fs.readFileSync(__dirname + '/../src/kit/canvas/templates/live-class-canvas-template.ts', 'utf8');
    expect(s).toContain("case 'CLEAN_SCENE'");
  });
});

describe.each([
  ['hotline', HotlineClassCanvasPanel],
  ['topic', TopicLiveClassCanvasPanel],
])('%s canvas 진입 재생 간격/직렬화', (_n, Panel: any) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPosted.length = 0;
    mockLog.length = 0;
    (storage as any).store['live-scripts'] = JSON.stringify([{ id: 12, sourceType: 'UNIT', sourceId: 1, releaseScriptUrl: 'u12' }]);
    delete (storage as any).store.syncPoint;
  });
  const menu = () => ({
    contents: [{ actionType: 'BACKGROUND' }, add('a'), { actionType: 'CLEAN' }, add('c'), add('d')],
    backgroundCut: { actionType: 'BG' },
  });
  const enter = async (idx: number) => {
    mockMenu = menu();
    const ref = createRef<any>();
    await render(<Panel ref={ref} topicUnits={[]} changeUnit={jest.fn()} />);
    await act(async () => ref.current.onReceiveGuide(guide(idx)));
    await waitFor(() => expect(mockLog).toContain('ADD:d'));
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    return ref;
  };

  it('배경 뒤와 컷 사이에 180ms 간격을 둔다', async () => {
    await enter(4);
    const bg = mockLog.lastIndexOf("BG");
    expect(mockLog[bg + 1]).toBe('sleep180');
    expect(mockLog).not.toContain('ADD:a');
    const c = mockLog.indexOf('ADD:c');
    const d = mockLog.indexOf('ADD:d');
    expect(mockLog.slice(c, d)).toContain('sleep180');
  });

  it('같은 목표 진입 재생이 겹쳐 와도 한 번만 그린다', async () => {
    mockMenu = menu();
    const ref = createRef<any>();
    await render(<Panel ref={ref} topicUnits={[]} changeUnit={jest.fn()} />);
    await act(async () => {
      await Promise.all([ref.current.onReceiveGuide(guide(4)), ref.current.onReceiveGuide(guide(4))]);
    });
    await act(async () => { await new Promise((r) => setTimeout(r, 20)); });
    expect(mockLog.filter((l) => l === 'ADD:d').length).toBe(1);
  });
});

describe.each([
  ['hotline', HotlineClassCanvasPanel],
  ['topic', TopicLiveClassCanvasPanel],
])('%s canvas 진입 재생 순서/재진입', (_n, Panel: any) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPosted.length = 0;
    mockLog.length = 0;
    mockCtx = null;
    mockSleepDelay = 0;
    (storage as any).store['live-scripts'] = JSON.stringify([{ id: 12, sourceType: 'UNIT', sourceId: 1, releaseScriptUrl: 'u12' }]);
    delete (storage as any).store.syncPoint;
  });
  const menu = () => ({
    contents: [{ actionType: 'BACKGROUND' }, add('a'), { actionType: 'CLEAN' }, add('c'), add('d'), add('e')],
    backgroundCut: { actionType: 'BG' },
  });
  const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 60)); });
  const load = async (idx: number) => {
    mockMenu = menu();
    const ref = createRef<any>();
    await render(<Panel ref={ref} topicUnits={[]} changeUnit={jest.fn()} />);
    await act(async () => { await ref.current.onReceiveGuide(guide(idx)); });
    return ref;
  };
  const board = () => mockLog.filter((l) => !l.startsWith('sleep'));

  it('3: 진입 재생 순서 전체', async () => {
    await load(4);
    await waitFor(() => expect(mockLog.filter((l) => l === 'sleep180').length).toBeGreaterThanOrEqual(4));
    await settle();
    const seq = mockLog.slice(mockLog.lastIndexOf('BG'));
    expect(seq).toEqual(expect.arrayContaining(['BG', 'sleep180', 'CLEAN']));
    const iClean = seq.indexOf('CLEAN');
    const tail = seq.slice(seq.indexOf('ADD:c') - 1);
    expect(tail).toEqual(['sleep180', 'ADD:c', 'sleep420', 'sleep180', 'ADD:d', 'sleep420', 'sleep180']);
    expect(seq.slice(0, 2)).toEqual(['BG', 'sleep180']);
    expect(iClean).toBeGreaterThan(1);
    expect(seq).not.toContain('ADD:a');
  });

  it('5: 겹친 호출이 와도 fastforward 1회, ADD d 1회', async () => {
    const ref = await load(4);
    await settle();
    expect((fastforward as jest.Mock).mock.calls.length).toBe(1);
    await act(async () => { await ref.current.onReceiveGuide(guide(4)); });
    await act(async () => { await Promise.all([mockCtx.playToPoint({ studyIdx: 4, step: 'main' }), mockCtx.playToPoint({ studyIdx: 4, step: 'main' })]); });
    await settle();
    expect((fastforward as jest.Mock).mock.calls.length).toBe(1);
    expect(mockLog.filter((l) => l === 'ADD:d').length).toBe(1);
  });

  it('6: 진입 재생 중 도착한 {studyIdx:5} 재생은 진입 재생 뒤에 시작', async () => {
    mockSleepDelay = 15;
    const ref = await load(4);
    await waitFor(() => expect(mockLog).toContain('ADD:c'));
    await act(async () => { await ref.current.onReceiveGuide(guide(5)); });
    await act(async () => { mockCtx.setLastGuide({ studyIdx: 4, step: 'main' }); });
    await act(async () => { await ref.current.onReceiveGuide(guide(5)); });
    await act(async () => { await mockCtx.playToPoint({ studyIdx: 5, step: 'main' }); });
    await settle();
    const b = board().filter((l) => l.startsWith('ADD'));
    expect(b).toEqual(['ADD:c', 'ADD:d', 'ADD:e']);
    expect(mockLog.indexOf('ADD:e')).toBeGreaterThan(mockLog.lastIndexOf('sleep180', mockLog.indexOf('ADD:d') + 3));
  });

  it('7: 진입 재생 뒤 {studyIdx:5}는 playToPoint로 재생되고 sleep180이 없다', async () => {
    const ref = await load(4);
    await settle();
    await act(async () => { await ref.current.onReceiveGuide(guide(4)); });
    await act(async () => { mockCtx.setLastGuide({ studyIdx: 4, step: 'main' }); });
    (playToPoint as jest.Mock).mockClear();
    (fastforward as jest.Mock).mockClear();
    const n = mockLog.length;
    await act(async () => { await mockCtx.playToPoint({ studyIdx: 5, step: 'main' }); });
    await settle();
    expect((fastforward as jest.Mock).mock.calls.length).toBe(0);
    expect((playToPoint as jest.Mock).mock.calls.length).toBe(1);
    expect(mockLog.slice(n)).toContain('ADD:e');
    expect(mockLog.slice(n)).not.toContain('sleep180');
  });

  it('8: CLASS_ON_AIR(같은 스크립트)는 목표가 같아도 다시 재생', async () => {
    const ref = await load(4);
    await settle();
    (fastforward as jest.Mock).mockClear();
    mockLog.length = 0;
    await act(async () => { await ref.current.onReceiveGuide({ ...guide(4), action: 'CLASS_ON_AIR' }); });
    await settle();
    expect(mockLog).toContain('BACKGROUND');
  });

  it('8: follow는 목표가 같아도 다시 재생', async () => {
    const ref = await load(4);
    await settle();
    await act(async () => { await ref.current.onReceiveGuide(guide(4)); });
    mockLog.length = 0;
    await act(async () => { await ref.current.onReceiveGuide({ ...guide(4), action: 'follow' }); });
    await act(async () => { await new Promise((r) => setTimeout(r, 400)); });
    expect(mockLog.filter((l) => l.startsWith('ADD')).length).toBeGreaterThan(0);
  });

  it('9: 재로드 뒤 같은 목표는 다시 진입 재생', async () => {
    const ref = await load(4);
    await settle();
    expect(mockLog.filter((l) => l === 'ADD:d').length).toBe(1);
    mockLog.length = 0;
    (storage as any).store.syncPoint = JSON.stringify({ studyIdx: 4, step: 'main' });
    await act(async () => { await ref.current.onReceiveGuide(guide(4)); });
    expect(mockLog.filter((l) => l === 'ADD:d').length).toBe(0);
    await act(async () => { await mockCtx.downloadScript(); });
    await settle();
    expect(mockLog.filter((l) => l === 'ADD:d').length).toBeGreaterThanOrEqual(1);
  });

  it.each([
    ['canvas-synch', { action: 'canvas-synch', objects: [1] }],
    ['synch', { action: 'synch', objects: [1], studyIdx: 2 }],
    ['snapshot', { action: 'snapshot' }],
  ])('10: %s guide 처리 불변', async (_k, g: any) => {
    const ref = await load(4);
    await settle();
    mockLog.length = 0;
    await act(async () => { await ref.current.onReceiveGuide({ ...guide(4), ...g }); });
    const expected = g.action === 'snapshot' ? ['SAVE'] : ['SYNCH'];
    expect(mockLog).toEqual(expected);
  });
});

describe.each([
  ['hotline', HotlineClassCanvasPanel],
  ['topic', TopicLiveClassCanvasPanel],
])('%s canvas 연속 재생 fromPt', (_n, Panel: any) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPosted.length = 0;
    mockLog.length = 0;
    mockCtx = null;
    mockSleepDelay = 0;
    (storage as any).store['live-scripts'] = JSON.stringify([{ id: 12, sourceType: 'UNIT', sourceId: 1, releaseScriptUrl: 'u12' }]);
    delete (storage as any).store.syncPoint;
  });

  it('앞선 재생이 진행 중일 때 온 재생은 lastPlayedRef부터 이어서 재생한다', async () => {
    mockMenu = {
      contents: [{ actionType: 'BACKGROUND' }, add('a'), { actionType: 'CLEAN' }, add('b'), { actionType: 'CLEAN' }, add('c'), add('d'), { actionType: 'CLEAN' }, add('e')],
      backgroundCut: { actionType: 'BG' },
    };
    mockSleepDelay = 15;
    const ref = createRef<any>();
    await render(<Panel ref={ref} topicUnits={[]} changeUnit={jest.fn()} />);
    await act(async () => { await ref.current.onReceiveGuide(guide(3)); });
    await waitFor(() => expect(mockLog).toContain('ADD:b'));
    await act(async () => { await ref.current.onReceiveGuide(guide(3)); });
    const stale = { studyIdx: 0, step: 'main' };
    await act(async () => {
      // 낡은 fromPt(stale)를 넘기는 것과 같은 상황: 렌더 클로저의 lastGuide가 갱신되기 전
      mockCtx.setLastGuide(stale);
      const p1 = mockCtx.playToPoint({ studyIdx: 6, step: 'main' });
      const p2 = mockCtx.playToPoint({ studyIdx: 8, step: 'main' });
      await Promise.all([p1, p2]);
    });
    await act(async () => { await new Promise((r) => setTimeout(r, 300)); });
    const log = mockLog.filter((l) => !l.startsWith('sleep'));
    const entryEnd = log.indexOf('ADD:b');
    const rest = log.slice(entryEnd + 1);
    expect(rest).toEqual(['CLEAN', 'ADD:c', 'ADD:d', 'CLEAN', 'ADD:e']);
    expect(log[log.length - 1]).toBe('ADD:e');
    expect(log.filter((l) => l === 'ADD:a').length).toBeLessThanOrEqual(1);
  });
});
