import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('../src/kit/math/MathJaxWrapper', () => {
  const { Text } = require('react-native');
  return (p: any) =>
    p.fullView && !p.autoSize ? <Text testID="concept-detail">{`${p.titleStatement}|${p.statement}`}</Text> : <Text testID="concept-chip-text">{p.statement}</Text>;
});

import { ConceptLookupPanel, type ConceptFetchers } from '../src/kit/concepts/ConceptLookupPanel';

const concepts: Record<number, any[]> = {
  10: [{ id: 100, rawTitle: '지수법칙', rawStatement: 'a^m a^n', imgPath: '' }],
  11: [{ id: 110, rawTitle: '로그 정의', rawStatement: 'log_a b', imgPath: '' }],
};
const fakeFetchers: ConceptFetchers = {
  fetchSubjects: async () => [{ id: 1, title: '수학I' }] as any,
  fetchChapters: async () => [{ id: 10, chapterName: '지수' }, { id: 11, chapterName: '로그' }] as any,
  fetchConcepts: async (id) => concepts[id] as any,
};

describe('ConceptLookupPanel - explanation inside the panel', () => {
  it('shows the empty hint before a concept is picked', async () => {
    await render(<ConceptLookupPanel fetchers={fakeFetchers} />);
    await screen.findByText('지수법칙');
    expect(screen.getByText('개념을 누르면 여기에 설명이 나옵니다.')).toBeTruthy();
    expect(screen.queryByTestId('concept-detail')).toBeNull();
  });

  it('draws the picked concept inside the panel, with no Modal', async () => {
    await render(<ConceptLookupPanel fetchers={fakeFetchers} />);
    await fireEvent.press(await screen.findByText('지수법칙'));
    expect(screen.getByTestId('concept-detail').props.children).toBe('지수법칙|a^m a^n');
    // RNTL v14에는 UNSAFE_queryByType이 없다 — 모달의 머리 배지와 닫기 버튼이 없음을 본다
    expect(screen.queryByText('📖 개념 설명')).toBeNull();
    expect(screen.queryByText('닫기')).toBeNull();
  });

  it('clears the explanation when the chapter changes (review focus 1)', async () => {
    await render(<ConceptLookupPanel fetchers={fakeFetchers} />);
    await fireEvent.press(await screen.findByText('지수법칙'));
    await fireEvent.press(screen.getByText('로그'));
    await screen.findByText('로그 정의');
    expect(screen.queryByTestId('concept-detail')).toBeNull();
    expect(screen.getByText('개념을 누르면 여기에 설명이 나옵니다.')).toBeTruthy();
  });

  // 최종 리뷰: 단원이 없는 과목으로 바꾸면 chapterId가 0에 머물러 단원 effect의 초기화가 돌지 않았다
  it('clears the explanation when the subject changes, even to a subject with no chapters', async () => {
    const twoSubjects: ConceptFetchers = {
      ...fakeFetchers,
      fetchSubjects: async () => [{ id: 1, title: '수학I' }, { id: 2, title: '빈 과목' }] as any,
      fetchChapters: async (id) => (id === 1 ? ([{ id: 10, chapterName: '지수' }] as any) : []),
    };
    await render(<ConceptLookupPanel fetchers={twoSubjects} />);
    await fireEvent.press(await screen.findByText('지수법칙'));
    await fireEvent.press(screen.getByText('빈 과목'));
    await screen.findByText('선택된 과목의 단원이 없습니다.');
    expect(screen.queryByTestId('concept-detail')).toBeNull();
  });
});
