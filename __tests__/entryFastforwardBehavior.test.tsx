import { act, render, waitFor } from '@testing-library/react-native';
import { createRef } from 'react';

const mockPosted: any[] = [];
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: React.forwardRef((_p: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ postMessage: (m: string) => mockPosted.push(JSON.parse(m)) }));
      return null;
    }),
  };
});
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
// 실제 script-parser(fastforward/playToPoint/isResetCut/handleLiveClassMessage)를 쓰고 스크립트 로드만 가짜로 대체
let mockScript: any;
jest.mock('../src/kit/canvas/note-canvas/script-maker', () => ({
  ...jest.requireActual('@qoolla/script-parser'),
  scriptMaker: jest.fn(async () => ({ ...mockScript })),
  makeTemporaryScript: jest.fn(() => mockScript),
}));

import { storage, sleep } from '../src/kit/canvas/note-canvas/legacy';
import HotlineClassCanvasPanel from '../src/kit/canvas/note-canvas/hotline-class-canvas';
import TopicLiveClassCanvasPanel from '../src/kit/canvas/note-canvas/topic-live-canvas';

const scripts = [{ id: 12, sourceType: 'UNIT', sourceId: 1, releaseScriptUrl: 'u12' }];
const cut = (actionType: string, id: string) => ({ actionType, id, obj: { id }, content: JSON.stringify({ id }) });
const BG = { actionType: 'BACKGROUND', obj: { imageUrl: 'bg' } };
const mk = (types: string[], extra: any = {}) => ({
  contents: types.map((t, i) => cut(t, `c${i}`)),
  backgroundCut: BG,
  ...extra,
});
// 보낸 컷 중 재생 대상만 id로 요약
const trace = () =>
  mockPosted.filter((m) => ['ADD', 'CLEAN', 'CLEAR', 'CLEAN_SCENE'].includes(m.actionType) || m === undefined || m.obj?.imageUrl === 'bg').map((m) => (m.obj?.imageUrl === 'bg' ? 'BG' : m.id ?? m.obj?.id));

