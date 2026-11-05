// 명령 → UI 상태 전이(reducer). 단일 진실 원천(명세서 §3.2). 순수 함수라 화면 컴포넌트와 무관하게
// 상태가 유지되어 폴더블 모드 전환 후에도 열린 instruction·Stage가 그대로 옮겨진다(§4.7).
import { parseCommand, type AppEventPayloads, type TimelineItem } from '../protocol';
import { resolveComponent } from '../host/registry';
import type { DeviceMode } from '../layout/deviceMode';

export type Instruction = {
  messageId: string;
  source: 'tutor' | 'default';
  text: string;
  choices: { id: string; label: string }[];
  requiresResponse: boolean;
  tone?: 'info' | 'prompt' | 'encourage';
  /** 에이전트가 보낸 시각(명령 ts). 채팅 타임라인에서 시간순으로 섞을 때 쓴다 */
  ts?: string;
};

export type StageView = { componentId: string; props: Record<string, unknown> };

export type RouterState = {
  lastAgentSeq: number;
  acked: Record<string, AppEventPayloads['ack']>; // command id → 이미 보낸 ack (멱등 재송용)
  stage: StageView | null;
  fallbackText: string | null; // 위젯을 띄우지 못했을 때 텍스트 대체 안내
  instruction: Instruction | null;
  pausedDefault: Instruction | null; // 튜터 instruction 처리 중 일시정지된 기본 흐름
  history: Instruction[];
  /** 채팅 타임라인 항목(시간순). 서버가 보관하고 timeline_append로 보낸다 */
  timeline: TimelineItem[];
  ended: boolean;
};

export const initialRouterState: RouterState = {
  lastAgentSeq: 0,
  acked: {},
  stage: null,
  fallbackText: null,
  instruction: null,
  pausedDefault: null,
  history: [],
  timeline: [],
  ended: false,
};

export type RouteResult = { state: RouterState; ack?: { replyTo: string; payload: AppEventPayloads['ack'] } };

const FALLBACK_TEXT = '이 화면은 아직 이 앱에서 열 수 없어요. 에이전트의 안내를 따라 주세요.';

export function routeCommand(state: RouterState, raw: unknown, mode: DeviceMode): RouteResult {
  const parsed = parseCommand(raw);

  if (!parsed.ok) {
    if (!parsed.id) return { state };
    const payload = { ok: false, stage: 'failed' as const, code: parsed.code, message: parsed.message };
    return {
      state: withAck({ ...state, fallbackText: FALLBACK_TEXT }, parsed.id, parsed.seq, payload),
      ack: { replyTo: parsed.id, payload },
    };
  }

  const cmd = parsed.command;
  const previous = state.acked[cmd.id];
  if (previous) return { state, ack: { replyTo: cmd.id, payload: previous } };

  const applied = { ok: true, stage: 'applied' as const };
  let next = state;
  let payload: AppEventPayloads['ack'] = applied;

  switch (cmd.kind) {
    case 'say': {
      const p = cmd.payload;
      const ins: Instruction = {
        messageId: p.messageId,
        source: p.source,
        text: p.text,
        choices: p.choices ?? [],
        requiresResponse: p.requiresResponse ?? (p.choices?.length ?? 0) > 0,
        tone: p.tone,
        ts: cmd.ts,
      };
      next = applyInstruction(state, ins);
      break;
    }
    case 'show_component': {
      const r = resolveComponent(cmd.payload.componentId, cmd.payload.props, mode);
      if (r.ok) {
        next = { ...state, stage: { componentId: cmd.payload.componentId, props: r.props }, fallbackText: null };
      } else {
        payload = { ok: false, stage: 'failed', code: r.code, message: r.message };
        next = { ...state, fallbackText: FALLBACK_TEXT };
      }
      break;
    }
    case 'show_topic_list': {
      const src = cmd.payload.source;
      const props =
        src.kind === 'subject'
          ? { subject: src.subject, pageSize: cmd.payload.pageSize }
          : src.kind === 'exam'
            ? { subject: src.subject, filter: { year: src.year, month: src.month }, pageSize: cmd.payload.pageSize }
            : null;
      const r = props
        ? resolveComponent('topic_list', props, mode)
        : ({ ok: false, code: 'unsupported', message: 'show_topic_list source.kind=ids is not supported yet' } as const);
      if (r.ok) {
        next = { ...state, stage: { componentId: 'topic_list', props: r.props }, fallbackText: null };
      } else {
        payload = { ok: false, stage: 'failed', code: r.code, message: r.message };
        next = { ...state, fallbackText: FALLBACK_TEXT };
      }
      break;
    }
    case 'close_component': {
      const id = cmd.payload.componentId;
      if (!id || state.stage?.componentId === id) next = { ...state, stage: null };
      break;
    }
    case 'timeline_append':
      next = { ...state, timeline: mergeTimeline(cmd.payload.replace ? [] : state.timeline, cmd.payload.items) };
      break;
    case 'end_session':
      next = { ...state, ended: true };
      break;
    case 'request_state':
      break;
  }

  return { state: withAck(next, cmd.id, cmd.seq, payload), ack: { replyTo: cmd.id, payload } };
}

/** 튜터 우선: 튜터 instruction이 오면 기본 흐름을 일시정지, 처리 후 재개(§4.5). */
function applyInstruction(state: RouterState, ins: Instruction): RouterState {
  const current = state.instruction;
  if (ins.source === 'tutor') {
    const paused = current?.source === 'default' ? current : state.pausedDefault;
    return { ...state, instruction: ins, pausedDefault: paused, history: archive(state.history, current) };
  }
  if (current?.source === 'tutor') {
    return { ...state, pausedDefault: ins };
  }
  return { ...state, instruction: ins, history: archive(state.history, current) };
}

/** 학생이 instruction에 응답(선택/닫기)했을 때. 튜터 처리 후 일시정지된 기본 흐름을 재개한다. */
export function resolveInstruction(state: RouterState, messageId: string): RouterState {
  const current = state.instruction;
  if (!current || current.messageId !== messageId) return state;
  const resume = current.source === 'tutor' ? state.pausedDefault : null;
  return {
    ...state,
    instruction: resume,
    pausedDefault: current.source === 'tutor' ? null : state.pausedDefault,
    history: archive(state.history, current),
  };
}

function archive(history: Instruction[], ins: Instruction | null): Instruction[] {
  if (!ins || history.some((h) => h.messageId === ins.messageId)) return history;
  return [...history, ins].slice(-50);
}

const TIMELINE_MAX = 200;

/** 같은 id는 새 항목으로 바꾸고 시각순으로 정렬, 최근 TIMELINE_MAX개만 남긴다 */
export function mergeTimeline(current: TimelineItem[], items: TimelineItem[]): TimelineItem[] {
  const byId = new Map(current.map((t) => [t.id, t]));
  for (const t of items) byId.set(t.id, t);
  return [...byId.values()].sort((a, b) => Date.parse(a.ts) - Date.parse(b.ts)).slice(-TIMELINE_MAX);
}

function withAck(state: RouterState, id: string, seq: number | undefined, ack: AppEventPayloads['ack']): RouterState {
  return {
    ...state,
    lastAgentSeq: seq !== undefined ? Math.max(state.lastAgentSeq, seq) : state.lastAgentSeq,
    acked: { ...state.acked, [id]: ack },
  };
}
