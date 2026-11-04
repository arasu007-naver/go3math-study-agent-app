import { TOAST_MS, TOAST_PREVIEW_CHARS, toastPreview } from '../src/agent/TabletAgentLayer';

jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('react-native-blob-util', () => ({}));

describe('tutor toast (§4.6)', () => {
  it('uses the 6.4s default', () => expect(TOAST_MS).toBe(6400));

  it('cuts the preview to 30 characters', () => {
    expect(toastPreview('짧은 메시지')).toBe('짧은 메시지');
    const long = '두 번째 줄 식을 다시 확인해 보세요. 부호가 바뀌는 지점이 있어요.';
    const p = toastPreview(long);
    expect(p.length).toBe(TOAST_PREVIEW_CHARS);
    expect(p.endsWith('…')).toBe(true);
  });
});
