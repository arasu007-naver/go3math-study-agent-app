import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { colors, layout } from '../src/ui/theme';

jest.mock('react-native-webview', () => ({ WebView: () => null }));
const mockSheetProps: any[] = [];
jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModal: (p: any) => {
    mockSheetProps.push(p);
    return null;
  },
  BottomSheetView: ({ children }: any) => children,
}));

jest.mock('react-native-safe-area-context', () => {
  const actual = jest.requireActual('react-native-safe-area-context');
  return { ...actual, useSafeAreaInsets: () => ({ top: 0, bottom: 20, left: 0, right: 0 }) };
});

/** 마지막 렌더의 시트 props(같은 ref 순서대로 렌더된다) */
const lastSheets = (n: number) => mockSheetProps.slice(-n);

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
    await fireEvent.press(screen.getByLabelText('전체 지우기'));

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

    await fireEvent.press(screen.getByLabelText('전체 지우기'));
    await waitFor(() => {
      expect(screen.getByText("'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?")).toBeTruthy();
    });

    // Click '취소'
    await fireEvent.press(screen.getByText('취소'));

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

    await fireEvent.press(screen.getByLabelText('전체 지우기'));
    await waitFor(() => {
      expect(screen.getByText("'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?")).toBeTruthy();
    });

    // Click '확인'
    await fireEvent.press(screen.getByText('확인'));

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

    await fireEvent.press(screen.getByLabelText('저장'));
    expect(onSelectTool).toHaveBeenCalledWith('save');

    await fireEvent.press(screen.getByLabelText('Options'));
    expect(onSelectTool).toHaveBeenCalledWith('color');

    // Modal should not appear
    expect(
      screen.queryByText("'문제' 외의 나머지 사용자의 풀이는 모두 지워집니다. 진행하시겠습니까?")
    ).toBeNull();
  });
});

describe('CanvasChrome - 전체 지우기 uses the shared Dialog', () => {
  const tools = [canvasTool('color', 'Options'), canvasTool('clearBoard', '전체 지우기'), canvasTool('save', '저장')];
  const open = async (onSelectTool: jest.Mock) => {
    await render(<CanvasChrome tools={tools} onSelectTool={onSelectTool} />);
    await fireEvent.press(screen.getByLabelText('전체 지우기'));
    await waitFor(() => expect(screen.getByRole('header', { name: '전체 지우기' })).toBeTruthy());
  };

  it('confirm is a danger button and clears once', async () => {
    const onSelectTool = jest.fn();
    await open(onSelectTool);
    const confirm = screen.getByRole('button', { name: '확인' });
    expect(StyleSheet.flatten(confirm.props.style).backgroundColor).toBe(colors.danger);
    await fireEvent.press(confirm);
    expect(onSelectTool).toHaveBeenCalledTimes(1);
    expect(onSelectTool).toHaveBeenCalledWith('clearBoard');
  });

  it('the scrim closes without clearing', async () => {
    const onSelectTool = jest.fn();
    await open(onSelectTool);
    await fireEvent.press(screen.getByLabelText('닫기'));
    expect(onSelectTool).not.toHaveBeenCalled();
    await waitFor(() => expect(screen.queryByRole('header', { name: '전체 지우기' })).toBeNull());
  });
});

describe('CanvasChrome - concept sheet (Gate B Q4)', () => {
  it('opens at 넓게 70% of the two steps and stops above the toolbar', async () => {
    await render(<CanvasChrome tools={[canvasTool('save', '저장')]} onSelectTool={() => {}} />);
    const p = lastSheets(1)[0];
    expect(p.snapPoints).toEqual(['50%', '70%']);
    expect(p.index).toBe(1);
    expect(p.bottomInset).toBe(layout.toolbarH + 20);
  });
});
