import { act, render, screen, waitFor } from '@testing-library/react-native';

let mockFetch: jest.Mock;
let mockSub: any;
jest.mock('@apollo/client/react', () => ({
  useLazyQuery: (_d: any, o: any) => ((global as any).__lazyOpts = o, [mockFetch]),
  useSubscription: (_d: any, o: any) => void (mockSub = o),
}));
jest.mock('../src/api/graphql/queries', () => ({ LIVE_CLASS_CLOCK: {} }));
jest.mock('../src/api/graphql/subscriptions', () => ({ LIVE_CLASS_CLOCK_TICK: {} }));

import LiveClassStartTime from '../src/kit/live-class/LiveClassStartTime';

const t = new Date(2026, 0, 2, 14, 30).getTime();
const clock = (startedAt: string | null) => ({ data: { liveClassClock: { startedAt } } });

beforeEach(() => {
  mockFetch = jest.fn(async () => clock(String(t)));
});

it('fetches with network-only and shows start time', async () => {
  await render(<LiveClassStartTime classType="TOPIC" classKey="5" active />);
  await waitFor(() => expect(screen.getByTestId('live-class-start-time').props.children.join('')).toBe('수업 시작 14:30'));
  expect(mockFetch).toHaveBeenCalledWith({ variables: { classType: 'TOPIC', classKey: '5' } });
  expect((global as any).__lazyOpts.fetchPolicy).toBe('network-only');
  expect(mockSub.skip).toBe(false);
});

it('shows --:-- when empty, updates on tick, clears on null tick', async () => {
  mockFetch = jest.fn(async () => clock(null));
  await render(<LiveClassStartTime classType="HOTLINE" classKey="t1" active />);
  const text = () => screen.getByTestId('live-class-start-time').props.children.join('');
  await waitFor(() => expect(mockFetch).toHaveBeenCalled());
  expect(text()).toBe('수업 시작 --:--');
  await act(async () => mockSub.onData({ data: { data: { liveClassClockTick: { startedAt: String(t) } } } }));
  expect(text()).toBe('수업 시작 14:30');
  await act(async () => mockSub.onData({ data: { data: { liveClassClockTick: { startedAt: null } } } }));
  expect(text()).toBe('수업 시작 --:--');
});

it('does not fetch and skips subscription when inactive; survives fetch failure', async () => {
  await render(<LiveClassStartTime classType="TOPIC" classKey="5" active={false} />);
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockSub.skip).toBe(true);
  mockFetch = jest.fn(async () => { throw new Error('x'); });
  await render(<LiveClassStartTime classType="TOPIC" classKey="5" active />);
  await waitFor(() => expect(mockFetch).toHaveBeenCalled());
});
