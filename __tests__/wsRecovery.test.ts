import { readFileSync } from 'fs';
import { join } from 'path';
import { attachWsRecovery, retryDelayMs } from '../src/api/graphql/wsRecovery';

function fakeClient() {
  const handlers: Record<string, ((...a: any[]) => void)[]> = {};
  const subs: { payload: any; sink: any; unsub: jest.Mock }[] = [];
  const client: any = {
    on: (e: string, l: any) => ((handlers[e] ||= []).push(l), () => {}),
    terminate: jest.fn(),
    dispose: jest.fn(),
    iterate: jest.fn(),
    subscribe: jest.fn((payload: any, sink: any) => {
      const unsub = jest.fn();
      subs.push({ payload, sink, unsub });
      return unsub;
    }),
  };
  const emit = (e: string, ...a: any[]) => (handlers[e] ?? []).forEach((l) => l(...a));
  return { client, emit, subs };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('retryDelayMs', () => {
  expect([0, 1, 2, 3, 10].map(retryDelayMs)).toEqual([500, 1000, 2000, 3000, 3000]);
});

test('client.ts 정책', () => {
  const src = readFileSync(join(__dirname, '../src/api/graphql/client.ts'), 'utf8');
  expect(src).toContain('retryAttempts: Infinity');
  expect(src).toContain('keepAlive: 10000');
  expect(src).not.toContain('retries * 2 * 60 * 1000');
});

test('pong 없으면 terminate', () => {
  const f = fakeClient();
  attachWsRecovery(f.client);
  f.emit('ping', false);
  jest.advanceTimersByTime(5000);
  expect(f.client.terminate).toHaveBeenCalledTimes(1);
});

test('pong 오면 terminate 안 함', () => {
  const f = fakeClient();
  attachWsRecovery(f.client);
  f.emit('ping', false);
  jest.advanceTimersByTime(2000);
  f.emit('pong', true);
  jest.advanceTimersByTime(10000);
  expect(f.client.terminate).not.toHaveBeenCalled();
});

test('closed(1006) 뒤 connected → 300ms 뒤 알림', () => {
  const f = fakeClient();
  const r = attachWsRecovery(f.client);
  const l = jest.fn();
  r.onReconnected(l);
  f.emit('closed', { code: 1006 });
  f.emit('connected');
  jest.advanceTimersByTime(299);
  expect(l).not.toHaveBeenCalled();
  jest.advanceTimersByTime(1);
  expect(l).toHaveBeenCalledTimes(1);
});

test('closed(1000)은 알림 없음, 최초 connected도 없음', () => {
  const f = fakeClient();
  const r = attachWsRecovery(f.client);
  const l = jest.fn();
  r.onReconnected(l);
  f.emit('connected');
  f.emit('closed', { code: 1000 });
  f.emit('connected');
  jest.advanceTimersByTime(1000);
  expect(l).not.toHaveBeenCalled();
});

test('알림 대기 중 closed면 취소', () => {
  const f = fakeClient();
  const r = attachWsRecovery(f.client);
  const l = jest.fn();
  r.onReconnected(l);
  f.emit('closed', { code: 1006 });
  f.emit('connected');
  f.emit('closed', { code: 1006 });
  jest.advanceTimersByTime(1000);
  expect(l).not.toHaveBeenCalled();
});

test('4500 오류는 재구독, 다른 오류는 전달', () => {
  const f = fakeClient();
  const r = attachWsRecovery(f.client, { retryDelay: () => 100 });
  const sink = { next: jest.fn(), error: jest.fn(), complete: jest.fn() };
  r.client.subscribe({ query: 'q' } as any, sink);
  f.subs[0].sink.error({ code: 4500, reason: 'x' });
  expect(sink.error).not.toHaveBeenCalled();
  jest.advanceTimersByTime(100);
  expect(f.subs).toHaveLength(2);
  expect(f.subs[1].payload).toEqual({ query: 'q' });
  f.subs[1].sink.error(new Error('boom'));
  expect(sink.error).toHaveBeenCalledTimes(1);
});

test('재구독 대기 중 해제하면 재구독 없음', () => {
  const f = fakeClient();
  const r = attachWsRecovery(f.client, { retryDelay: () => 100 });
  const dispose = r.client.subscribe({ query: 'q' } as any, { next: jest.fn(), error: jest.fn(), complete: jest.fn() });
  f.subs[0].sink.error({ code: 4500 });
  dispose();
  jest.advanceTimersByTime(1000);
  expect(f.subs).toHaveLength(1);
  expect(f.subs[0].unsub).toHaveBeenCalled();
});

test('forceReconnect는 연결 상태에서만', () => {
  const f = fakeClient();
  const r = attachWsRecovery(f.client);
  r.forceReconnect();
  expect(f.client.terminate).not.toHaveBeenCalled();
  f.emit('connected');
  r.forceReconnect();
  expect(f.client.terminate).toHaveBeenCalledTimes(1);
});
