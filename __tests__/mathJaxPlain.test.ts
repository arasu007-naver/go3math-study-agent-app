import { buildMathJaxHtmlDocument } from '../src/kit/math/MathJaxWrapper';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

describe('buildMathJaxHtmlDocument plain', () => {
  const PLAIN = '.concept-statement-card { border: none; background-color: transparent; padding: 0; }';
  it('drops the statement box border only when plain', () => {
    expect(buildMathJaxHtmlDocument({ statement: 'x', plain: true })).toContain(PLAIN);
    expect(buildMathJaxHtmlDocument({ statement: 'x' })).not.toContain(PLAIN);
  });
});