describe.each([
  ['hotline', HotlineClassCanvasPanel],
  ['topic', TopicLiveClassCanvasPanel],
])('%s 진입 재생', (_n, Panel: any) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPosted.length = 0;
    (storage as any).store['live-scripts'] = JSON.stringify(scripts);
    delete (storage as any).store.syncPoint;
  });
  const onAir = (studyIdx: number, step = 'main') => ({ action: 'CLASS_ON_AIR', scriptId: 12, studyIdx, step, sourceType: 'UNIT', sourceId: 1 });
  const mount = async (script: any) => {
    mockScript = script;
    const ref = createRef<any>();
    await render(<Panel ref={ref} topicUnits={[]} changeUnit={jest.fn()} />);
    // 첫 스크립트 로드가 끝난 뒤 guide를 받는다
    if (_n === 'topic') {
      await waitFor(() => expect(mockPosted.some((m) => m.actionType === 'BACKGROUND')).toBe(true));
      mockPosted.length = 0;
    }
    return ref;
  };
  const enter = async (script: any, studyIdx: number, step = 'main') => {
    const ref = await mount(script);
    await act(async () => ref.current.onReceiveGuide(onAir(studyIdx, step)));
    await waitFor(() => expect(trace()).toContain(`c${studyIdx}`));
    return ref;
  };

  it('CLEAN 직전부터: BG, CLEAN, c, d (a, b 미전송)', async () => {
    await enter(mk(['BACKGROUND', 'ADD', 'ADD', 'CLEAN', 'ADD', 'ADD']), 5);
    const t = trace();
    expect(t.slice(t.lastIndexOf('BG'))).toEqual(['BG', 'c3', 'c4', 'c5']);
    expect(t).not.toContain('c1');
    expect(t).not.toContain('c2');
  });

  it('CLEAR도 리셋 컷', async () => {
    await enter(mk(['BACKGROUND', 'ADD', 'ADD', 'CLEAR', 'ADD', 'ADD']), 5);
    const t = trace();
    expect(t).not.toContain('c1');
    expect(t).not.toContain('c2');
    expect(t).toContain('c3');
  });

  it('리셋 컷이 없으면 0번부터 모두', async () => {
    await enter(mk(['ADD', 'ADD', 'ADD']), 2);
    expect(trace().filter((x) => x !== 'BG')).toEqual(['c0', 'c1', 'c2']);
  });

  it("step 'refresh'면 목표 컷 main 미전송", async () => {
    const ref = await mount(mk(['BACKGROUND', 'ADD', 'ADD', 'CLEAN', 'ADD', 'ADD']));
    await act(async () => ref.current.onReceiveGuide(onAir(5, 'refresh')));
    await waitFor(() => expect(trace()).toContain('c4'));
    expect(trace()).not.toContain('c5');
  });

  it('리셋 컷 뒤 sleep(120)', async () => {
    for (const t of ['CLEAN', 'CLEAN_SCENE', 'CLEAR']) {
      (sleep as jest.Mock).mockClear();
      mockPosted.length = 0;
      (storage as any).store['live-scripts'] = JSON.stringify(scripts);
      await enter(mk(['ADD', t, 'ADD']), 2);
      expect(sleep).toHaveBeenCalledWith(120);
    }
  });

  it('runCurtains: curtains+canvasBackStuffs의 객체만 ADD, 없는 연습지는 미전송', async () => {
    const paper = { id: 'paper', imageUrl: 'x-paper.jpg' };
    const other = { id: 'other-paper', imageUrl: 'y-paper.jpg' };
    const s = mk(['BACKGROUND', 'ADD', 'ADD', 'CLEAN', 'ADD', 'ADD'], {
      curtains: [{ seq: 3, objs: ['paper'] }],
      canvasBackStuffs: { paper },
    });
    s.contents[1].obj = other; // 1번 컷 연습지: 백그라운드 유지 대상 아님
    await enter(s, 5);
    const adds = mockPosted.filter((m) => m.actionType === 'ADD');
    expect(adds.some((m) => m.obj?.id === 'paper')).toBe(true);
    expect(adds.some((m) => m.obj?.id === 'other-paper')).toBe(false);
  });

  it('진입 후 같은 스크립트의 다음 지점은 이전 지점 이후만 재생', async () => {
    const ref = await enter(mk(['BACKGROUND', 'ADD', 'ADD', 'CLEAN', 'ADD', 'ADD', 'ADD']), 5);
    mockPosted.length = 0;
    await act(async () => ref.current.onReceiveGuide({ scriptId: 12, sourceType: 'UNIT', sourceId: 1, studyIdx: 6, step: 'main' }));
    await waitFor(() => expect(trace()).toContain('c6'));
    const t = trace();
    expect(t).not.toContain('c3');
    expect(t).not.toContain('c1');
    expect(t).not.toContain('BG');
  });

  // topic은 마운트 때 첫 스크립트를 재생 없이 열어 둔다(핫라인은 guide로만 연다)
  (_n === 'topic' ? it : it.skip)('열려 있고 재생 기록이 없으면 ctx.playToPoint도 리셋 컷부터', async () => {
    const ref = await mount(mk(['BACKGROUND', 'ADD', 'ADD', 'CLEAN', 'ADD', 'ADD']));
    await act(async () => ref.current.onReceiveGuide({ sourceType: 'UNIT', sourceId: 1, studyIdx: 5, step: 'main' }));
    await waitFor(() => expect(trace()).toContain('c5'));
    expect(trace()).not.toContain('c1');
    expect(trace()).not.toContain('c2');
    expect(trace()).toContain('c3');
  });
});

describe('템플릿 clearCanvas 분기', () => {
  const fs = require('fs');
  const path = require('path');
  const clause = (f: string, label: string) => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src/kit/canvas/templates', f), 'utf8');
    const m = src.match(new RegExp(`((?:case '[A-Z_]+':\\s*)+)\\s*clearCanvas\\(\\);`));
    return m && m[1].includes(`'${label}'`);
  };
  it.each([['live-class-canvas-template.ts', ['CLEAR', 'CLEAN_SCENE', 'CLEAN']], ['topic-canvas-template.ts', ['CLEAR', 'CLEAN']]])('%s', (f, labels) => {
    for (const l of labels as string[]) expect(clause(f as string, l)).toBe(true);
  });
});
