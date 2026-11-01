// 모의 에이전트(M1-P): 서버 없이 §6 시나리오 앞부분(인사 → 주제 선택 → 문제 보기)과
// 튜터 메시지를 재생한다. 서버 v0(M5)가 준비되면 WebSocketTransport로 교체한다.
import { PROTOCOL_VERSION, newId } from '../protocol';
import type { Transport } from './session';

type Handlers = Parameters<Transport['connect']>[0];

export class MockAgentTransport implements Transport {
  private handlers?: Handlers;
  private seq = 0;
  private sent: { seq: number; data: string }[] = [];
  private timers: ReturnType<typeof setTimeout>[] = [];
  private greeted = false;

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
        const last = evt.payload.resume?.lastAgentSeq ?? 0;
        this.sent.filter((m) => m.seq > last).forEach((m) => this.deliver(m.data));
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
        this.onTopic(evt.payload.topicId, evt.payload.title);
        break;
      case 'menu_selected':
        if (evt.payload.menu === 'search') {
          // 검색 패널은 앱이 drawer 옆 dock으로 연다. drawer가 열려 있으므로 안내만 바꾼다.
          this.say('검색 조건을 고르고 "가자"를 누르거나, 주제/묶음에서 주제를 골라 주세요.', [], 'info');
        } else {
          this.say('공지 사항을 확인해 보세요.', [], 'info');
        }
        break;
      case 'search_submitted': {
        const q = evt.payload.query;
        this.say(
          `${q.major} · ${q.years.join(',')}년 ${q.months.join(',')}월 · ${q.numbers.length}문항 조건을 받았어요. 문제 조회는 에이전트 서버(M5)가 맡아요.`,
          [{ id: 'pick_topic', label: '주제 목록으로' }],
          'info',
        );
        break;
      }
      case 'unit_selected':
        this.say(`${evt.payload.unitIdx + 1}번 문제예요. 연습장에 풀고 사진을 올려 주세요.`, [], 'prompt');
        break;
      case 'back_requested':
        this.showTopics();
        this.say('주제 목록으로 돌아왔어요. 다른 주제를 골라 볼까요?');
        break;
    }
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
    if (choiceId === 'pick_topic') {
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
