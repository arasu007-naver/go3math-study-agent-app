import React, { useState } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react-native';

jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('../src/kit/math/MathJaxWrapper', () => {
  const { Text } = require('react-native');
  return {
    __esModule: true,
    ...jest.requireActual('../src/kit/math/MathJaxWrapper'),
    default: (p: any) => <Text testID="concept-detail">{`${p.titleStatement}|${p.statement}`}</Text>,
  };
});

import { ConceptLookupPanel, type ConceptFetchers } from '../src/kit/concepts/ConceptLookupPanel';

const concepts: Record<number, any[]> = {
  10: [
    { id: 100, rawTitle: '지수법칙', rawStatement: 'a^m a^n', imgPath: '' },
    { id: 101, rawTitle: '거듭제곱근', rawStatement: 'root', imgPath: '' },
  ],
  11: [{ id: 110, rawTitle: '로그 정의', rawStatement: 'log_a b', imgPath: '' }],
};
const fakeFetchers: ConceptFetchers = {
  fetchSubjects: async () => [{ id: 1, title: '수학I' }] as any,
  fetchChapters: async () => [{ id: 10, chapterName: '지수' }, { id: 11, chapterName: '로그' }] as any,
  fetchConcepts: async (id) => concepts[id] as any,
};

// 고른 개념은 부모(CanvasStudySheet)가 든다
function Harness({ fetchers = fakeFetchers }: { fetchers?: ConceptFetchers }) {
  const [picked, setPicked] = useState<any[]>([]);
  return <ConceptLookupPanel fetchers={fetchers} picked={picked} onPickedChange={setPicked} />;
}

describe('ConceptLookupPanel - chapter tooltip and picked chips', () => {
  it('shows no concept list until a chapter is pressed', async () => {
    await render(<Harness />);
    await screen.findByText('지수');
    expect(screen.queryByTestId('concept-tooltip')).toBeNull();
    expect(screen.getByText('단원을 누르고 개념을 고르면 여기에 모입니다.')).toBeTruthy();
    expect(screen.getByText('개념을 누르면 여기에 설명이 나옵니다.')).toBeTruthy();
  });

  it('pressing a chapter opens the tooltip with its concepts; pressing outside closes it', async () => {
    await render(<Harness />);
    await fireEvent.press(await screen.findByText('지수'));
    expect(screen.getByTestId('concept-tooltip')).toBeTruthy();
    await screen.findByText('지수법칙');
    await fireEvent.press(screen.getByLabelText('개념 목록 닫기'));
    expect(screen.queryByTestId('concept-tooltip')).toBeNull();
  });

  it('picking a concept closes the tooltip, adds an X chip and shows the explanation', async () => {
    await render(<Harness />);
    await fireEvent.press(await screen.findByText('지수'));
    await fireEvent.press(await screen.findByText('지수법칙'));
    expect(screen.queryByTestId('concept-tooltip')).toBeNull();
    expect(screen.getByLabelText('지수법칙 빼기')).toBeTruthy();
    expect(screen.getByTestId('concept-detail').props.children).toBe('지수법칙|a^m a^n');
  });

  it('picked chips stay across chapters, are not duplicated, and switch the explanation', async () => {
    await render(<Harness />);
    await fireEvent.press(await screen.findByText('지수'));
    await fireEvent.press(await screen.findByText('지수법칙'));
    await fireEvent.press(screen.getByText('지수')); // 같은 단원을 다시 누르면 말풍선이 다시 열린다
    await fireEvent.press(within(screen.getByTestId('concept-tooltip')).getByLabelText('지수법칙'));
    expect(screen.getAllByLabelText('지수법칙 빼기')).toHaveLength(1);

    await fireEvent.press(screen.getByText('로그'));
    await fireEvent.press(await screen.findByText('로그 정의'));
    expect(screen.getByLabelText('지수법칙 빼기')).toBeTruthy();
    expect(screen.getByTestId('concept-detail').props.children).toBe('로그 정의|log_a b');

    await fireEvent.press(screen.getByLabelText('지수법칙'));
    expect(screen.getByTestId('concept-detail').props.children).toBe('지수법칙|a^m a^n');
  });

  it('X removes the chip and clears its explanation', async () => {
    await render(<Harness />);
    await fireEvent.press(await screen.findByText('지수'));
    await fireEvent.press(await screen.findByText('지수법칙'));
    await fireEvent.press(screen.getByLabelText('지수법칙 빼기'));
    expect(screen.queryByLabelText('지수법칙 빼기')).toBeNull();
    expect(screen.queryByTestId('concept-detail')).toBeNull();
  });

  it('changing the subject closes the tooltip but keeps picked chips', async () => {
    const twoSubjects: ConceptFetchers = {
      ...fakeFetchers,
      fetchSubjects: async () => [{ id: 1, title: '수학I' }, { id: 2, title: '빈 과목' }] as any,
      fetchChapters: async (id) => (id === 1 ? ([{ id: 10, chapterName: '지수' }] as any) : []),
    };
    await render(<Harness fetchers={twoSubjects} />);
    await fireEvent.press(await screen.findByText('지수'));
    await fireEvent.press(await screen.findByText('지수법칙'));
    await fireEvent.press(screen.getByText('지수'));
    await fireEvent.press(screen.getByText('빈 과목'));
    await screen.findByText('선택된 과목의 단원이 없습니다.');
    expect(screen.queryByTestId('concept-tooltip')).toBeNull();
    expect(screen.getByLabelText('지수법칙 빼기')).toBeTruthy();
  });
});
