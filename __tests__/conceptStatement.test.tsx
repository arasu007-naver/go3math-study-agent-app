import { render, screen } from '@testing-library/react-native';
import { ConceptStatement, isConceptType } from '../src/kit/concepts/ConceptStatement';

jest.mock('../src/kit/math/MathJaxWrapper', () => {
  const { Text } = require('react-native');
  return { __esModule: true, default: (p: any) => <Text testID="statement">{`${p.titleStatement ?? ''}|${p.statement}|${p.plain ? 'plain' : 'boxed'}`}</Text> };
});

describe('ConceptStatement', () => {
  it('treats MATH_CONCEPT and CONCEPT as concepts', () => {
    expect(['MATH_CONCEPT', 'CONCEPT', 'UNIT', 'MATH_ESSAY'].map(isConceptType)).toEqual([true, true, false, false]);
  });

  it('fetches the concept and shows only its description, boxed unless plain', async () => {
    const fetchConcept = jest.fn(async () => ({ rawStatement: '설명', imgPath: '' }));
    await render(<ConceptStatement conceptId={7} fetchConcept={fetchConcept} />);
    expect((await screen.findByTestId('statement')).props.children).toBe('|설명|boxed');
    expect(fetchConcept).toHaveBeenCalledWith(7);
  });

  it('says so when the concept cannot be loaded', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<ConceptStatement conceptId={7} fetchConcept={async () => Promise.reject(new Error('x'))} />);
    expect(await screen.findByText('개념 내용을 불러오지 못했어요.')).toBeTruthy();
  });
});
