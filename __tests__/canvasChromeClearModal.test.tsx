import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModal: () => null,
  BottomSheetView: ({ children }: any) => children,
}));

import { CanvasChrome, canvasTool } from '../src/kit/canvas/CanvasChrome';

describe('CanvasChrome - 전체 지우기 Confirmation Modal', () => {
  const tools = [
    canvasTool('color', 'Options'),
    canvasTool('clearBoard', '전체 지우기'),
    canvasTool('save', '저장'),
  ];

  it('opens confirmation modal with warning message when 전체 지우기 is clicked and does not immediately clear', async () => {
    const onSelectTool = jest.fn();

    await render(
      <CanvasChrome
        tools={tools}
        onSelectTool={onSelectTool}
      />
    );

    // Click '전체 지우기' button in toolbar
    fireEvent.press(screen.getByLabelText('전체 지우기'));

    // Should NOT call onSelectTool yet
    expect(onSelectTool).not.toHaveBeenCalled();

    // Modal message should be visible
    await waitFor(() => {
      expect(
        screen.getByText("'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?")
      ).toBeTruthy();
    });
    expect(screen.getByText('취소')).toBeTruthy();
    expect(screen.getByText('확인')).toBeTruthy();
  });

  it('dismisses modal without calling onSelectTool when 취소 is clicked', async () => {
    const onSelectTool = jest.fn();

    await render(
      <CanvasChrome
        tools={tools}
        onSelectTool={onSelectTool}
      />
    );

    fireEvent.press(screen.getByLabelText('전체 지우기'));
    await waitFor(() => {
      expect(screen.getByText("'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?")).toBeTruthy();
    });

    // Click '취소'
    fireEvent.press(screen.getByText('취소'));

    // Modal should close and onSelectTool should not be called
    await waitFor(() => {
      expect(
        screen.queryByText("'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?")
      ).toBeNull();
    });
    expect(onSelectTool).not.toHaveBeenCalled();
  });

  it('calls onSelectTool("clearBoard") and closes modal when 확인 is clicked', async () => {
    const onSelectTool = jest.fn();

    await render(
      <CanvasChrome
        tools={tools}
        onSelectTool={onSelectTool}
      />
    );

    fireEvent.press(screen.getByLabelText('전체 지우기'));
    await waitFor(() => {
      expect(screen.getByText("'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?")).toBeTruthy();
    });

    // Click '확인'
    fireEvent.press(screen.getByText('확인'));

    // onSelectTool('clearBoard') should be called
    expect(onSelectTool).toHaveBeenCalledWith('clearBoard');

    // Modal should close
    await waitFor(() => {
      expect(
        screen.queryByText("'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?")
      ).toBeNull();
    });
  });

  it('passes other tools like Options and 저장 directly without modal', async () => {
    const onSelectTool = jest.fn();

    await render(
      <CanvasChrome
        tools={tools}
        onSelectTool={onSelectTool}
      />
    );

    fireEvent.press(screen.getByLabelText('저장'));
    expect(onSelectTool).toHaveBeenCalledWith('save');

    fireEvent.press(screen.getByLabelText('Options'));
    expect(onSelectTool).toHaveBeenCalledWith('color');

    // Modal should not appear
    expect(
      screen.queryByText("'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?")
    ).toBeNull();
  });
});
