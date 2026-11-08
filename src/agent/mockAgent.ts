// 모의 에이전트(M1-P): 서버 없이 §6 시나리오 앞부분(인사 → 주제 선택 → 문제 보기)과
// 튜터 메시지를 재생한다. 서버 v0(M5)가 준비되면 WebSocketTransport로 교체한다.
import { PROTOCOL_VERSION, newId, type TimelineItem } from '../protocol';
import type { Transport } from './session';

type Handlers = Parameters<Transport['connect']>[0];

export class MockAgentTransport implements Transport {
  private handlers?: Handlers;
  private seq = 0;
  private sent: { seq: number; data: string }[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private greeted = false;
  private mode: 'phone' | 'tablet' = 'tablet';
  // 서버가 보관하는 채팅 타임라인 흉내. 다시 열 때 쓸 원래 요청을 항목 id로 기억한다
  private timeline: TimelineItem[] = seedTimeline();
  // 학습장을 이미 남긴 학습 기록(taskId): 같은 기록은 다시 묻지 않는다
  private notedTasks = new Set<number>();
  private reopen = new Map<string, { kind: string; payload: Record<string, any> }>();

  constructor(private readonly opts: { tutorDelayMs?: number } = {}) {}

  connect(handlers: Handlers) {
    this.handlers = handlers;
    this.timers.push(setTimeout(() => handlers.onOpen(), 0));
  }

  close() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    const h = this.handlers;
    this.handlers = undefined;
    h?.onClose();
  }

  send(data: string) {
    const evt = JSON.parse(data) as { kind: string; payload: Record<string, any> };
    switch (evt.kind) {
      case 'hello': {
        this.mode = evt.payload.device?.mode ?? this.mode;
        const last = evt.payload.resume?.lastAgentSeq ?? 0;
        this.sent.filter((m) => m.seq > last).forEach((m) => this.deliver(m.data));
        this.cmd('timeline_append', { items: this.timeline, replace: true });
        if (!this.greeted) {
          this.greeted = true;
          this.greet();
        }
        break;
      }
      case 'choice_selected':
        this.onChoice(evt.payload.choiceId);
        break;
      case 'topic_selected':
        this.record('topic', evt.payload.title ?? '주제', '주제를 열었어요', evt);
        this.onTopic(evt.payload.topicId, evt.payload.title);
        break;
      case 'timeline_item_selected': {
        const r = this.reopen.get(evt.payload.itemId);
        if (r?.kind === 'search_submitted') this.cmd('show_component', { componentId: 'problem_list', props: { source: { kind: 'exam_query', query: r.payload.query } } });
        else if (r?.kind === 'task_selected') this.cmd('show_component', { componentId: 'problem_list', props: { source: { kind: 'task', taskId: r.payload.taskId } } });
        else if (r?.kind === 'topic_selected') this.cmd('show_component', { componentId: 'problem_preview', props: { topicId: r.payload.topicId } });
        break;
      }
      case 'menu_selected':
        if (evt.payload.menu === 'search') {
          // 검색 패널은 앱이 drawer 옆 dock으로 연다. drawer가 열려 있으므로 안내만 바꾼다.
          this.say('검색 조건을 고르고 "가자"를 누르거나, 주제/묶음에서 주제를 골라 주세요.', [], 'info');
        } else {
          this.say('공지 사항을 확인해 보세요.', [], 'info');
        }
        break;
      // 안내를 먼저 보내고 문제 목록을 띄운다(앱은 문제 목록이 뜨면 drawer를 닫는다)
      case 'search_submitted':
        this.record('search', searchTitle(evt.payload.query), searchBody(evt.payload.query), evt);
        this.say('검색 조건에 맞는 문제예요. 풀 문제를 고르고 연필 버튼을 눌러 풀어 보세요.', [], 'prompt');
        this.cmd('show_component', { componentId: 'problem_list', props: { source: { kind: 'exam_query', query: evt.payload.query } } });
        break;
      case 'task_selected':
        this.record('task', '학습 기록 이어 풀기', `${evt.payload.taskType} · 기록 #${evt.payload.taskId}`, evt);
        this.say('지난번에 보던 문제예요. 풀 문제를 고르고 연필 버튼을 눌러 이어서 풀어 보세요.', [], 'prompt');
        // 모든 학습 기록(주제 포함)은 problem_list가 기록 종류에 맞게 문제를 모은다
        this.cmd('show_component', { componentId: 'problem_list', props: { source: { kind: 'task', taskId: evt.payload.taskId } } });
        break;
      case 'problem_selected':
        this.say(`${evt.payload.index + 1}번 문제를 골랐어요. 연필 버튼을 눌러 풀어 보세요.`, [], 'prompt');
        break;
      case 'unit_selected':
        this.say(`${evt.payload.unitIdx + 1}번 문제예요. 연습장에 풀고 사진을 올려 주세요.`, [], 'prompt');
        break;
      case 'solve_finished': {
        const { taskId, kind, solvedCount } = evt.payload;
        if (typeof taskId !== 'number' || !(solvedCount > 0) || this.notedTasks.has(taskId)) break;
        this.cmd('show_component', { componentId: 'study_note', props: { taskId, mode: kind === 'self' ? 'self' : 'live' } });
        break;
      }
      case 'study_note_saved':
        this.notedTasks.add(evt.payload.taskId);
        this.record('task', '학습장을 남겼어요', `기록 #${evt.payload.taskId}`, evt);
        break;
      case 'study_note_dismissed':
        break; // 닫기만 한 경우는 무시한다(다음 풀이 후 다시 물을 수 있다)
      case 'back_requested':
        // 문제 목록에서 뒤로 → 빈 Stage(가운데 로고)
        if (evt.payload.from === 'problem_list') {
          this.cmd('close_component', {});
          break;
        }
        this.showTopics();
        this.say('주제 목록으로 돌아왔어요. 다른 주제를 골라 볼까요?');
        break;
    }
  }

