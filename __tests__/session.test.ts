import { AgentSession, OUTBOX_LIMIT, capOutbox, memoryStore, type Transport } from '../src/agent/session';
import type { AppEvent } from '../src/protocol';
import { MockAgentTransport } from '../src/agent/mockAgent';

/** 테스트용 모의 서버: 보낸 명령을 기록하고 hello.resume 이후만 재전송한다. */
class FakeServer implements Transport {
  handlers?: Parameters<Transport['connect']>[0];
  open = false;
  received: any[] = [];
  commands: { seq: number; data: string }[] = [];
  delivered: number[] = [];

  connect(h: Parameters<Transport['connect']>[0]) {
    this.handlers = h;
  }
  accept() {
    this.open = true;
    this.handlers!.onOpen();
  }
  drop() {
    this.open = false;
    this.handlers!.onClose();
  }
  close() {
    this.open = false;
  }
  send(data: string) {
    if (!this.open) throw new Error('closed');
    const evt = JSON.parse(data);
    this.received.push(evt);
    if (evt.kind === 'hello') {
      const last = evt.payload.resume.lastAgentSeq;
      this.commands.filter((c) => c.seq > last).forEach((c) => this.deliver(c));
    }
  }
  push(seq: number, kind: string, payload: unknown, deliver = true) {
    const c = { seq, data: JSON.stringify({ v: 1, id: `cmd${seq}`, sessionId: 's', seq, ts: 'x', kind, payload }) };
    this.commands.push(c);
    if (deliver && this.open) this.deliver(c);
  }
  private deliver(c: { seq: number; data: string }) {
    this.delivered.push(c.seq);
    this.handlers!.onMessage(c.data);
  }
}

const device = () => ({ mode: 'phone' as const, width: 390, height: 844, os: 'ios' });

function setup() {
  const server = new FakeServer();
  const reconnects: (() => void)[] = [];
  const session = new AgentSession({
    transport: server,
    store: memoryStore(),
    device,
    appVersion: '3.0.0',
    schedule: (fn) => reconnects.push(fn),
  });
  session.start();
  return { server, session, reconnect: () => reconnects.shift()!() };
}

describe('AgentSession (M2)', () => {
  it('sends hello with resume and receives only commands after lastAgentSeq on reconnect', () => {
    const { server, session, reconnect } = setup();
    server.accept();
    expect(server.received[0]).toMatchObject({ kind: 'hello', payload: { resume: { lastAgentSeq: 0 } } });

    server.push(1, 'say', { messageId: 'm1', text: 'hi' });
    server.push(2, 'show_component', { componentId: 'topic_list', props: {} });
    expect(session.getSnapshot().lastAgentSeq).toBe(2);

    server.drop();
    server.push(3, 'say', { messageId: 'm3', text: 'missed' }, false); // sent while offline
    server.delivered = [];
    reconnect();
    server.accept();

    const hello = server.received.filter((e) => e.kind === 'hello').pop();
    expect(hello.payload.resume.lastAgentSeq).toBe(2);
    expect(server.delivered).toEqual([3]);
    expect(session.getSnapshot().instruction?.messageId).toBe('m3');
  });

  it('acks every command', () => {
    const { server } = setup();
    server.accept();
    server.push(1, 'say', { messageId: 'm1', text: 'hi' });
    server.push(2, 'show_component', { componentId: 'nope', props: {} });
    const acks = server.received.filter((e) => e.kind === 'ack');
    expect(acks.map((a) => [a.replyTo, a.payload.ok])).toEqual([
      ['cmd1', true],
      ['cmd2', false],
    ]);
  });

  it('queues events while offline and flushes them in order after reconnect', () => {
    const { server, session, reconnect } = setup();
    server.accept();
    server.drop();

    session.emit('topic_selected', { topicId: 1, source: 'topic_list' });
    session.emit('unit_selected', { topicId: 1, unitIdx: 0 });
    session.emit('back_requested', { from: 'problem_preview' });
    expect(server.received.filter((e) => e.kind !== 'hello')).toHaveLength(0);

    reconnect();
    server.accept();
    const sent = server.received.filter((e) => !['hello', 'ack'].includes(e.kind));
    expect(sent.map((e) => e.kind)).toEqual(['topic_selected', 'unit_selected', 'back_requested']);
    const seqs = sent.map((e) => e.seq);
    expect([...seqs].sort((a, b) => a - b)).toEqual(seqs);
  });

  it('caps the outbox without dropping old events or workout_saved', () => {
    const evt = (seq: number, kind: string) => ({ seq, kind, id: `e${seq}` }) as unknown as AppEvent;
    const events = [evt(1, 'workout_saved'), ...Array.from({ length: OUTBOX_LIMIT }, (_, i) => evt(i + 2, 'student_text'))];
    const capped = capOutbox(events);
    expect(capped).toHaveLength(OUTBOX_LIMIT);
    expect(capped[0].kind).toBe('workout_saved');
    expect(capped[1].seq).toBe(2);
  });
});

