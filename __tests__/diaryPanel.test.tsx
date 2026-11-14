import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import moment from 'moment';
import { DiaryPanel } from '../src/kit/diary/DiaryPanel';

jest.mock('@openspacelabs/react-native-zoomable-view', () => ({
  ReactNativeZoomableView: ({ children }: { children: unknown }) => children,
}));
jest.mock('../src/kit/ui/image-dynamic-dims', () => ({ __esModule: true, default: () => null }));
jest.mock('../src/kit/ui/web-view', () => {
  const { Text } = jest.requireActual('react-native');
  return { __esModule: true, default: ({ source }: { source: { uri: string } }) => <Text>{`answer:${source.uri}`}</Text> };
});

const month = moment().format('YYYY-MM');
const day = `${month}-05`;

const recordFetchers = {
  fetchMonth: jest.fn(async () => [{ day, recordCnt: 2 }]),
  fetchDay: jest.fn(async () => [
    { id: 7, sourceType: 'unit', sourceId: 42, taskId: 3 },
    { id: 8, sourceType: 'unit', sourceId: 42, taskId: 9 },
  ]),
  addBookmark: jest.fn(async () => {}),
};
const noticeFetchers = {
  fetchNotices: jest.fn(async () => []),
  fetchMonthNotices: jest.fn(async () => [{ id: 1, title: '이달 공지' }]),
};

describe('DiaryPanel', () => {
  it('keeps the notice tab fixed and opens a day tab with that day records', async () => {
    const onSolveProblem = jest.fn();
    await render(<DiaryPanel recordFetchers={recordFetchers} noticeFetchers={noticeFetchers} onSolveProblem={onSolveProblem} />);
    await waitFor(() => expect(screen.getByText('이달 공지')).toBeTruthy());
    expect(noticeFetchers.fetchMonthNotices).toHaveBeenCalledWith(month);

    // jest에는 레이아웃이 없으므로 탭 내용 폭을 직접 알린다
    await fireEvent(screen.getByTestId('diary-tab-body'), 'layout', { nativeEvent: { layout: { width: 400, height: 600 } } });
    const dayLabel = `${moment(day).month() + 1}월/5일`;
    await waitFor(() => expect(screen.getByLabelText('5일 풀이 2문제')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('5일 풀이 2문제'));
    await waitFor(() => expect(recordFetchers.fetchDay).toHaveBeenCalledWith(day));
    // 단계 4b D5: 날 탭은 공용 Chip(role=tab), 닫기(✕)는 칩 안
    expect(screen.getByRole('tab', { name: dayLabel }).props.accessibilityState.selected).toBe(true);
    expect(screen.getByRole('tab', { name: '공지' }).props.accessibilityState.selected).toBe(false);

    // '답안 예시' → 탭 안에서 해답, '풀이 목록'으로 복귀
    await waitFor(() => expect(screen.getByText('답안 예시')).toBeTruthy());
    await fireEvent.press(screen.getByText('답안 예시'));
    await waitFor(() => expect(screen.getByText(/^answer:/)).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: '풀이 목록으로' }));
    await waitFor(() => expect(screen.getByText('답안 예시')).toBeTruthy());

    // 문제의 마지막 풀이 아래 '가자!!!' → 그 문제와 가장 최근 풀이의 task
    await fireEvent.press(screen.getByRole('button', { name: '가자!!!' }));
    expect(onSolveProblem).toHaveBeenCalledTimes(1);
    expect(onSolveProblem).toHaveBeenCalledWith(expect.objectContaining({ sourceType: 'unit', sourceId: 42, taskId: 9 }));

    // 같은 날을 다시 눌러도 탭은 하나
    await fireEvent.press(screen.getByLabelText('5일 풀이 2문제'));
    expect(screen.getAllByRole('tab', { name: dayLabel })).toHaveLength(1);

    // 날 탭을 닫으면 공지 탭으로
    await fireEvent.press(screen.getByRole('button', { name: `${dayLabel} 탭 닫기` }));
    expect(screen.queryByRole('tab', { name: dayLabel })).toBeNull();
    await waitFor(() => expect(screen.getByText('이달 공지')).toBeTruthy());
  });
});

describe('DiaryPanel look (spec 4b D5/D6/D6a)', () => {
  const { StyleSheet } = jest.requireActual('react-native');
  const { colors } = jest.requireActual('../src/ui/theme');

  async function openDay(fetchDay: () => Promise<unknown[]>) {
    const rf = { ...recordFetchers, fetchDay: jest.fn(fetchDay) };
    await render(<DiaryPanel recordFetchers={rf as never} noticeFetchers={noticeFetchers} onSolveProblem={jest.fn()} />);
    await fireEvent(screen.getByTestId('diary-tab-body'), 'layout', { nativeEvent: { layout: { width: 400, height: 600 } } });
    await waitFor(() => expect(screen.getByLabelText('5일 풀이 2문제')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('5일 풀이 2문제'));
  }

  it('dividers: problems lineStrong, solutions line', async () => {
    await openDay(async () => [
      { id: 7, sourceType: 'unit', sourceId: 42, taskId: 3 },
      { id: 8, sourceType: 'unit', sourceId: 42, taskId: 9 },
      { id: 9, sourceType: 'unit', sourceId: 43, taskId: 9 },
    ]);
    await waitFor(() => expect(screen.getAllByRole('button', { name: '가자!!!' })).toHaveLength(2));
    expect(StyleSheet.flatten(screen.getByTestId('solution-divider').props.style).backgroundColor).toBe(colors.line);
    expect(StyleSheet.flatten(screen.getByTestId('problem-divider').props.style).backgroundColor).toBe(colors.lineStrong);
  });

  it('calendar arrows change the month and day counts are unread Tags', async () => {
    await render(<DiaryPanel recordFetchers={recordFetchers} noticeFetchers={noticeFetchers} />);
    await waitFor(() => expect(screen.getByLabelText('5일 풀이 2문제')).toBeTruthy());
    expect(StyleSheet.flatten(screen.getByTestId('tag').props.style).backgroundColor).toBe(colors.unread);
    const now = moment();
    const prev = now.clone().subtract(1, 'month');
    expect(screen.getByText(new RegExp(`^${now.year()} ${now.month() + 1}월`))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: '이전 달' }));
    expect(screen.getByText(new RegExp(`^${prev.year()} ${prev.month() + 1}월`))).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: '다음 달' }));
    expect(screen.getByText(new RegExp(`^${now.year()} ${now.month() + 1}월`))).toBeTruthy();
  });
});
