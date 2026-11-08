import { initialRouterState, routeCommand, type RouterState } from '../src/agent/commandRouter';
import { resolveComponent } from '../src/host/registry';
import { AgentSession } from '../src/agent/session';

let seq = 0;
const cmd = (kind: string, payload: unknown) => ({
  v: 1,
  id: `c${++seq}`,
  sessionId: 's',
  seq,
  ts: '2026-10-31T00:00:00Z',
  kind,
  payload,
});
const run = (state: RouterState, raw: unknown) => routeCommand(state, raw, 'tablet');

const withList = () =>
  run(initialRouterState, cmd('show_component', { componentId: 'problem_list', props: { source: { kind: 'bookmarks' } } })).state;

describe('study_note sheet slot', () => {
  it('routes study_note to the sheet slot without touching stage', () => {
    const r = run(withList(), cmd('show_component', { componentId: 'study_note', props: { taskId: 7, mode: 'self' } }));
    expect(r.ack?.payload.ok).toBe(true);
    expect(r.state.sheet).toEqual({ componentId: 'study_note', props: { taskId: 7, mode: 'self' } });
    expect(r.state.stage?.componentId).toBe('problem_list');
  });

  it('rejects study_note with invalid props', () => {
    const r = run(initialRouterState, cmd('show_component', { componentId: 'study_note', props: { taskId: 'x' } }));
    expect(r.ack?.payload).toMatchObject({ ok: false, code: 'invalid_props' });
    expect(r.state.sheet).toBeNull();
  });

  it('close_component study_note clears only the sheet', () => {
    let r = run(withList(), cmd('show_component', { componentId: 'study_note', props: { taskId: 7, mode: 'live' } }));
    r = run(r.state, cmd('close_component', { componentId: 'study_note' }));
    expect(r.state.sheet).toBeNull();
    expect(r.state.stage?.componentId).toBe('problem_list');
  });

  it('accepts optional taskId on exam_query and problem_preview', () => {
    const a = resolveComponent('problem_list', { source: { kind: 'exam_query', query: {}, taskId: 3 } }, 'tablet');
    expect(a.ok).toBe(true);
    if (a.ok) expect(a.props).toMatchObject({ source: { kind: 'exam_query', taskId: 3 } });
    const b = resolveComponent('problem_preview', { topicId: 1, taskId: 4 }, 'tablet');
    expect(b.ok && b.props.taskId).toBe(4);
  });

  it('session.showLocalSheet / closeSheet update the snapshot', () => {
    const session = new AgentSession({
      transport: { connect() {}, send() {}, close() {} },
      device: () => ({ mode: 'tablet', width: 1000, height: 800, os: 'ios' }),
      appVersion: 't',
    });
    session.showLocalSheet('study_note', { taskId: 1, mode: 'self' });
    expect(session.getSnapshot().sheet).toEqual({ componentId: 'study_note', props: { taskId: 1, mode: 'self' } });
    session.closeSheet();
    expect(session.getSnapshot().sheet).toBeNull();
  });
});
