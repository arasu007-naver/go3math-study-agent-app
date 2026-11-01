// @qoolla/agent-protocol (명세서 §5.2) — 우선 앱 내부 모듈로 두고, 서버 착수 시 별도 패키지로 분리한다.
// M2 범위: say / show_component / close_component / end_session / request_state 명령과 앱 이벤트.
// 그 밖의 명령 kind(open_canvas 등)는 알려진 kind 목록에만 있고 앱은 'unsupported' ack로 거절한다.
import { z } from 'zod';

export const PROTOCOL_VERSION = 1 as const;

const envelope = <K extends string, P extends z.ZodTypeAny>(kind: K, payload: P) =>
  z.object({
    v: z.literal(PROTOCOL_VERSION),
    id: z.string().min(1),
    sessionId: z.string(),
    seq: z.number().int().nonnegative(),
    ts: z.string(),
    kind: z.literal(kind),
    payload,
    replyTo: z.string().optional(),
  });

const choice = z.object({ id: z.string(), label: z.string() });

// §4.5 instruction 정규화: say에 source / requiresResponse를 추가한다.
export const SayCmdSchema = envelope(
  'say',
  z.object({
    messageId: z.string(),
    text: z.string(),
    tone: z.enum(['info', 'prompt', 'encourage']).optional(),
    choices: z.array(choice).optional(),
    replace: z.boolean().optional(),
    source: z.enum(['tutor', 'default']).default('default'),
    requiresResponse: z.boolean().optional(),
  }),
);

export const COMPONENT_IDS = [
  'topic_list',
  'exam_search',
  'research',
  'problem_preview',
  'record_calendar',
  'study_timeline',
  'solve_canvas',
  'photo_capture',
] as const;

export const ShowComponentCmd = envelope(
  'show_component',
  z.object({
    componentId: z.string(),
    props: z.record(z.string(), z.unknown()).default({}),
    placement: z.literal('stage').optional(),
  }),
);
// §5.2 show_topic_list. source.kind='ids'(서버가 시험 주제를 id로 풀어 보냄, §6.3)는 목록 위젯이 아직 지원하지 않아 앱이 거절한다.
export const ShowTopicListCmd = envelope(
  'show_topic_list',
  z.object({
    title: z.string().optional(),
    source: z.discriminatedUnion('kind', [
      z.object({ kind: z.literal('subject'), subject: z.string() }),
      z.object({ kind: z.literal('exam'), year: z.number(), month: z.number(), subject: z.string().optional() }),
      z.object({ kind: z.literal('ids'), topicIds: z.array(z.number()) }),
    ]),
    pageSize: z.number().int().positive().optional(),
  }),
);
export const CloseComponentCmd = envelope('close_component', z.object({ componentId: z.string().optional() }));
export const EndSessionCmd = envelope('end_session', z.object({ reason: z.enum(['done', 'timeout', 'error']) }));
export const RequestStateCmd = envelope('request_state', z.object({}));

export const AgentCommandSchema = z.discriminatedUnion('kind', [
  SayCmdSchema,
  ShowComponentCmd,
  ShowTopicListCmd,
  CloseComponentCmd,
  EndSessionCmd,
  RequestStateCmd,
]);
export type AgentCommand = z.infer<typeof AgentCommandSchema>;
export type SayCmd = z.infer<typeof SayCmdSchema>;

/** §5.2에 정의되었지만 이 앱 버전이 아직 처리하지 않는 명령 */
export const KNOWN_UNHANDLED_KINDS = ['open_canvas', 'show_script_button', 'play_script', 'request_photo'];

// ───────── 이벤트 (app → agent)
export type AckCode = 'unsupported' | 'invalid_props' | 'offline' | 'internal';

export type AppEventPayloads = {
  hello: {
    appVersion: string;
    protocolVersion: number;
    device: { mode: 'phone' | 'tablet'; width: number; height: number; os: string };
    capabilities: { components: string[]; canvas: boolean; camera: boolean; scriptPlayback: boolean };
    resume?: { lastAgentSeq: number };
  };
  ack: { ok: boolean; stage: 'received' | 'applied' | 'failed'; code?: AckCode; message?: string };
  choice_selected: { messageId: string; choiceId: string };
  student_text: { text: string };
  topic_selected: { topicId: number; title?: string; source: 'topic_list' | 'exam_search' | 'research' };
  unit_selected: { topicId: number; unitIdx: number };
  // §4.4 exam_search 위젯 이벤트. 과제 생성·문제 조회는 서버가 이 쿼리로 수행한다.
  search_submitted: {
    query: { queryType: 'selection'; major: string; years: number[]; months: number[]; numbers: number[]; studyType: string };
  };
  back_requested: { from: string };
  // 태블릿 drawer 하단 고정 메뉴 중 학습 흐름에 속하는 것(검색·공지). 화면 전환은 에이전트가 결정한다.
  menu_selected: { menu: 'search' | 'notice' | 'timeline' };
  // 타임라인 카드의 '가자!!!'. 학습 기록(task)을 다시 여는 방법은 에이전트가 결정한다.
  task_selected: { taskId: number; taskType: string; collectionId?: number };
  app_state: { state: 'foreground' | 'background' };
  client_error: { where: string; message: string; commandId?: string };
};
export type AppEventKind = keyof AppEventPayloads;

export type AppEvent<K extends AppEventKind = AppEventKind> = {
  v: typeof PROTOCOL_VERSION;
  id: string;
  sessionId: string;
  seq: number;
  ts: string;
  kind: K;
  payload: AppEventPayloads[K];
  replyTo?: string;
};

export type ParseResult =
  | { ok: true; command: AgentCommand }
  | { ok: false; code: AckCode; id?: string; seq?: number; message: string };

/** 알 수 없는 필드는 무시(zod object 기본 strip), 알 수 없는 kind는 unsupported. */
export function parseCommand(raw: unknown): ParseResult {
  const head = z.object({ id: z.string(), seq: z.number(), kind: z.string() }).safeParse(raw);
  if (!head.success) return { ok: false, code: 'internal', message: 'malformed envelope' };
  const { id, seq, kind } = head.data;
  if (!AgentCommandSchema.options.some((o) => o.shape.kind.value === kind)) {
    return { ok: false, code: 'unsupported', id, seq, message: `unsupported kind: ${kind}` };
  }
  const parsed = AgentCommandSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, code: 'invalid_props', id, seq, message: parsed.error.message };
  return { ok: true, command: parsed.data };
}

let counter = 0;
export function newId(): string {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
