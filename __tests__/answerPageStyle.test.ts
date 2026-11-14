import fs from 'fs';
import path from 'path';
import { ANSWER_BUBBLE_FONT_JS, ANSWER_PAGE_STYLE_JS } from '../src/kit/ui/answerPageStyle';

// 해답 페이지(WebView)를 개념 설명 상자와 같은 모양으로: 같은 여백·테두리, 시트 폭을 다 쓴다
describe('ANSWER_PAGE_STYLE_JS', () => {
  it('gives the page body the concept statement box and the full width', () => {
    for (const rule of ['margin:14px 12px 32px 12px !important', 'border:1.5px solid #fed7aa', 'border-radius:12px', 'background-color:#f9fafb', 'width:auto !important', 'max-width:none !important']) {
      expect(ANSWER_PAGE_STYLE_JS).toContain(rule);
    }
    // Android WebView는 주입 스크립트가 값을 돌려줘야 한다
    expect(ANSWER_PAGE_STYLE_JS.trim().endsWith('true;')).toBe(true);
  });

  it('uses the same border as the concept statement card', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src/kit/math/MathJaxWrapper.tsx'), 'utf8');
    expect(src).toContain('border: 1.5px solid #fed7aa;');
  });

  it('the shared canvas answer WebView injects it', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src/kit/canvas/CanvasAnswer.tsx'), 'utf8');
    expect(src).toMatch(/source=\{\{ uri: answerUrl \}\}\s*injectedJavaScript=\{ANSWER_PAGE_STYLE_JS\}/);
  });
});

// Stage 문제 목록의 해답 말풍선: 해답 페이지 글자를 2/3로
describe('ANSWER_BUBBLE_FONT_JS', () => {
  it('scales the page body font to two thirds', () => {
    const body = { style: {} as Record<string, string> };
    const run = new Function('document', 'window', ANSWER_BUBBLE_FONT_JS);
    run({ body }, { getComputedStyle: () => ({ fontSize: '24px' }) });
    expect(body.style.fontSize).toBe('16px');
  });

  it('the answer bubble WebView injects it', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'src/kit/problem-list/AnswerBubble.tsx'), 'utf8');
    expect(src).toMatch(/injectedJavaScript=\{ANSWER_BUBBLE_FONT_JS\}/);
  });
});
