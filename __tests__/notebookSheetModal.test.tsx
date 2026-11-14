import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ADD_BOOKMARK } from '../src/api/graphql/mutations';
import { StyleSheet } from 'react-native';
import { colors, layout } from '../src/ui/theme';

const mockAddBookmark = jest.fn().mockResolvedValue({ data: { addBookmark: true } });
const mockCreateRecord = jest.fn().mockResolvedValue({ data: { createRecord: { id: 1 } } });
const mockSendRequest = jest.fn().mockResolvedValue({ data: {} });
const mockGetTries = jest.fn().mockResolvedValue({ data: { tries: [] } });

jest.mock('@apollo/client/react', () => {
  return {
    useMutation: (mutation: any) => {
      const { ADD_BOOKMARK } = require('../src/api/graphql/mutations');
      if (mutation === ADD_BOOKMARK) return [mockAddBookmark];
      return [mockCreateRecord];
    },
    useLazyQuery: () => [mockGetTries],
  };
});

jest.mock('expo-router', () => ({
  Redirect: () => null,
  router: { back: jest.fn(), replace: jest.fn(), canGoBack: () => true },
}));

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

jest.mock('@openspacelabs/react-native-zoomable-view', () => ({
  ReactNativeZoomableView: ({ children }: any) => children,
}));

jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return {
    WebView: (props: any) => <View testID="mock-webview" accessibilityLabel={props.source?.uri} />,
  };
});

