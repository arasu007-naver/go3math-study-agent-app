import { StyleSheet } from 'react-native';
import { act, render, screen } from '@testing-library/react-native';

const mockWebView: { onMessage?: (e: any) => void; html?: string } = {};
jest.mock('react-native-webview', () => ({
  WebView: (props: any) => {
    mockWebView.onMessage = props.onMessage;
    mockWebView.html = props.source.html;
    return null;
  },
}));

import MathJaxWrapper from '../src/kit/math/MathJaxWrapper';

const height = () => StyleSheet.flatten((screen.toJSON() as any).props.style).height;
const reportHeight = (h: number) =>
  act(async () => {
    mockWebView.onMessage?.({ nativeEvent: { data: JSON.stringify({ type: 'content_height', height: h }) } });
  });

describe('MathJaxWrapper autoHeight', () => {
  it('렌더링된 내용 높이에 맞춰 커진다', async () => {
    await render(<MathJaxWrapper statement="긴 퀴즈" fontSize={32} fullView autoHeight maxHeight={400} />);
    expect(mockWebView.html).toContain('content_height');
    await reportHeight(260);
    expect(height()).toBe(260);
  });

  it('maxHeight를 넘지 않는다(넘는 내용은 WebView 안에서 스크롤)', async () => {
    await render(<MathJaxWrapper statement="아주 긴 퀴즈" fontSize={32} fullView autoHeight maxHeight={400} />);
    await reportHeight(900);
    expect(height()).toBe(400);
  });

  it('autoHeight가 아니면 높이 보고 스크립트를 넣지 않는다', async () => {
    await render(<MathJaxWrapper statement="개념" fullView />);
    expect(mockWebView.html).not.toContain('content_height');
  });
});
