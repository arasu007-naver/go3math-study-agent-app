import { StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { colors } from '../src/ui/theme';

const mockWebView: { onMessage?: (e: any) => void; onLoadEnd?: () => void; html?: string; postMessage: jest.Mock } = { postMessage: jest.fn() };
jest.mock('react-native-webview', () => {
  const React = require('react');
  return {
    WebView: React.forwardRef((props: any, ref: any) => {
      mockWebView.onMessage = props.onMessage;
      mockWebView.onLoadEnd = props.onLoadEnd;
      mockWebView.html = props.source?.html;
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
const mockApiV3 = jest.fn();
jest.mock('../src/api/rest/apiV3', () => {
  const actual = jest.requireActual('../src/api/rest/apiV3');
  return { ...actual, apiV3: (...a: unknown[]) => mockApiV3(...a) };
});
const { ApiV3Error } = jest.requireActual('../src/api/rest/apiV3');

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

  describe('답 보내기 경로', () => {
    beforeEach(() => {
      mockUpload.mockResolvedValue('https://answer');
      mockApiV3.mockResolvedValue({ id: 31 });
    });

    it('Java API로 풀이 올리기와 같은 task id를 함께 보낸다', async () => {
      const onSubmitted = jest.fn();
      await render(<QuizResponseModal {...props} onSubmitted={onSubmitted} resolveTaskId={async () => 77} />);
      await sendDrawing();
      await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
      expect(mockApiV3).toHaveBeenCalledWith('/api/live-class-quizzes/3/responses', 't', { method: 'POST', body: { answerUrl: 'https://answer', taskId: 77 } });
      expect(mockAddResponse).not.toHaveBeenCalled();
    });

    it('task를 확보하지 못하면 task id 없이 Java API로 보낸다', async () => {
      const onSubmitted = jest.fn();
      await render(<QuizResponseModal {...props} onSubmitted={onSubmitted} resolveTaskId={async () => { throw new Error('x'); }} />);
      await sendDrawing();
      await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
      expect(mockApiV3).toHaveBeenCalledWith('/api/live-class-quizzes/3/responses', 't', { method: 'POST', body: { answerUrl: 'https://answer' } });
    });

    it('Java에 닿지 못하면(404) GraphQL로 task id 없이 보낸다', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockApiV3.mockRejectedValueOnce(new ApiV3Error(404, 'not found'));
      const onSubmitted = jest.fn();
      await render(<QuizResponseModal {...props} onSubmitted={onSubmitted} resolveTaskId={async () => 77} />);
      await sendDrawing();
      await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
      expect(mockAddResponse).toHaveBeenCalledWith({ variables: { quizId: 3, answerUrl: 'https://answer' } });
    });

    it('400 같은 요청 오류는 GraphQL로 다시 보내지 않고 알린다', async () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      mockApiV3.mockRejectedValueOnce(new ApiV3Error(400, '퀴즈를 찾을 수 없습니다'));
      const onError = jest.fn();
      await render(<QuizResponseModal {...props} onError={onError} resolveTaskId={async () => 77} />);
      await sendDrawing();
      await waitFor(() => expect(onError).toHaveBeenCalledWith('퀴즈를 찾을 수 없습니다'));
      expect(mockAddResponse).not.toHaveBeenCalled();
    });

    it('토큰이 없으면 GraphQL로 보낸다', async () => {
      const onSubmitted = jest.fn();
      await render(<QuizResponseModal {...props} appToken="" onSubmitted={onSubmitted} />);
      await sendDrawing();
      await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
      expect(mockApiV3).not.toHaveBeenCalled();
      expect(mockAddResponse).toHaveBeenCalledWith({ variables: { quizId: 3, answerUrl: 'https://answer' } });
    });
  });
});

describe('QuizResponseModal imageUrl', () => {
  it('sends SET_BACKGROUND after the WebView loads when imageUrl is set', async () => {
    await render(<QuizResponseModal quiz={{ quizId: 4, content: 'c', imageUrl: 'https://x/a.jpeg' }} appToken="t" onClose={jest.fn()} />);
    expect(mockWebView.postMessage).not.toHaveBeenCalled();
    await act(async () => mockWebView.onLoadEnd?.());
    expect(mockWebView.postMessage).toHaveBeenCalledWith(JSON.stringify({ type: 'SET_BACKGROUND', url: 'https://x/a.jpeg' }));
  });
  it('does not send SET_BACKGROUND without imageUrl', async () => {
    await render(<QuizResponseModal quiz={{ quizId: 4, content: 'c' }} appToken="t" onClose={jest.fn()} />);
    await act(async () => mockWebView.onLoadEnd?.());
    expect(mockWebView.postMessage).not.toHaveBeenCalled();
  });
  it('IMAGE_ERROR reports 이미지를 불러오지 못했습니다.', async () => {
    const onError = jest.fn();
    await render(<QuizResponseModal quiz={{ quizId: 4, content: 'c', imageUrl: 'u' }} appToken="t" onClose={jest.fn()} onError={onError} />);
    await act(async () => {
      mockWebView.onMessage?.({ nativeEvent: { data: JSON.stringify({ type: 'IMAGE_ERROR' }) } });
    });
    expect(onError).toHaveBeenCalledWith('이미지를 불러오지 못했습니다.');
    expect(mockUpload).not.toHaveBeenCalled();
  });
});

describe('QuizResponseModal imageUrl: 배경 유지와 제출', () => {
  const imgProps = { quiz: { quizId: 5, content: '중요한 부분에 표시하시오', imageUrl: 'https://x/a.jpeg' }, appToken: 't', onClose: jest.fn() };
  const send = (m: object) => act(async () => { mockWebView.onMessage?.({ nativeEvent: { data: JSON.stringify(m) } }); });

  it('배경만 있고 필기가 없으면 답안을 작성해 주세요가 뜨고 업로드하지 않는다', async () => {
    const onError = jest.fn();
    await render(<QuizResponseModal {...imgProps} onError={onError} />);
    await send({ type: 'IMAGE_DATA', hasDrawn: false, dataUrl: 'data:bg' });
    expect(onError).toHaveBeenCalledWith('답안을 작성해 주세요.');
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('필기 후 제출하면 합쳐진 PNG를 올리고 quizId로 제출한 뒤 닫는다', async () => {
    mockUpload.mockResolvedValue('https://answer');
    mockApiV3.mockResolvedValue({ id: 1 });
    const onClose = jest.fn();
    const onSubmitted = jest.fn();
    await render(<QuizResponseModal {...imgProps} onClose={onClose} onSubmitted={onSubmitted} />);
    await send({ type: 'IMAGE_DATA', hasDrawn: true, dataUrl: 'data:merged' });
    await waitFor(() => expect(onSubmitted).toHaveBeenCalled());
    expect(mockUpload).toHaveBeenCalledWith('data:merged', 't', 5, undefined);
    expect(mockApiV3).toHaveBeenCalledWith('/api/live-class-quizzes/5/responses', 't', { method: 'POST', body: { answerUrl: 'https://answer' } });
    expect(onClose).toHaveBeenCalled();
  });

  it('지우기는 CLEAR를 보내고 HTML은 CLEAR/resize에서 배경을 다시 그리며 hasDrawn만 초기화한다', async () => {
    await render(<QuizResponseModal {...imgProps} />);
    await fireEvent.press(screen.getByRole('button', { name: '지우기' }));
    expect(mockWebView.postMessage).toHaveBeenCalledWith(JSON.stringify({ type: 'CLEAR' }));
    const html = mockWebView.html!;
    expect(html).toMatch(/data\.type === 'CLEAR'\) \{\s*drawBackground\(\);\s*hasDrawn = false;/);
    expect(html).toMatch(/ctx\.scale\(dpr, dpr\);\s*drawBackground\(\);/);
    expect(html).toContain("img.crossOrigin = 'anonymous'");
    expect(html).toContain('Math.min(rect.width / bgImage.naturalWidth');
    expect(html).toMatch(/function setBackground[\s\S]*?img\.onload[^\n]*hasDrawn|function setBackground/);
    expect(html).not.toMatch(/img\.onload[^\n]*hasDrawn = true/);
  });
});