jest.mock('../src/kit/canvas/note-canvas/notebook', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return ({ screenActions }: any) => (
    <View testID="mock-notebook-panel">
      {screenActions?.map((act: any) => (
        <TouchableOpacity key={act.id} onPress={act.onPress}>
          <Text>{act.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

jest.mock('../src/kit/canvas/note-canvas/image-adjust-card', () => {
  const { View } = require('react-native');
  return ({ children, imgPath }: any) => (
    <View testID="mock-problem-image" accessibilityLabel={imgPath}>
      {children}
    </View>
  );
});

const mockProblems = [
  { sourceType: 'UNIT', sourceId: 101, image: 'https://img/101.png' },
  { sourceType: 'UNIT', sourceId: 102, image: 'https://img/102.png' },
];

jest.mock('../src/state/solve', () => ({
  solveStore: {
    useStore: () => ({
      problems: mockProblems,
      index: 0,
      taskId: 1,
    }),
  },
}));

import NotebookScreen from '../app/notebook';

describe('NotebookScreen - Problem List Modal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders problem items with 책갈피 then 교체 in a single-line group, and no 해답 button', async () => {
    await render(<NotebookScreen />);

    // Open problem list modal
    fireEvent.press(screen.getByText('목록'));

    await waitFor(() => {
      expect(screen.getAllByText('교체').length).toBe(2);
    });
    expect(screen.getAllByText('책갈피').length).toBe(2);
    expect(screen.queryByText('해답')).toBeNull();

    // 교체가 예전 해답 자리(책갈피 오른쪽)에 온다
    const labels = screen.getAllByText(/^(책갈피|교체)$/).map((n) => n.props.children);
    expect(labels).toEqual(['책갈피', '교체', '책갈피', '교체']);
  });

  it('calls addBookmark GraphQL mutation when 책갈피 button is clicked', async () => {
    await render(<NotebookScreen />);

    fireEvent.press(screen.getByText('목록'));

    await waitFor(() => {
      expect(screen.getAllByText('책갈피').length).toBe(2);
    });

    const bookmarkButtons = screen.getAllByText('책갈피');
    fireEvent.press(bookmarkButtons[0]);

    await waitFor(() => {
      expect(mockAddBookmark).toHaveBeenCalledWith({
        variables: {
          sourceType: 'UNIT',
          sourceId: 101,
        },
      });
    });

    // Should update title to '책갈피됨'
    expect(screen.getByText('책갈피됨')).toBeTruthy();
  });
});

describe('NotebookScreen - list modal uses shared Button', () => {
  beforeEach(() => jest.clearAllMocks());
  const openList = async () => {
    await render(<NotebookScreen />);
    await fireEvent.press(screen.getByText('목록'));
    await waitFor(() => expect(screen.getAllByRole('button', { name: '교체' }).length).toBe(2));
  };
  const flat = (node: any) => StyleSheet.flatten(node.props.style);

  it('교체 and 책갈피 are small secondary buttons and 닫기 is a secondary button', async () => {
    await openList();
    for (const name of ['교체', '책갈피']) {
      const node = screen.getAllByRole('button', { name })[0];
      expect(flat(node)).toMatchObject({ minHeight: layout.controlSm, backgroundColor: colors.card });
    }
    expect(flat(screen.getByRole('button', { name: '닫기' }))).toMatchObject({ backgroundColor: colors.card });
  });

  it('a bookmarked problem shows a disabled 책갈피됨 that does not bookmark again', async () => {
    await openList();
    await fireEvent.press(screen.getAllByRole('button', { name: '책갈피' })[0]);
    await waitFor(() => expect(screen.getByRole('button', { name: '책갈피됨' })).toBeTruthy());
    const done = screen.getByRole('button', { name: '책갈피됨' });
    expect(done.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(done);
    expect(mockAddBookmark).toHaveBeenCalledTimes(1);
  });
});

describe('NotebookScreen - list modal opens on the current problem', () => {
  it('scrolls the list so the current problem is centered each time it opens', async () => {
    const { FlatList } = require('react-native');
    const scrollToOffset = jest.spyOn(FlatList.prototype, 'scrollToOffset').mockImplementation(() => {});
    const openAndLayout = async () => {
      await fireEvent.press(screen.getByText('목록'));
      await waitFor(() => expect(screen.getAllByRole('button', { name: '교체' }).length).toBe(2));
      // 문제 목록(가로 FlatList)이 폭 410으로 배치된다
      await fireEvent(screen.getByTestId('canvas-sheet-list'), 'layout', { nativeEvent: { layout: { width: 410, height: 500, x: 0, y: 0 } } });
    };
    await render(<NotebookScreen />);

    // 첫 문제가 현재 문제 — 처음이라 가운데에 올 수 없어 맨 앞
    await openAndLayout();
    expect(scrollToOffset).toHaveBeenLastCalledWith({ offset: 0, animated: false });

    // 둘째 문제로 바꾸면 목록이 닫힌다. 다시 열면 둘째 카드(폭 380, 간격 16)가 가운데: 396 - (410-380)/2
    await fireEvent.press(screen.getAllByRole('button', { name: '교체' })[1]);
    await waitFor(() => expect(screen.queryByRole('button', { name: '닫기' })).toBeNull());
    await openAndLayout();
    expect(scrollToOffset).toHaveBeenLastCalledWith({ offset: 381, animated: false });
    scrollToOffset.mockRestore();
  });
});

describe('NotebookScreen - canvas sheets (Gate B Q4)', () => {
  it('answer and workouts sheets open at 보기 50% with 넓게 70% and stop above the toolbar', async () => {
    await render(<NotebookScreen />);
    for (const p of lastSheets(2)) {
      expect(p.snapPoints).toEqual(['50%', '70%']);
      expect(p.index).toBe(0);
      expect(p.bottomInset).toBe(layout.toolbarH + 20);
      expect(p.enableDynamicSizing).toBe(false);
      expect(p.enableContentPanningGesture).toBe(false);
    }
  });

  // BottomSheetView는 absolute(아래 미고정)라 내용 높이만큼만 커진다 — 높이 없는 WebView는 0이 되어 해답이 비었다
  it('answer sheet body is a flex View that fills the sheet, not the content-sized BottomSheetView', async () => {
    const { BottomSheetView } = require('@gorhom/bottom-sheet');
    await render(<NotebookScreen />);
    const [answer] = lastSheets(2);
    expect(answer.children.type).not.toBe(BottomSheetView);
    expect(StyleSheet.flatten(answer.children.props.style).flex).toBe(1);
  });

  it('toolbar has one 개념·해답 button and no separate 해답 or 개념 button', async () => {
    await render(<NotebookScreen />);
    expect(screen.getByText('개념·해답')).toBeTruthy();
    expect(screen.queryByText('해답')).toBeNull();
    expect(screen.queryByText('개념')).toBeNull();
  });
});
