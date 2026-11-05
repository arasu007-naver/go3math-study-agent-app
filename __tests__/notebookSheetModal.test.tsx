import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ADD_BOOKMARK } from '../src/api/graphql/mutations';

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

jest.mock('@gorhom/bottom-sheet', () => ({
  BottomSheetModal: () => null,
  BottomSheetView: ({ children }: any) => children,
}));

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

  it('renders problem items with 교체, 책갈피, and 해답 buttons in a single-line group', async () => {
    await render(<NotebookScreen />);

    // Open problem list modal
    fireEvent.press(screen.getByText('목록'));

    // Both problems should display button groups: '교체', '책갈피', '해답'
    await waitFor(() => {
      expect(screen.getAllByText('교체').length).toBe(2);
    });

    const bookmarkButtons = screen.getAllByText('책갈피');
    expect(bookmarkButtons.length).toBe(2);

    // 2 in problem list cards + 1 in bottom canvas toolbar
    const answerButtons = screen.getAllByText('해답');
    expect(answerButtons.length).toBe(3);
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

  it('toggles body WebView with answer URL when 해답 button is clicked', async () => {
    await render(<NotebookScreen />);

    fireEvent.press(screen.getByText('목록'));

    // Initially problem images are shown
    await waitFor(() => {
      expect(screen.getAllByTestId('mock-problem-image').length).toBe(2);
    });

    // Click '해답' on first item (101)
    const answerButtons = screen.getAllByText('해답');
    fireEvent.press(answerButtons[0]);

    // Should now show answer WebView with the correct URL
    await waitFor(() => {
      expect(screen.getByTestId('mock-webview')).toBeTruthy();
      expect(screen.getByLabelText(/unit-answer\/101/)).toBeTruthy();
    });

    // The button title toggles to '문제'
    expect(screen.getByText('문제')).toBeTruthy();

    // Wait for GoButton debounce (400ms) before pressing again
    await new Promise((r) => setTimeout(r, 450));

    // Clicking '문제' toggles back to the problem image
    fireEvent.press(screen.getByText('문제'));
    await waitFor(() => {
      expect(screen.queryByTestId('mock-webview')).toBeNull();
    });
  });
});
