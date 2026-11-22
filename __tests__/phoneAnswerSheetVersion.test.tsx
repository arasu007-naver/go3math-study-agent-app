import { act, render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

const mem: Record<string, string> = {};
jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: (k: string) => mem[k], set: (k: string, v: string) => void (mem[k] = v), remove: (k: string) => void delete mem[k] }) }));
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  return {
    BottomSheetModal: React.forwardRef(({ children }: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({ present: () => {}, dismiss: () => {} }));
      return children;
    }),
    BottomSheetView: ({ children }: any) => children,
  };
});
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('../src/kit/ui/web-view', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: (p: any) => <View testID="sheet-web" accessibilityLabel={p.source.uri} /> };
});

import { useAnswerSheet } from '../src/phone/PhoneStudySheets';
import { bumpContentVersions } from '../src/kit/problem-list/contentVersion';

let api: ReturnType<typeof useAnswerSheet>;
function Host() {
  api = useAnswerSheet();
  return <View>{api.sheet}</View>;
}

beforeEach(() => {
  for (const k of Object.keys(mem)) delete mem[k];
});

describe('useAnswerSheet', () => {
  it('keeps the plain answer url until the problem is refreshed, then adds the same version', async () => {
    await render(<Host />);
    await act(async () => api.show({ sourceType: 'UNIT', sourceId: 8 }));
    expect(screen.getByTestId('sheet-web').props.accessibilityLabel).toMatch(/unit-answer\/8$/);
    bumpContentVersions([{ sourceType: 'UNIT', sourceId: 8 }], 99);
    await act(async () => api.show({ sourceType: 'UNIT', sourceId: 8 }));
    expect(screen.getByTestId('sheet-web').props.accessibilityLabel).toMatch(/unit-answer\/8\?v=99$/);
  });
});
