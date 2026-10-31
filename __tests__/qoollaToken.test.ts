import { exchangeQoollaToken } from '../src/auth/qoollaToken';
import { authStore } from '../src/state/auth';

const mockStore = new Map<string, string>();
jest.mock('react-native-mmkv', () => ({
  createMMKV: () => ({ getString: (k: string) => mockStore.get(k), set: (k: string, v: string) => mockStore.set(k, v), remove: (k: string) => mockStore.delete(k) }),
}));
const store = mockStore;

const session = { access_token: 'sb-access' } as any;

describe('exchangeQoollaToken', () => {
  afterEach(() => {
    store.clear();
    authStore.dispatch({ type: 'SIGN_OUT' });
  });

  it('posts the Supabase token and stores the returned app-token under the legacy key', async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ token: 'app-jwt', user: { name: '재성', email: 'a@b.c', imageUrl: 'i' } }) }));
    global.fetch = fetchMock as any;
    await exchangeQoollaToken(session);
    expect(fetchMock).toHaveBeenCalledWith('https://www.qoolla.com/api/hello-supabase', expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer sb-access' }) }));
    expect(store.get('app-token')).toBe('app-jwt');
    expect(authStore.getState()).toMatchObject({ appToken: 'app-jwt', name: '재성', email: 'a@b.c', isAuthenticated: true });
  });

  it('throws and stores nothing when the server rejects', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 401, json: async () => ({ error: 'invalid_supabase_token' }) })) as any;
    await expect(exchangeQoollaToken(session)).rejects.toThrow('hello-supabase 401: invalid_supabase_token');
    expect(store.get('app-token')).toBeUndefined();
    expect(authStore.getState().appToken).toBeNull();
  });
});
