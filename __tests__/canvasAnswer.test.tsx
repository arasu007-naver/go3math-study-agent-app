import { render, screen } from '@testing-library/react-native';

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: (props: any) => <View testID="answer-webview" accessibilityLabel={props.source?.uri} accessibilityHint={props.injectedJavaScript ? 'styled' : 'plain'} /> };
});
jest.mock('../src/kit/math/MathJaxWrapper', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: (p: any) => <Text testID="statement">{p.statement}</Text> };
});

import { CanvasAnswer } from '../src/kit/canvas/CanvasAnswer';

describe('CanvasAnswer', () => {
  it('shows the answer page, styled like the concept box, for a problem', async () => {
    const fetchConcept = jest.fn();
    await render(<CanvasAnswer sourceType="UNIT" sourceId={101} fetchConcept={fetchConcept} />);
    const web = screen.getByTestId('answer-webview');
    expect(web.props.accessibilityLabel).toMatch(/unit-answer\/101$/);
    expect(web.props.accessibilityHint).toBe('styled');
    expect(fetchConcept).not.toHaveBeenCalled();
  });

  it.each(['MATH_CONCEPT', 'CONCEPT'])('shows the concept description instead for %s', async (sourceType) => {
    const fetchConcept = jest.fn(async () => ({ rawStatement: '설명', imgPath: '' }));
    await render(<CanvasAnswer sourceType={sourceType} sourceId={7} fetchConcept={fetchConcept} />);
    expect((await screen.findByTestId('statement')).props.children).toBe('설명');
    expect(fetchConcept).toHaveBeenCalledWith(7);
    expect(screen.queryByTestId('answer-webview')).toBeNull();
  });
});
