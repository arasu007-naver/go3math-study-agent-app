import { render, screen, waitFor } from '@testing-library/react-native';
import { NoticesPanel, type NoticeFetchers } from '../src/kit/notices/NoticesPanel';

const fetchers = (impl: NoticeFetchers['fetchNotices']): NoticeFetchers => ({ fetchNotices: impl });

describe('NoticesPanel', () => {
  it('renders notice cards with title, body, class date and created time', async () => {
    const fetchNotices = jest.fn(async () => [
      { id: 1, title: '11월 라이브 수업', description: '미적분 특강', classDate: '2026-11-07', createdAt: String(Date.UTC(2026, 10, 1, 3, 0)) },
    ]);
    render(<NoticesPanel fetchers={fetchers(fetchNotices)} />);
    await waitFor(() => expect(screen.getByText('11월 라이브 수업')).toBeTruthy());
    expect(screen.getByText('미적분 특강')).toBeTruthy();
    expect(screen.getByText('2026-11-07 예정')).toBeTruthy();
    expect(fetchNotices).toHaveBeenCalledWith({ page: 0, pageSize: 36 });
  });

  it('shows the empty placeholder', async () => {
    render(<NoticesPanel fetchers={fetchers(async () => [])} />);
    await waitFor(() => expect(screen.getByText('공지 사항이 없습니다.')).toBeTruthy());
  });

  it('shows the error message when the fetch fails', async () => {
    render(<NoticesPanel fetchers={fetchers(async () => { throw new Error('로그인이 필요해요'); })} />);
    await waitFor(() => expect(screen.getByText('공지를 불러오지 못했어요. (로그인이 필요해요)')).toBeTruthy());
  });
});
