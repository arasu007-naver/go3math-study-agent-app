import { initialRouterState, resolveInstruction, routeCommand, type RouterState } from '../src/agent/commandRouter';

let seq = 0;
const cmd = (kind: string, payload: unknown, id = `c${++seq}`) => ({
  v: 1,
  id,
  sessionId: 's',
  seq,
  ts: '2026-10-31T00:00:00Z',
  kind,
  payload,
});
const say = (messageId: string, source: 'tutor' | 'default', extra: object = {}) =>
  cmd('say', { messageId, text: messageId, source, ...extra });

function run(state: RouterState, raw: unknown, mode: 'phone' | 'tablet' = 'phone') {
  return routeCommand(state, raw, mode);
}

describe('commandRouter (M2)', () => {
  beforeEach(() => (seq = 0));

  it('acks say / show_component / close_component as applied', () => {
    let r = run(initialRouterState, say('m1', 'default', { choices: [{ id: 'a', label: 'A' }] }));
    expect(r.ack?.payload).toEqual({ ok: true, stage: 'applied' });
    expect(r.state.instruction?.requiresResponse).toBe(true);

    r = run(r.state, cmd('show_component', { componentId: 'topic_list', props: { subject: '수학Ⅰ' } }));
    expect(r.ack?.payload.ok).toBe(true);
    expect(r.state.stage).toEqual({ componentId: 'topic_list', props: { subject: '수학Ⅰ' } });

    r = run(r.state, cmd('close_component', { componentId: 'topic_list' }));
    expect(r.ack?.payload.ok).toBe(true);
    expect(r.state.stage).toBeNull();
    expect(r.state.lastAgentSeq).toBe(3);
  });

  it('rejects unknown componentId and invalid props with a text fallback', () => {
    let r = run(initialRouterState, cmd('show_component', { componentId: 'nope', props: {} }));
    expect(r.ack?.payload).toMatchObject({ ok: false, code: 'unsupported' });
    expect(r.state.fallbackText).toBeTruthy();

    r = run(initialRouterState, cmd('show_component', { componentId: 'problem_preview', props: { topicId: 'x' } }));
    expect(r.ack?.payload).toMatchObject({ ok: false, code: 'invalid_props' });
    expect(r.state.stage).toBeNull();
  });

  it('rejects unknown kinds and ignores unknown fields', () => {
    const r1 = run(initialRouterState, cmd('open_canvas', {}));
    expect(r1.ack?.payload).toMatchObject({ ok: false, code: 'unsupported' });

    const r2 = run(initialRouterState, { ...say('m1', 'default'), extra: 1, payload: { messageId: 'm1', text: 't', futureField: true } });
    expect(r2.ack?.payload.ok).toBe(true);
  });

  it('is idempotent for a repeated command id', () => {
    const c = say('m1', 'default');
    const r1 = run(initialRouterState, c);
    const r2 = run(r1.state, c);
    expect(r2.state).toBe(r1.state);
    expect(r2.ack).toEqual(r1.ack);
  });

  it('pauses the default flow for a tutor instruction and resumes after', () => {
    let s = run(initialRouterState, say('d1', 'default')).state;
    s = run(s, say('t1', 'tutor')).state;
    expect(s.instruction?.messageId).toBe('t1');
    expect(s.pausedDefault?.messageId).toBe('d1');

    // a default instruction arriving while the tutor one is open replaces the paused one, not the tutor
    s = run(s, say('d2', 'default')).state;
    expect(s.instruction?.messageId).toBe('t1');
    expect(s.pausedDefault?.messageId).toBe('d2');

    s = resolveInstruction(s, 't1');
    expect(s.instruction?.messageId).toBe('d2');
    expect(s.pausedDefault).toBeNull();
    expect(s.history.map((h) => h.messageId)).toContain('t1');
  });
});
