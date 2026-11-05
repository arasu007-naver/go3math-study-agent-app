// 에이전트 세션 클라이언트(명세서 §5.6): seq/ack, hello.resume 재개, 지수 백오프 재연결, 오프라인 큐.
// 화면 컴포넌트 밖 모듈 상태라 폴더블 모드 전환 시에도 유지된다(§4.7).
import { PROTOCOL_VERSION, newId, type AppEvent, type AppEventKind, type AppEventPayloads } from '../protocol';
import { initialRouterState, resolveInstruction, routeCommand, type RouterState } from './commandRouter';
import type { DeviceMode } from '../layout/deviceMode';
import { registry } from '../host/registry';

export interface Transport {
  connect(handlers: { onOpen(): void; onMessage(data: string): void; onClose(): void }): void;
  send(data: string): void;
  close(): void;
}

export interface KeyValueStore {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
}

export const memoryStore = (): KeyValueStore => {
  const m = new Map<string, string>();
  return { getString: (k) => m.get(k), set: (k, v) => void m.set(k, v) };
};

export const OUTBOX_KEY = 'agent:outbox';
export const OUTBOX_LIMIT = 200;
const PRIORITY_KINDS: string[] = ['workout_saved'];

export type SessionSnapshot = RouterState & { connected: boolean };

export type SessionOptions = {
  transport: Transport;
  store?: KeyValueStore;
  device: () => { mode: DeviceMode; width: number; height: number; os: string };
  appVersion: string;
  sessionId?: string;
  backoff?: (attempt: number) => number;
  schedule?: (fn: () => void, ms: number) => unknown;
};

export const defaultBackoff = (attempt: number) => Math.min(30_000, 1000 * 2 ** attempt);

export class AgentSession {
  private state: SessionSnapshot = { ...initialRouterState, connected: false };
  private listeners = new Set<() => void>();
  private appSeq = 0;
  private attempt = 0;
  private closed = false;
  private stageBeforeLocal: SessionSnapshot['stage'] = null;
  private readonly store: KeyValueStore;
  readonly sessionId: string;

  constructor(private readonly opts: SessionOptions) {
    this.store = opts.store ?? memoryStore();
    this.sessionId = opts.sessionId ?? newId();
    const outbox = this.outbox();
    this.appSeq = outbox.reduce((max, e) => Math.max(max, e.seq), 0);
  }

  // ── 외부 구독 (useSyncExternalStore)
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  };
  getSnapshot = () => this.state;

  start() {
    this.closed = false;
    this.opts.transport.connect({
      onOpen: () => this.handleOpen(),
      onMessage: (data) => this.handleMessage(data),
      onClose: () => this.handleClose(),
    });
  }

  stop() {
    this.closed = true;
    this.opts.transport.close();
  }

  /** 학생 행동 이벤트. UI 반영 후 호출하며, 실패해도 UI를 막지 않는다(§5.4). */
  emit<K extends AppEventKind>(kind: K, payload: AppEventPayloads[K], replyTo?: string) {
    this.appSeq += 1;
    const evt: AppEvent<K> = {
      v: PROTOCOL_VERSION,
      id: newId(),
      sessionId: this.sessionId,
      seq: this.appSeq,
      ts: new Date().toISOString(),
      kind,
      payload,
      ...(replyTo ? { replyTo } : {}),
    };
    this.saveOutbox(capOutbox([...this.outbox(), evt as AppEvent]));
    this.flush();
  }

  selectChoice(messageId: string, choiceId: string) {
    this.update(resolveInstruction(this.state, messageId));
    this.emit('choice_selected', { messageId, choiceId });
  }

  dismissInstruction(messageId: string) {
    this.update(resolveInstruction(this.state, messageId));
  }

  /** 학생이 직접 연 위젯(Stage 헤더 책갈피 버튼). 에이전트 명령이 아닌 유일한 Stage 교체로, 다음 show_component가 오면 그대로 덮어쓴다 */
  showLocalComponent(componentId: string, props: Record<string, unknown>) {
    this.stageBeforeLocal = this.state.stage;
    this.update({ ...this.state, stage: { componentId, props }, fallbackText: null });
  }

  /** showLocalComponent 전에 떠 있던 화면(문제 목록 등)으로 되돌린다. 없었으면 빈 Stage */
  restoreStage() {
    this.update({ ...this.state, stage: this.stageBeforeLocal });
    this.stageBeforeLocal = null;
  }

  private handleOpen() {
    this.attempt = 0;
    this.setConnected(true);
    const d = this.opts.device();
    // hello는 큐를 거치지 않고 바로 보낸다(연결마다 1회).
    this.appSeq += 1;
    this.opts.transport.send(
      JSON.stringify({
        v: PROTOCOL_VERSION,
        id: newId(),
        sessionId: this.sessionId,
        seq: this.appSeq,
        ts: new Date().toISOString(),
        kind: 'hello',
        payload: {
          appVersion: this.opts.appVersion,
          protocolVersion: PROTOCOL_VERSION,
          device: d,
          // 이 기기 모드에서 Stage에 띄울 수 있는 위젯(태블릿은 문제 목록뿐, registry mode)
          capabilities: {
            components: Object.keys(registry).filter((id) => registry[id].mode === 'both' || registry[id].mode === d.mode),
            canvas: false,
            camera: false,
            scriptPlayback: false,
          },
          resume: { lastAgentSeq: this.state.lastAgentSeq },
        },
      } satisfies AppEvent<'hello'>),
    );
    this.flush();
  }

  private handleMessage(data: string) {
    let raw: unknown;
    try {
      raw = JSON.parse(data);
    } catch {
      return;
    }
    const { state, ack } = routeCommand(this.state, raw, this.opts.device().mode);
    this.update(state);
    if (ack) this.emit('ack', ack.payload, ack.replyTo);
  }

  private handleClose() {
    this.setConnected(false);
    if (this.closed) return;
    const delay = (this.opts.backoff ?? defaultBackoff)(this.attempt);
    this.attempt += 1;
    (this.opts.schedule ?? setTimeout)(() => {
      if (!this.closed) this.start();
    }, delay);
  }

  /** seq 순서대로 전송, 전송한 것만 큐에서 제거 */
  private flush() {
    if (!this.state.connected) return;
    const pending = [...this.outbox()].sort((a, b) => a.seq - b.seq);
    for (const evt of pending) {
      try {
        this.opts.transport.send(JSON.stringify(evt));
      } catch {
        break;
      }
      this.saveOutbox(this.outbox().filter((e) => e.id !== evt.id));
    }
  }

  private outbox(): AppEvent[] {
    const raw = this.store.getString(OUTBOX_KEY);
    return raw ? (JSON.parse(raw) as AppEvent[]) : [];
  }

  private saveOutbox(events: AppEvent[]) {
    this.store.set(OUTBOX_KEY, JSON.stringify(events));
  }

  private setConnected(connected: boolean) {
    this.state = { ...this.state, connected };
    this.listeners.forEach((l) => l());
  }

  private update(next: RouterState) {
    this.state = { ...next, connected: this.state.connected };
    this.listeners.forEach((l) => l());
  }
}

/** 상한 초과 시 오래된 것은 보존(§5.6 "오래된 순 폐기 금지")하고 가장 새 일반 이벤트를 버린다. workout_saved는 항상 보존 */
export function capOutbox(events: AppEvent[]): AppEvent[] {
  const out = [...events];
  while (out.length > OUTBOX_LIMIT) {
    const idx = out.findLastIndex((e) => !PRIORITY_KINDS.includes(e.kind));
    if (idx === -1) break;
    out.splice(idx, 1);
  }
  return out;
}
