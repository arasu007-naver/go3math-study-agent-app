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
