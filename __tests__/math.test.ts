import { buildMathJaxHtmlDocument, cleanMathText } from '../src/kit/math/MathJaxWrapper';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

describe('kit/math (migrated from components/math/math-wrapper.tsx)', () => {
  it('cleans entities, tags and common LaTeX', () => {
    expect(cleanMathText('&lt;b&gt;$x \\le 2$<br/>')).toBe('x ≤ 2');
    expect(cleanMathText('\\frac{a}{b} \\times \\pi')).toBe('(a)/(b) × π');
  });

  it('rewrites hwp images to blob URLs and keeps title/statement', () => {
    const html = buildMathJaxHtmlDocument({ title: 'T', statement: '<img hwp-img-id="abc_1">', iPath: 'concept' });
    expect(html).toContain('math-files/images/concept/abc_1.jpg');
    expect(html).toContain('<div class="concept-title-card">T</div>');
  });

  it('adds the size reporter only in compact mode', () => {
    expect(buildMathJaxHtmlDocument({ statement: 'x', compact: true })).toContain('content_size');
    expect(buildMathJaxHtmlDocument({ statement: 'x' })).not.toContain('content_size');
  });
});
