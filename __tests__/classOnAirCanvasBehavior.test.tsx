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
const mockPlayToPoint = jest.fn(async () => {});
const mockFastforward = jest.fn(async () => {});
const mockHandleLive = jest.fn(async (..._a: any[]) => {});
const mockCuts = () => ({ contents: [{ id: 'cut0' }, { id: 'cut1' }], backgroundCut: { actionType: 'BG' } });
jest.mock('../src/kit/canvas/note-canvas/script-maker', () => ({
  scriptMaker: jest.fn(async () => mockCuts()),
  makeTemporaryScript: jest.fn(() => mockCuts()),
  safeJsonParse: (s: any, d: any) => d,
  handleLiveClassMessage: (...a: any[]) => (mockHandleLive as any)(...a),
  playToPoint: (...a: any[]) => (mockPlayToPoint as any)(...a),
  fastforward: (...a: any[]) => (mockFastforward as any)(...a),
  isResetCut: (c: any) => ['CLEAN', 'CLEAN_SCENE', 'CLEAR'].includes(String(c?.actionType).toUpperCase()),
  runAt: jest.fn(),
  getLeaderIdForCut: jest.fn(),
}));

import { storage } from '../src/kit/canvas/note-canvas/legacy';
import HotlineClassCanvasPanel from '../src/kit/canvas/note-canvas/hotline-class-canvas';
import TopicLiveClassCanvasPanel from '../src/kit/canvas/note-canvas/topic-live-canvas';

const scripts = [
  { id: 12, sourceType: 'UNIT', sourceId: 1, releaseScriptUrl: 'u12' },
  { id: 13, sourceType: 'UNIT', sourceId: 2, releaseScriptUrl: 'u13' },
];
const onAir = (scriptId: number) => ({ action: 'CLASS_ON_AIR', scriptId, studyIdx: 0, step: 'main', sourceType: 'UNIT', sourceId: scriptId - 11 });

describe.each([
  ['hotline', HotlineClassCanvasPanel],
  ['topic', TopicLiveClassCanvasPanel],
])('%s canvas CLASS_ON_AIR', (_name, Panel: any) => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPosted.length = 0;
    (storage as any).store['live-scripts'] = JSON.stringify(scripts);
    delete (storage as any).store.syncPoint;
  });

  const mount = async () => {
    const ref = createRef<any>();
    await render(<Panel ref={ref} topicUnits={[]} changeUnit={jest.fn()} />);
    return ref;
  };

  it('다른 스크립트 → syncPoint 저장, 로드 후 cuts[0] main 재생(backgroundCut 먼저)', async () => {
    const ref = await mount();
    const g = onAir(12);
    await act(async () => ref.current.onReceiveGuide(g));
    expect((storage as any).set).toHaveBeenCalledWith('syncPoint', JSON.stringify(g));
    await waitFor(() => expect(mockFastforward).toHaveBeenCalled());
    const [seq, target] = mockFastforward.mock.calls[0] as any[];
    expect(seq).toHaveLength(2);
    expect(target).toMatchObject({ studyIdx: 0, step: 'main' });
    expect(mockPosted.some((m) => m.actionType === 'BG')).toBe(true);
    expect(mockHandleLive).not.toHaveBeenCalled();
  });

  it('같은 스크립트 → 이전 지점과 무관하게 ({0,main}, null)로 처음부터, handleLiveClassMessage 없음', async () => {
    const ref = await mount();
    await act(async () => ref.current.onReceiveGuide(onAir(12)));
    await waitFor(() => expect(mockFastforward).toHaveBeenCalledTimes(1));
    await act(async () => ref.current.onReceiveGuide({ scriptId: 12, studyIdx: 5, step: 'main' }));
    mockPlayToPoint.mockClear();
    mockFastforward.mockClear();
    mockHandleLive.mockClear();
    mockPosted.length = 0;
    (storage as any).set.mockClear();
    await act(async () => ref.current.onReceiveGuide(onAir(12)));
    await waitFor(() => expect(mockFastforward).toHaveBeenCalledTimes(1));
    const [seq, target] = mockFastforward.mock.calls[0] as any[];
    expect(seq).toHaveLength(2);
    expect(target).toEqual({ studyIdx: 0, step: 'main' });
    expect(mockPosted[0]).toEqual({ actionType: 'BG' });
    expect((storage as any).set).not.toHaveBeenCalledWith('syncPoint', expect.anything());
    expect(mockHandleLive).not.toHaveBeenCalled();
  });

  it('scriptId 0 + 다른 sourceType/sourceId → 유닛 전환 경로로 syncPoint 저장', async () => {
    const ref = await mount();
    const g = { action: 'CLASS_ON_AIR', scriptId: 0, studyIdx: 0, step: 'main', sourceType: 'UNIT', sourceId: 9 };
    await act(async () => ref.current.onReceiveGuide(g));
    expect((storage as any).set).toHaveBeenCalledWith('syncPoint', JSON.stringify(g));
  });

  it('진입 재생 뒤에는 playToPoint(이전 지점 → 새 지점), 진입 전에는 fastforward', async () => {
    const ref = await mount();
    await act(async () => ref.current.onReceiveGuide({ scriptId: 12, sourceType: 'UNIT', sourceId: 1, studyIdx: 1, step: 'main' }));
    await waitFor(() => expect(mockFastforward).toHaveBeenCalledTimes(1));
    expect(mockPlayToPoint).not.toHaveBeenCalled();
    mockHandleLive.mockImplementationOnce(async (g: any, ctx: any) => ctx.playToPoint(g));
    await act(async () => ref.current.onReceiveGuide({ scriptId: 12, sourceType: 'UNIT', sourceId: 1, studyIdx: 6, step: 'main' }));
    expect(mockPlayToPoint).toHaveBeenCalledTimes(1);
    expect(mockFastforward).toHaveBeenCalledTimes(1);
  });
});
