import { render, screen } from '@testing-library/react-native';

const mem: Record<string, string> = {};
jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: (k: string) => mem[k], set: (k: string, v: string) => void (mem[k] = v), remove: (k: string) => void delete mem[k] }) }));
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: (props: any) => <View testID="answer-webview" accessibilityLabel={props.source?.uri} /> };
});
jest.mock('../src/kit/math/MathJaxWrapper', () => ({ __esModule: true, default: () => null }));

import { CanvasAnswer } from '../src/kit/canvas/CanvasAnswer';
import { bumpContentVersions } from '../src/kit/problem-list/contentVersion';

beforeEach(() => {
  for (const k of Object.keys(mem)) delete mem[k];
});

describe('content version', () => {
  it('CanvasAnswer uses the versioned answer url only for refreshed problems', async () => {
    const { unmount } = await render(<CanvasAnswer sourceType="UNIT" sourceId={101} fetchConcept={jest.fn()} />);
    expect(screen.getByTestId('answer-webview').props.accessibilityLabel).toMatch(/unit-answer\/101$/);
    await unmount();
    bumpContentVersions([{ sourceType: 'UNIT', sourceId: 101 }], 777);
    await render(<CanvasAnswer sourceType="UNIT" sourceId={101} fetchConcept={jest.fn()} />);
    expect(screen.getByTestId('answer-webview').props.accessibilityLabel).toMatch(/unit-answer\/101\?v=777$/);
  });

  it('persists across module reloads', () => {
    bumpContentVersions([{ sourceType: 'UNIT', sourceId: 5 }], 42);
    jest.isolateModules(() => {
      const fresh = require('../src/kit/problem-list/contentVersion');
      expect(fresh.versionedUrl('https://a/5.png', 'UNIT', 5)).toBe('https://a/5.png?v=42');
    });
  });
});
