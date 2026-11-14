import React, { createRef, useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { colors, layout, shadow } from '../src/ui/theme';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

const mockSheetProps: any[] = [];
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModal: (p: any) => {
    mockSheetProps.push(p);
    return p.children;
  },
  BottomSheetView: ({ children }: any) => children,
}));

jest.mock('../src/kit/concepts/ConceptLookupPanel', () => {
  const { Text } = require('react-native');
  return { ConceptLookupPanel: () => <Text>concept-panel</Text> };
});

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return { ...actual, useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }) };
});

import { CanvasStudySheet } from '../src/kit/canvas/CanvasStudySheet';

let mountCount = 0;
function Answer() {
  useEffect(() => {
    mountCount++;
  }, []);
  return <Text>answer-body</Text>;
}

beforeEach(() => {
  mountCount = 0;
});
const last = () => mockSheetProps[mockSheetProps.length - 1];
// RNTL은 display:none 요소를 기본으로 건너뛴다 — 숨긴 탭도 찾게 한다
const hidden = (id: string) =>
  StyleSheet.flatten(screen.getByTestId(id, { includeHiddenElements: true }).props.style).display === 'none';
const ui = () => <CanvasStudySheet sheetRef={createRef()} answerLabel="해답" answer={<Answer />} />;

describe('CanvasStudySheet', () => {
  it('starts on the answer tab at 50%', async () => {
    await render(ui());
    expect(screen.getByRole('tab', { name: '해답' }).props.accessibilityState).toMatchObject({ selected: true });
    expect(hidden('study-tab-answer')).toBe(false);
    expect(hidden('study-tab-concept')).toBe(true);
    expect(last().index).toBe(0);
  });

  it('switching to 개념 hides the answer without unmounting it and opens next time at 70%', async () => {
    await render(ui());
    await fireEvent.press(screen.getByRole('tab', { name: '개념' }));
    expect(hidden('study-tab-concept')).toBe(false);
    expect(hidden('study-tab-answer')).toBe(true);
    await fireEvent.press(screen.getByRole('tab', { name: '해답' }));
    expect(screen.getByText('answer-body')).toBeTruthy();
    expect(mountCount).toBe(1);
  });

  // 실기기: index prop이 바뀌면 열린 시트가 움직였다(스펙 §6 위험 2) — 높이는 닫힐 때 다음 열기용으로만 정한다
  it('switching tabs does not move the open sheet; closing on 개념 reopens at 70%', async () => {
    await render(ui());
    await fireEvent.press(screen.getByRole('tab', { name: '개념' }));
    expect(last().index).toBe(0);
    await act(() => last().onDismiss());
    expect(last().index).toBe(1);
    await fireEvent.press(screen.getByRole('tab', { name: '해답' }));
    expect(last().index).toBe(1);
    await act(() => last().onDismiss());
    expect(last().index).toBe(0);
  });

  it('keeps the last tab across re-renders', async () => {
    const { rerender } = await render(ui());
    await fireEvent.press(screen.getByRole('tab', { name: '개념' }));
    await rerender(ui());
    expect(screen.getByRole('tab', { name: '개념' }).props.accessibilityState).toMatchObject({ selected: true });
  });

  it('uses the canvas sheet settings and a flex View body', async () => {
    const { BottomSheetView } = require('@gorhom/bottom-sheet');
    await render(ui());
    const p = last();
    expect(p.snapPoints).toEqual(['50%', '70%']);
    expect(p.bottomInset).toBe(layout.toolbarH + 20);
    expect(p.enableDynamicSizing).toBe(false);
    expect(p.enableContentPanningGesture).toBe(false);
    expect(p.children.type).not.toBe(BottomSheetView);
    expect(StyleSheet.flatten(p.children.props.style).flex).toBe(1);
  });

  it('tab chips use the common button look; the selected one only turns its label accent', async () => {
    await render(ui());
    for (const name of ['개념', '해답']) {
      expect(StyleSheet.flatten(screen.getByRole('tab', { name }).props.style)).toMatchObject({ backgroundColor: colors.rail, borderColor: colors.card, borderWidth: 3, ...shadow.card });
    }
    const labelColor = (t: string) => StyleSheet.flatten(screen.getByText(t).props.style).color;
    expect(labelColor('해답')).toBe(colors.accent);
    expect(labelColor('개념')).toBe(colors.text);
  });

  it('labels the answer tab with answerLabel', async () => {
    await render(<CanvasStudySheet sheetRef={createRef()} answerLabel="답안 예시" answer={null} />);
    expect(screen.getByRole('tab', { name: '답안 예시' })).toBeTruthy();
  });
});
