import { initialRouterState, routeCommand, type Instruction } from '../src/agent/commandRouter';
import { MockAgentTransport } from '../src/agent/mockAgent';
import { chatEntries } from '../src/agent/tablet/ChatTimeline';
import type { TimelineItem } from '../src/protocol';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

let seq = 0;
const cmd = (kind: string, payload: unknown) => ({ v: 1, id: `c${++seq}`, sessionId: 's', seq, ts: '2026-11-05T09:00:00Z', kind, payload });
const item = (id: string, ts: string, extra: Partial<TimelineItem> = {}): TimelineItem => ({ id, ts, kind: 'search', title: id, ...extra });

describe('timeline_append', () => {
  it('merges by id, keeps time order, and replaces on resync', () => {
    let r = routeCommand(initialRouterState, cmd('timeline_append', { items: [item('b', '2026-11-05T02:00:00Z'), item('a', '2026-11-05T01:00:00Z')] }), 'tablet');
    expect(r.ack?.payload.ok).toBe(true);
    expect(r.state.timeline.map((t) => t.id)).toEqual(['a', 'b']);

    r = routeCommand(r.state, cmd('timeline_append', { items: [item('a', '2026-11-05T01:00:00Z', { title: 'A2' }), item('c', '2026-11-05T03:00:00Z')] }), 'tablet');
    expect(r.state.timeline.map((t) => t.title)).toEqual(['A2', 'b', 'c']);

    r = routeCommand(r.state, cmd('timeline_append', { items: [item('d', '2026-11-05T04:00:00Z')], replace: true }), 'tablet');
    expect(r.state.timeline.map((t) => t.id)).toEqual(['d']);
  });

  it('rejects an item with an unknown kind', () => {
    const r = routeCommand(initialRouterState, cmd('timeline_append', { items: [{ id: 'x', ts: 't', kind: 'nope', title: 'x' }] }), 'tablet');
    expect(r.ack?.payload).toMatchObject({ ok: false, code: 'invalid_props' });
  });

  it('stamps agent messages with the command time', () => {
    const r = routeCommand(initialRouterState, cmd('say', { messageId: 'm', text: 'hi', source: 'default' }), 'tablet');
    expect(r.state.instruction?.ts).toBe('2026-11-05T09:00:00Z');
  });
});

describe('chatEntries', () => {
  it('interleaves messages and timeline items by time, untimed messages first', () => {
    const msg = (messageId: string, ts?: string): Instruction => ({ messageId, ts, source: 'default', text: messageId, choices: [], requiresResponse: false });
    const keys = chatEntries(
      [msg('old'), msg('m2', '2026-11-05T02:00:00Z')],
      [item('t1', '2026-11-05T01:00:00Z'), item('t3', '2026-11-05T03:00:00Z', { kind: 'daily_summary' })],
    ).map((e) => e.key);
    expect(keys).toEqual(['m-old', 't-t1', 'm-m2', 't-t3']);
  });
});

describe('MockAgentTransport timeline', () => {
  const ev = (kind: string, payload: object) => JSON.stringify({ kind, payload });

  it('sends the stored timeline on hello, records a search, and reopens it', () => {
    jest.useFakeTimers();
    const got: any[] = [];
    const t = new MockAgentTransport();
    t.connect({ onOpen: () => {}, onClose: () => {}, onMessage: (d) => got.push(JSON.parse(d)) });
    t.send(ev('hello', { device: { mode: 'tablet' } }));
    jest.runOnlyPendingTimers();
    const first = got.find((m) => m.kind === 'timeline_append');
    expect(first.payload.replace).toBe(true);
    expect(first.payload.items.map((i: TimelineItem) => i.kind)).toEqual(['weekly_summary', 'daily_summary']);

    const query = { queryType: 'selection', major: '미적분', years: [2026], months: [6], numbers: [21, 22], studyType: 'x' };
    t.send(ev('search_submitted', { query }));
    jest.runOnlyPendingTimers();
    const added = got.filter((m) => m.kind === 'timeline_append').at(-1).payload.items[0];
    expect(added).toMatchObject({ kind: 'search', title: '2026년 6월 기출 검색', body: '미적분 · 21, 22번', reopenable: true });

    got.length = 0;
    t.send(ev('timeline_item_selected', { itemId: added.id }));
    jest.runOnlyPendingTimers();
    expect(got[0]).toMatchObject({ kind: 'show_component', payload: { componentId: 'problem_list', props: { source: { kind: 'exam_query', query } } } });
    t.close();
    jest.useRealTimers();
  });
});
