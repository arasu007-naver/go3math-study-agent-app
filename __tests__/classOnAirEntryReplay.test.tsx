import { act, render, waitFor } from '@testing-library/react-native';
import { createRef } from 'react';

const mockLog: any[] = [];
const mockPosted: any[] = [];
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: React.forwardRef((_p: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ postMessage: (m: string) => { const j = JSON.parse(m); mockPosted.push(j); mockLog.push(j.actionType + (j.obj?.id ? ':' + j.obj.id : '')); } }));
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
    sleep: jest.fn(async (ms: number) => { mockLog.push('sleep' + ms); }),
    findLargestSmallerThan: jest.fn(() => 0),
  };
});
let mockMenu: any = {};
jest.mock('../src/kit/canvas/note-canvas/script-maker', () => {
  const actual = jest.requireActual('@qoolla/script-parser');
  return {
    ...actual,
    scriptMaker: jest.fn(async () => ({ ...mockMenu })),
    makeTemporaryScript: jest.fn(() => mockMenu),
    safeJsonParse: (s: any, d: any) => d,
    handleLiveClassMessage: jest.fn(async () => {}),
    runAt: jest.fn(),
  };
});

import fs from 'fs';
import { storage } from '../src/kit/canvas/note-canvas/legacy';
import HotlineClassCanvasPanel from '../src/kit/canvas/note-canvas/hotline-class-canvas';
import TopicLiveClassCanvasPanel from '../src/kit/canvas/note-canvas/topic-live-canvas';

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
      curtains: [{ seq: 3, objs: [{ id: 'paper' }, { id: 'other' }] }, { seq: 1, objs: [{ id: 'x' }] }],
      canvasBackStuffs: { paper: true },
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
