import { act, render, waitFor } from '@testing-library/react-native';
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
    WebView: React.forwardRef((_p: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ postMessage: (m: string) => void mockPosted.push(JSON.parse(m)) }));
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
  };
});

import { storage } from '../src/kit/canvas/note-canvas/legacy';
import HotlineClassCanvasPanel from '../src/kit/canvas/note-canvas/hotline-class-canvas';

const scripts = [
  { id: 12, sourceType: 'UNIT', sourceId: 1, releaseScriptUrl: 'u12' },
  { sourceType: 'UNIT', sourceId: 2 },
];
const fly = { id: 'fly:1', type: 'image', src: 'https://example.test/comment.png' };
const adhoc = (extra: any) => ({ action: 'adhoc', mode: 'fly', fly, studyIdx: 0, step: 'main', ...extra });
const settle = () => act(async () => { await new Promise((r) => setTimeout(r, 60)); });
const flies = () => mockPosted.filter((m) => m.actionType === 'FLY');

// 선생님 웹은 스크립트 없는 유닛의 guide를 scriptId 0으로 보낸다. 주석(flying object)은 adhoc guide로 오고
// 공용 처리기(handleLiveClassMessage)가 캔버스에 FLY로 넘긴다 — 실제 처리기로 검증한다
describe('hotline 주석(adhoc) 전달', () => {
  beforeEach(() => {
    mockPosted.length = 0;
    (storage as any).store['live-scripts'] = JSON.stringify(scripts);
    delete (storage as any).store.syncPoint;
  });
  const open = async (unitGuide: any) => {
    const ref = createRef<any>();
    await render(<HotlineClassCanvasPanel ref={ref} topicUnits={[]} changeUnit={jest.fn()} />);
    await act(async () => ref.current.onReceiveGuide(unitGuide));
    await settle();
    return ref;
  };

  it('스크립트 있는 유닛(scriptId 12)에서 주석이 캔버스로 간다', async () => {
    const ref = await open({ action: 'refresh', step: 'refresh', studyIdx: 0, scriptId: 12, sourceType: 'UNIT', sourceId: 1 });
    await act(async () => ref.current.onReceiveGuide(adhoc({ scriptId: 12, sourceType: 'UNIT', sourceId: 1 })));
    await waitFor(() => expect(flies()).toHaveLength(1));
    expect(flies()[0].obj).toEqual(expect.objectContaining({ id: 'fly:1' }));
  });

  it('스크립트 없는 유닛(scriptId 0)에서도 주석이 캔버스로 간다', async () => {
    const ref = await open({ action: 'refresh', step: 'refresh', studyIdx: 0, scriptId: 0, sourceType: 'UNIT', sourceId: 2 });
    await act(async () => ref.current.onReceiveGuide(adhoc({ scriptId: 0, sourceType: 'UNIT', sourceId: 2 })));
    await waitFor(() => expect(flies()).toHaveLength(1));
    expect(flies()[0].obj).toEqual(expect.objectContaining({ id: 'fly:1' }));
  });
});