describe('AgentSession local Stage (책갈피 버튼)', () => {
  it('shows bookmarks over the current problem list and restores it', () => {
    const { server, session } = setup();
    server.accept();
    const list = { source: { kind: 'task', taskId: 7 } };
    server.push(1, 'show_component', { componentId: 'problem_list', props: list });
    session.showLocalComponent('problem_list', { source: { kind: 'bookmarks' } });
    expect(session.getSnapshot().stage).toEqual({ componentId: 'problem_list', props: { source: { kind: 'bookmarks' } } });
    session.restoreStage();
    expect(session.getSnapshot().stage).toEqual({ componentId: 'problem_list', props: list });
  });

  it('restores an empty Stage when nothing was shown before', () => {
    const { session } = setup();
    session.showLocalComponent('problem_list', { source: { kind: 'bookmarks' } });
    session.restoreStage();
    expect(session.getSnapshot().stage).toBeNull();
  });
});

describe('MockAgentTransport study note', () => {
  const ev = (kind: string, payload: object) => JSON.stringify({ kind, payload });

  function mock() {
    jest.useFakeTimers();
    const got: any[] = [];
    const t = new MockAgentTransport();
    t.connect({ onOpen: () => {}, onClose: () => {}, onMessage: (d) => got.push(JSON.parse(d)) });
    t.send(ev('hello', { device: { mode: 'tablet' } }));
    jest.runOnlyPendingTimers();
    got.length = 0;
    const send = (kind: string, payload: object) => {
      t.send(ev(kind, payload));
      jest.runOnlyPendingTimers();
    };
    return { t, got, send };
  }
  afterEach(() => jest.useRealTimers());

  it('asks for a self study note after solving', () => {
    const { t, got, send } = mock();
    send('solve_finished', { taskId: 7, kind: 'self', solvedCount: 1 });
    expect(got).toHaveLength(1);
    expect(got[0]).toMatchObject({ kind: 'show_component', payload: { componentId: 'study_note', props: { taskId: 7, mode: 'self' } } });
    t.close();
  });

  it('uses live mode for topic_live and hotline', () => {
    const { t, got, send } = mock();
    send('solve_finished', { taskId: 7, kind: 'topic_live', solvedCount: 2 });
    send('solve_finished', { taskId: 8, kind: 'hotline', solvedCount: 1 });
    expect(got.map((m) => m.payload.props.mode)).toEqual(['live', 'live']);
    t.close();
  });

  it('stays silent without a taskId or with zero solved', () => {
    const { t, got, send } = mock();
    send('solve_finished', { kind: 'self', solvedCount: 1 });
    send('solve_finished', { taskId: 7, kind: 'self', solvedCount: 0 });
    expect(got).toHaveLength(0);
    t.close();
  });

  it('records the saved note and does not ask again for that task', () => {
    const { t, got, send } = mock();
    send('study_note_saved', { taskId: 7 });
    const added = got.find((m) => m.kind === 'timeline_append');
    expect(added.payload.items[0]).toMatchObject({ kind: 'task', title: '학습장을 남겼어요' });
    got.length = 0;
    send('solve_finished', { taskId: 7, kind: 'self', solvedCount: 1 });
    expect(got).toHaveLength(0);
    send('solve_finished', { taskId: 9, kind: 'self', solvedCount: 1 });
    expect(got).toHaveLength(1);
    t.close();
  });

  it('ignores a dismissed note', () => {
    const { t, got, send } = mock();
    send('study_note_dismissed', { taskId: 7 });
    expect(got).toHaveLength(0);
    t.close();
  });
});
