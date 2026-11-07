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
  fetchDay: jest.fn(async () => [{ id: 7, sourceType: 'unit', sourceId: 42 }]),
  addBookmark: jest.fn(async () => {}),
};
const noticeFetchers = {
  fetchNotices: jest.fn(async () => []),
  fetchMonthNotices: jest.fn(async () => [{ id: 1, title: '이달 공지' }]),
};

describe('DiaryPanel', () => {
  it('keeps the notice tab fixed and opens a day tab with that day records', async () => {
    const onSolveDay = jest.fn();
    await render(<DiaryPanel recordFetchers={recordFetchers} noticeFetchers={noticeFetchers} onSolveDay={onSolveDay} />);
    await waitFor(() => expect(screen.getByText('이달 공지')).toBeTruthy());
    expect(noticeFetchers.fetchMonthNotices).toHaveBeenCalledWith(month);

    // jest에는 레이아웃이 없으므로 탭 내용 폭을 직접 알린다
    await fireEvent(screen.getByTestId('diary-tab-body'), 'layout', { nativeEvent: { layout: { width: 400, height: 600 } } });
    const dayLabel = `${moment(day).month() + 1}월/5일`;
    await waitFor(() => expect(screen.getByLabelText('5일 풀이 2문제')).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('5일 풀이 2문제'));
    await waitFor(() => expect(recordFetchers.fetchDay).toHaveBeenCalledWith(day));
    expect(screen.getByLabelText(`${dayLabel} 풀이`).props.accessibilityState).toEqual({ selected: true });

    // '답안 예시' → 탭 안에서 해답, '풀이 목록'으로 복귀
    await waitFor(() => expect(screen.getByText('답안 예시')).toBeTruthy());
    await fireEvent.press(screen.getByText('답안 예시'));
    await waitFor(() => expect(screen.getByText(/^answer:/)).toBeTruthy());
    await fireEvent.press(screen.getByLabelText('풀이 목록으로'));
    await waitFor(() => expect(screen.getByText('답안 예시')).toBeTruthy());

    // 탭 오른쪽 아래 '가자!!!' FAB → 그날 문제(문제별 1개)로 풀이 화면
    await fireEvent.press(screen.getByText('가자!!!'));
    expect(onSolveDay).toHaveBeenCalledWith(day, [expect.objectContaining({ sourceType: 'unit', sourceId: 42 })]);

    // 같은 날을 다시 눌러도 탭은 하나
    await fireEvent.press(screen.getByLabelText('5일 풀이 2문제'));
    expect(screen.getAllByLabelText(`${dayLabel} 풀이`)).toHaveLength(1);

    // 날 탭을 닫으면 공지 탭으로
    await fireEvent.press(screen.getByLabelText(`${dayLabel} 탭 닫기`));
    expect(screen.queryByLabelText(`${dayLabel} 풀이`)).toBeNull();
    await waitFor(() => expect(screen.getByText('이달 공지')).toBeTruthy());
  });
});
