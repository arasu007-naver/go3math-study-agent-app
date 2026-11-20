import { act, render, waitFor } from '@testing-library/react-native';
import { createRef } from 'react';

jest.mock('react-native/Libraries/Components/ActivityIndicator/ActivityIndicator', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: () => <View testID="loading" /> };
});
let mockWebViewRendered = false;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 800, height: 1280, scale: 1, fontScale: 1 }) }));
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: React.forwardRef((_p: any, ref: any) => {
      mockWebViewRendered = true;
      React.useImperativeHandle(ref, () => ({ postMessage: () => {} }));
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
import { scriptMaker, makeTemporaryScript } from '../src/kit/canvas/note-canvas/script-maker';
import HotlineClassCanvasPanel from '../src/kit/canvas/note-canvas/hotline-class-canvas';

const scripts = [
  { id: 12, sourceType: 'UNIT', sourceId: 1, releaseScriptUrl: 'u12' },
  { sourceType: 'UNIT', sourceId: 2 },
  { sourceType: 'UNIT', sourceId: 3 },
  { id: -9092, sourceType: 'UNIT', sourceId: 4, releaseScriptUrl: 'd' },
];
const unit = (sourceId: number, extra: any = {}) => ({ action: 'refresh', step: 'refresh', studyIdx: 0, scriptId: 0, sourceType: 'UNIT', sourceId, ...extra });
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 60)); });

describe('hotline 스크립트 없는 유닛(scriptId 0)', () => {
  let changeUnit: jest.Mock;
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebViewRendered = false;
    changeUnit = jest.fn();
    (storage as any).store['live-scripts'] = JSON.stringify(scripts);
    delete (storage as any).store.syncPoint;
  });
  const mount = async () => {
    const ref = createRef<any>();
    const r = await render(<HotlineClassCanvasPanel ref={ref} topicUnits={[]} changeUnit={changeUnit} />);
    return { ref, r };
  };

  it('id 12 유닛에서 scriptId 0 guide로 전환한다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide({ ...unit(1), scriptId: 12 }));
    await settle();
    (makeTemporaryScript as jest.Mock).mockClear();
    await act(async () => ref.current.onReceiveGuide(unit(2)));
    await waitFor(() => expect(makeTemporaryScript).toHaveBeenCalledWith('UNIT', 2));
    await waitFor(() => expect(changeUnit).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 'UNIT', sourceId: 2 })));
  });

  it('재진입: 새로 마운트해 guide 하나만 받아도 로딩이 사라진다', async () => {
    const { ref, r } = await mount();
    expect(r.queryByTestId('loading')).not.toBeNull();
    await act(async () => ref.current.onReceiveGuide(unit(2)));
    await waitFor(() => expect(makeTemporaryScript).toHaveBeenCalledWith('UNIT', 2));
    await waitFor(() => expect(mockWebViewRendered).toBe(true));
    expect(r.queryByTestId('loading')).toBeNull();
  });

  it('scriptId 키가 없어도 전환한다', async () => {
    const { ref } = await mount();
    const g: any = unit(2);
    delete g.scriptId;
    await act(async () => ref.current.onReceiveGuide(g));
    await waitFor(() => expect(makeTemporaryScript).toHaveBeenCalledWith('UNIT', 2));
  });

  it('같은 source면 다시 전환하지 않는다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide(unit(2)));
    await waitFor(() => expect(makeTemporaryScript).toHaveBeenCalledTimes(1));
    await settle();
    await act(async () => ref.current.onReceiveGuide(unit(2)));
    await settle();
    expect(makeTemporaryScript).toHaveBeenCalledTimes(1);
  });

  it('스크립트 없는 유닛 A에서 B로 전환한다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide(unit(2)));
    await waitFor(() => expect(makeTemporaryScript).toHaveBeenCalledWith('UNIT', 2));
    await settle();
    await act(async () => ref.current.onReceiveGuide(unit(3)));
    await waitFor(() => expect(makeTemporaryScript).toHaveBeenCalledWith('UNIT', 3));
  });

  it('scriptId 0 유닛에서 scriptId 12로 돌아가면 u12로 연다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide(unit(2)));
    await settle();
    await act(async () => ref.current.onReceiveGuide({ ...unit(1), scriptId: 12 }));
    await waitFor(() => expect(scriptMaker).toHaveBeenCalledWith('u12'));
  });

  it('음수 id guide는 id로 전환해 scriptMaker를 d로 호출한다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide({ ...unit(4), scriptId: -9092 }));
    await waitFor(() => expect(scriptMaker).toHaveBeenCalledWith('d'));
    expect(makeTemporaryScript).not.toHaveBeenCalled();
  });

  it('CLASS_ON_AIR scriptId 0이고 source가 다르면 그 유닛으로 전환한다', async () => {
    const { ref } = await mount();
    await act(async () => ref.current.onReceiveGuide({ action: 'CLASS_ON_AIR', scriptId: 0, studyIdx: 0, step: 'main', mode: 'main', sourceType: 'UNIT', sourceId: 3 }));
    await waitFor(() => expect(makeTemporaryScript).toHaveBeenCalledWith('UNIT', 3));
  });
});
