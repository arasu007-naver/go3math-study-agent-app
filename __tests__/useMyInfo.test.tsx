import { renderHook, waitFor } from '@testing-library/react-native';
import { myInfo } from '../src/api/rest';
import { useMyInfo } from '../src/auth/useMyInfo';
import { authStore } from '../src/state/auth';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('../src/api/rest', () => ({ myInfo: jest.fn() }));

describe('useMyInfo', () => {
  afterEach(() => {
    authStore.dispatch({ type: 'SIGN_OUT' });
    jest.mocked(myInfo).mockReset();
  });

  it('loads name·email·avatar from /user/me after a token restore', async () => {
    jest.mocked(myInfo).mockResolvedValue({ data: { name: '홍길동', email: 'gd@x.com', imageUrl: 'https://img/me.png' } } as any);
    authStore.dispatch({ type: 'RESTORE_TOKEN', item: { token: 'app-jwt' } });
    const { result } = await renderHook(() => useMyInfo());
    await waitFor(() => expect(result.current.name).toBe('홍길동'));
    expect(myInfo).toHaveBeenCalledWith('app-jwt');
    expect(result.current).toMatchObject({ email: 'gd@x.com', imageUrl: 'https://img/me.png' });
  });

  it('does not call /user/me without a token', async () => {
    await renderHook(() => useMyInfo());
    expect(myInfo).not.toHaveBeenCalled();
  });
});
