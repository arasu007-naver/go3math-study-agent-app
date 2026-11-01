import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { MessageBoxPanel, describeMessage, type MessageBoxFetchers } from '../src/kit/profile/MessageBoxPanel';

const fetchers = (impl: MessageBoxFetchers['fetchMessages']): MessageBoxFetchers => ({ fetchMessages: impl });

describe('describeMessage', () => {
  it('follows the legacy card rules per request type', () => {
    expect(describeMessage({ id: 1, requestType: 'SERVICE_IMPROVEMENT_REQUEST', content: '다크 모드 주세요', response: { id: 9, content: '검토할게요' } })).toEqual({
      title: '서비스 개선 사항',
      subtitle: '다크 모드 주세요',
      response: '검토할게요',
      image: null,
    });
    expect(describeMessage({ id: 2, requestType: 'PDF_REQUEST', content: JSON.stringify({ paymentSourceType: 'order' }), response: { id: 3, content: 'x' } })).toMatchObject({
      title: 'PDF 요청',
      subtitle: '구매 티켓 사용',
      response: null,
    });
    expect(describeMessage({ id: 4, requestType: 'SUBSCRIPTION', content: 'c' })).toMatchObject({ title: '서비스 구독 요청', subtitle: null, response: null });
    const unit = describeMessage({ id: 5, requestType: 'UNIT_CLASS_REQUEST', content: JSON.stringify({ sourceType: 'UNIT', sourceId: 77 }) });
    expect(unit.title).toBe('문제 해설 요청');
    expect(unit.image).toMatch(/\/units\/77\.png$/);
    expect(describeMessage({ id: 6, requestType: 'NEW_TYPE', content: 'c' }).title).toBe('NEW_TYPE');
  });
});

describe('MessageBoxPanel', () => {
  it('renders the inbox header and message cards', async () => {
    const fetchMessages = jest.fn(async () => [{ id: 1, requestType: 'MENTORING_REQUEST', content: '수열 질문', writtenAt: String(Date.UTC(2026, 10, 1)), response: { id: 2, content: '내일 답변' } }]);
    await render(<MessageBoxPanel fetchers={fetchers(fetchMessages)} />);
    expect(screen.getByText('개인 사서함')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('멘토링 요청')).toBeTruthy());
    expect(screen.getByText('수열 질문')).toBeTruthy();
    expect(screen.getByText('내일 답변')).toBeTruthy();
    expect(fetchMessages).toHaveBeenCalledWith({ page: 0, pageSize: 36 });
  });

  it('opens the attached PDF in a modal when the card is pressed', async () => {
    const msg = { id: 1, requestType: 'BOOKMARKS_PDF_REQUEST', content: '북마크 PDF', response: { id: 2, content: '요청된 pdf 문서입니다', fileLink: 'https://x/a.pdf', sub: '1234' } };
    await render(<MessageBoxPanel fetchers={fetchers(async () => [msg])} />);
    await waitFor(() => expect(screen.getByText('요청된 pdf 문서입니다')).toBeTruthy());
    expect(screen.queryByText('비밀번호: 1234')).toBeNull();
    await fireEvent.press(screen.getByText('요청된 pdf 문서입니다'));
    expect(screen.getByText('비밀번호: 1234')).toBeTruthy();
    await fireEvent.press(screen.getByText('닫기'));
    expect(screen.queryByText('비밀번호: 1234')).toBeNull();
  });

  it('shows the empty placeholder', async () => {
    await render(<MessageBoxPanel fetchers={fetchers(async () => [])} />);
    await waitFor(() => expect(screen.getByText('받은 쪽지가 없습니다.')).toBeTruthy());
  });

  it('shows the error message when the fetch fails', async () => {
    await render(<MessageBoxPanel fetchers={fetchers(async () => { throw new Error('로그인이 필요해요'); })} />);
    await waitFor(() => expect(screen.getByText('쪽지를 불러오지 못했어요. (로그인이 필요해요)')).toBeTruthy());
  });
});
