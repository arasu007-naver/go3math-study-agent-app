const mockHandlers: Record<string, ((...a: any[]) => void)[]> = {};
const mockTerminate = jest.fn();
let mockAppStateCb: (s: string) => void = () => {};
jest.mock('graphql-ws', () => ({
  createClient: () => ({
    on: (e: string, l: any) => ((mockHandlers[e] ||= []).push(l), () => {}),
    terminate: mockTerminate,
    dispose: jest.fn(),
    iterate: jest.fn(),
    subscribe: jest.fn(),
  }),
}));
jest.mock('react-native', () => ({
  AppState: { addEventListener: (_: string, cb: any) => { mockAppStateCb = cb; return { remove: () => {} }; } },
}));
jest.mock('../src/config/api.constants', () => ({ GRAPHQL_API_URL: 'http://x', SUBSCRIPTION_ENDPOINT: 'ws://x' }));

import { createApolloClient } from '../src/api/graphql/client';

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  createApolloClient(() => 't');
  (mockHandlers.connected ?? []).forEach((l) => l());
});
afterEach(() => jest.useRealTimers());

test('background 5초 이상 후 active면 terminate', () => {
  mockAppStateCb('background');
  jest.advanceTimersByTime(5000);
  mockAppStateCb('active');
  expect(mockTerminate).toHaveBeenCalledTimes(1);
});

test('background 5초 미만이면 terminate하지 않는다', () => {
  mockAppStateCb('background');
  jest.advanceTimersByTime(4000);
  mockAppStateCb('active');
  expect(mockTerminate).not.toHaveBeenCalled();
});
