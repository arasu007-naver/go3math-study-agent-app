import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

let mockWebViewProps: any = null;
jest.mock('react-native/Libraries/Utilities/useWindowDimensions', () => ({ __esModule: true, default: () => ({ width: 800, height: 1280, scale: 1, fontScale: 1 }) }));
jest.mock('react-native-webview', () => {
  const React = require('react');
  return { WebView: React.forwardRef((p: any, _r: any) => { mockWebViewProps = p; return null; }) };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 24, bottom: 0, left: 0, right: 0 }), SafeAreaView: ({ children }: any) => children }));
jest.mock('@react-navigation/native', () => ({ useNavigation: () => ({}), useIsFocused: () => true, useFocusEffect: () => {} }));
jest.mock('../src/kit/canvas/CanvasChrome', () => ({ CanvasChrome: () => null, canvasTool: (id: string) => ({ id }) }));
jest.mock('../src/kit/ui/go-button', () => () => null);
jest.mock('../src/kit/canvas/note-canvas/pencil-props-modal', () => () => null);
jest.mock('../src/kit/canvas/note-canvas/canvas-utils', () => ({
  strokeWidths: [3], strokeColors: ['orange'], INK_LABELS: {}, eraserWidth: () => 1, inkWidth: () => 1,
  sendBoardAction: jest.fn(), uploadWorkoutToStorage: jest.fn(), uploadSnapshotToStorage: jest.fn(),
}));
jest.mock('../src/kit/canvas/note-canvas/legacy', () => {
  const React = require('react');
  return {
    AppCtx: React.createContext({ state: { appToken: '' }, dispatch: () => {} }),
    storage: { getString: () => undefined, getNumber: () => undefined, set: jest.fn(), remove: jest.fn() },
  };
});

import Notebook from '../src/kit/canvas/note-canvas/notebook';
import { canvasStyles } from '../src/kit/canvas/note-canvas/canvasStyles';
import { layout } from '../src/ui/theme';

describe('Notebook 레이아웃', () => {
  it('WebView 크기·세로 여백 0·context 폭 1280', async () => {
    await render(<Notebook {...({ loaded: jest.fn() } as any)} />);
    const st = mockWebViewProps.style;
    expect(st.width).toBe(800 - 12);
    expect(st.height).toBe(1280 - 24 - layout.toolbarH);
    for (const k of ['padding', 'margin', 'marginVertical', 'paddingVertical']) expect(st[k] ?? 0).toBe(0);
    const html = mockWebViewProps.source.html;
    expect(html).toContain("width='1280'");
    expect(html).toContain(`height='${Math.round(((1280 - 24 - layout.toolbarH) * 1280) / (800 - 12))}'`);
  });
});

describe('공통 스타일', () => {
  it('frame/loading padding 0', () => {
    expect(StyleSheet.flatten(canvasStyles.frame).padding).toBe(0);
    expect(StyleSheet.flatten(canvasStyles.loading).padding).toBe(0);
  });
  it('ScreenWrapper wrapper는 flex-start', () => {
    const src = require('fs').readFileSync(require.resolve('../src/kit/canvas/note-canvas/screen-wrapper'), 'utf8');
    expect(src).toMatch(/justifyContent: 'flex-start'/);
  });
});
