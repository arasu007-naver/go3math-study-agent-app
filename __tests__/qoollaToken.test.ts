import { helloQoolla } from '../src/auth/qoollaToken';
import { authStore } from '../src/state/auth';

const mockStore = new Map<string, string>();
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({ getString: (k: string) => mockStore.get(k), set: (k: string, v: string) => mockStore.set(k, v), remove: (k: string) => mockStore.delete(k) }),
}));
const store = mockStore;

describe('helloQoolla', () => {
  afterEach(() => {
    store.clear();
    authStore.dispatch({ type: 'SIGN_OUT' });
  });

  it('posts the social token like the legacy app and stores the returned app-token under the legacy key', async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ token: 'app-jwt', user: { name: '재성', email: 'a@b.c', imageUrl: 'i' } }) }));
    global.fetch = fetchMock as any;
    await helloQoolla('kakao-id-token', 'kakao');
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.qoolla.com/api/hello',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ provider: 'kakao', password: 'kakao-id-token' }) }),
    );
    expect(store.get('app-token')).toBe('app-jwt');
    expect(authStore.getState()).toMatchObject({ appToken: 'app-jwt', name: '재성', email: 'a@b.c' });
  });

  it('throws and stores nothing when the server rejects', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: 'You are withdrawed' }) })) as any;
    await expect(helloQoolla('t', 'naver')).rejects.toThrow('hello 401: You are withdrawed');
    expect(store.get('app-token')).toBeUndefined();
    expect(authStore.getState().appToken).toBeNull();
  });
});
