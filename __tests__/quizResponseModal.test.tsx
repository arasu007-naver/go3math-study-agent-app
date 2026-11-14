import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { colors } from '../src/ui/theme';

const mockWebView: { onMessage?: (e: any) => void; postMessage: jest.Mock } = { postMessage: jest.fn() };
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: React.forwardRef((props: any, ref: any) => {
      mockWebView.onMessage = props.onMessage;
      React.useImperativeHandle(ref, () => ({ postMessage: mockWebView.postMessage }));
      return null;
    }),
  };
});
jest.mock('../src/kit/math/MathJaxWrapper', () => () => null);
const mockUpload = jest.fn();
jest.mock('../src/kit/canvas/note-canvas/canvas-utils', () => ({ uploadQuizAnswerToStorage: (...a: unknown[]) => mockUpload(...a) }));
const mockAddResponse = jest.fn();
jest.mock('@apollo/client/react', () => ({ useMutation: () => [mockAddResponse] }));

import QuizResponseModal from '../src/kit/live-class/QuizResponseModal';

const bg = (name: string) => StyleSheet.flatten(screen.getByRole('button', { name }).props.style).backgroundColor;
const state = (name: string) => screen.getByRole('button', { name }).props.accessibilityState;
const sendDrawing = () =>
  act(async () => {
    mockWebView.onMessage?.({ nativeEvent: { data: JSON.stringify({ type: 'IMAGE_DATA', hasDrawn: true, dataUrl: 'data:x' }) } });
  });

beforeEach(() => jest.clearAllMocks());

describe('QuizResponseModal', () => {
  const props = { quiz: { quizId: 3, content: 'x^2' }, appToken: 't', onClose: jest.fn(), onError: jest.fn() };

  it('close is an IconButton labelled 퀴즈 닫기', async () => {
    const onClose = jest.fn();
    await render(<QuizResponseModal {...props} onClose={onClose} />);
    await fireEvent.press(screen.getByRole('button', { name: '퀴즈 닫기' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('지우기 is a secondary Button and 답 보내기 a primary Button', async () => {
    await render(<QuizResponseModal {...props} />);
    expect(bg('지우기')).toBe(colors.rail);
    expect(bg('답 보내기')).toBe(colors.accent);
    await fireEvent.press(screen.getByRole('button', { name: '답 보내기' }));
    expect(mockWebView.postMessage).toHaveBeenCalledWith(JSON.stringify({ type: 'GET_IMAGE' }));
  });

  it('while sending: submit is busy, close and 지우기 are disabled, no 보내는 중 text', async () => {
    let release!: (v: string) => void;
    mockUpload.mockImplementationOnce(() => new Promise<string>((r) => (release = r)));
    await render(<QuizResponseModal {...props} />);
    await sendDrawing();
    await waitFor(() => expect(state('답 보내기')).toMatchObject({ busy: true }));
    expect(state('퀴즈 닫기')).toMatchObject({ disabled: true });
    expect(state('지우기')).toMatchObject({ disabled: true });
    expect(screen.queryByText(/보내는 중/)).toBeNull();
    await act(async () => release('https://answer'));
  });

  it('after a failed send the buttons are usable again', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockUpload.mockRejectedValueOnce(new Error('네트워크'));
    const onError = jest.fn();
    await render(<QuizResponseModal {...props} onError={onError} />);
    await sendDrawing();
    await waitFor(() => expect(onError).toHaveBeenCalledWith('네트워크'));
    expect(state('답 보내기')).toMatchObject({ busy: false, disabled: false });
    expect(state('퀴즈 닫기')).toMatchObject({ disabled: false });
    expect(state('지우기')).toMatchObject({ disabled: false });
  });
});
