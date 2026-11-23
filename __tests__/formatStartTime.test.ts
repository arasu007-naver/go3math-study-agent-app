import { formatStartTime } from '../src/kit/live-class/formatStartTime';

describe('formatStartTime', () => {
  it.each([null, undefined, '', 'abc'])('returns --:-- for %p', (v) => {
    expect(formatStartTime(v as any)).toBe('--:--');
  });
  it('formats epoch ms string as local HH:mm', () => {
    const d = new Date(2026, 0, 2, 9, 5);
    expect(formatStartTime(String(d.getTime()))).toBe('09:05');
  });
});