  /** 학생 행동을 타임라인에 기록하고 앱에 새 항목을 보낸다(실서버는 DB에 저장) */
  private record(kind: TimelineItem['kind'], title: string, body: string, evt: { kind: string; payload: Record<string, any> }) {
    const item: TimelineItem = { id: newId(), ts: new Date().toISOString(), kind, title, body, reopenable: true };
    this.timeline = [...this.timeline, item];
    this.reopen.set(item.id, evt);
    this.cmd('timeline_append', { items: [item] });
  }

  private showTopics() {
    this.cmd('show_topic_list', { source: { kind: 'subject', subject: 'COMMON_MATH' } });
  }

  private greet() {
    this.say('오늘은 무엇부터 할까요? 주제를 고르거나 10월 모의고사 문항을 검색할 수 있어요.', [
      { id: 'pick_topic', label: '주제 목록에서 고르기' },
      { id: 'search_exam', label: '10월 모의고사 검색' },
    ]);
  }

  private onChoice(choiceId: string) {
    // 태블릿 Stage는 문제 목록만 띄운다 → 주제·기출 검색은 drawer '검색' dock으로 안내
    if (this.mode === 'tablet' && (choiceId === 'pick_topic' || choiceId === 'search_exam')) {
      this.say("아래 '검색' 메뉴에서 주제를 고르거나 기출 조건을 골라 '가자'를 눌러 주세요.", [], 'info');
    } else if (choiceId === 'pick_topic') {
      this.showTopics();
      this.say('목록에서 공부할 주제를 눌러 주세요.', [], 'info');
    } else if (choiceId === 'search_exam') {
      this.cmd('show_component', { componentId: 'exam_search', props: { mode: 'this_year', preset: { months: [10] } } });
      this.say('계열과 문항 번호를 고르고 "가자"를 눌러 주세요.', [], 'info');
    } else if (choiceId === 'retry') {
      this.say('좋아요. 천천히 다시 풀어 보세요.', [], 'encourage');
    }
  }

  private onTopic(topicId: number, title?: string) {
    this.cmd('show_component', { componentId: 'problem_preview', props: { topicId } });
    this.say(`${title ?? '선택한 주제'}를 열었어요. 풀 문제 번호를 골라 주세요.`, [], 'prompt');
    this.timers.push(
      setTimeout(() => {
        this.say(
          '두 번째 줄 식을 다시 확인해 보세요. 부호가 바뀌는 지점이 있어요.',
          [{ id: 'retry', label: '다시 풀어 볼게요' }],
          'prompt',
          'tutor',
          false,
        );
      }, this.opts.tutorDelayMs ?? 8000),
    );
  }

  private say(
    text: string,
    choices: { id: string; label: string }[] = [],
    tone: 'info' | 'prompt' | 'encourage' = 'prompt',
    source: 'tutor' | 'default' = 'default',
    requiresResponse?: boolean,
  ) {
    this.cmd('say', { messageId: newId(), text, choices, tone, source, requiresResponse });
  }

  private cmd(kind: string, payload: unknown) {
    this.seq += 1;
    const data = JSON.stringify({
      v: PROTOCOL_VERSION,
      id: newId(),
      sessionId: 'mock',
      seq: this.seq,
      ts: new Date().toISOString(),
      kind,
      payload,
    });
    this.sent.push({ seq: this.seq, data });
    this.deliver(data);
  }

  private deliver(data: string) {
    this.timers.push(setTimeout(() => this.handlers?.onMessage(data), 0));
  }
}

type ExamQueryPayload = { major: string; years: number[]; months: number[]; numbers: number[] };

function searchTitle(q: ExamQueryPayload) {
  return `${q.years.join('·')}년 ${q.months.join('·')}월 기출 검색`;
}

function searchBody(q: ExamQueryPayload) {
  return [q.major, q.numbers.length > 0 ? `${q.numbers.join(', ')}번` : null].filter(Boolean).join(' · ');
}

/** 서버가 만들어 둔 일간·주간 학습 정리 예시 */
function seedTimeline(): TimelineItem[] {
  const day = 24 * 60 * 60 * 1000;
  const at = (ago: number) => new Date(Date.now() - ago).toISOString();
  return [
    {
      id: 'mock-weekly-1',
      ts: at(3 * day),
      kind: 'weekly_summary',
      title: '지난주 학습 정리',
      body: '5일 동안 문제 42개를 풀었어요. 정답률 71%로 전주보다 6% 올랐어요. 수열의 합에서 실수가 잦았어요.',
    },
    {
      id: 'mock-daily-1',
      ts: at(day),
      kind: 'daily_summary',
      title: '어제 학습 정리',
      body: '모의고사 6월 기출 8문제를 풀고 그중 6문제를 맞혔어요. 틀린 문제는 삼각함수 그래프 문제예요.',
    },
  ];
}

export class WebSocketTransport implements Transport {
  private ws?: WebSocket;
  constructor(private readonly url: string) {}
  connect(h: Handlers) {
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => h.onOpen();
    this.ws.onmessage = (e) => h.onMessage(String(e.data));
    this.ws.onclose = () => h.onClose();
  }
  send(data: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) throw new Error('not open');
    this.ws.send(data);
  }
  close() {
    this.ws?.close();
  }
}
