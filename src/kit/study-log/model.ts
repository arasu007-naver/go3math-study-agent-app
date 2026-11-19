// Study Log '이번 주 학습장' 탭의 포트와 계산(docs/superpowers/specs/2026-11-15-study-log-review-design.md §5).
import type { StudyNote } from '../study-note/model';
import type { TimelineTask } from '../timeline/TimelinePanel';

/** GET /api/study-notes?from= 한 줄. title은 서버가 주면 쓴다(선택) */
export type StudyNoteListItem = {
  note: StudyNote;
  taskType: string;
  task: string | null;
  collectionId: number | null;
  title?: string | null;
};

export const REVIEW_TYPES = ['SOLUTION_UPLOAD', 'QUIZ_ANSWER', 'QUIZ_SENT'] as const;

/**
 * GET /api/study-notes/{taskId}/activities 한 줄 — 서버가 user_action_log(풀이 저장·퀴즈 답)와 quiz_log(선생님이 보낸 퀴즈)를 합쳐 시각순으로 준다.
 * 옛 응답엔 type이 없다 → 풀이 업로드. 선생님 퀴즈(QUIZ_SENT)는 사진 없이 content(퀴즈 내용)를 준다.
 */
export type ReviewActivity = {
  id: number;
  type: (typeof REVIEW_TYPES)[number];
  imageUrl?: string | null;
  content?: string | null;
  /** 오프셋 없는 KST 문자열 yyyy-MM-ddTHH:mm:ss */
  createdAt: string;
  quizId?: number;
  quizType?: string | null;
  imageSourceType?: string | null;
  imageSourceId?: number | null;
};

export interface StudyLogFetchers {
  /** from: YYYY-MM-DD(KST). 로그인이 필요하면 throw */
  listNotes(from: string): Promise<StudyNoteListItem[]>;
  listActivities(taskId: number): Promise<ReviewActivity[]>;
}

const KST_MS = 9 * 60 * 60 * 1000;
const pad = (n: number) => String(n).padStart(2, '0');

/** 이번 주 월요일(KST) YYYY-MM-DD. 기기 시간대와 상관없다 */
export function weekStartKst(now: Date): string {
  const kst = new Date(now.getTime() + KST_MS);
  const back = (kst.getUTCDay() + 6) % 7; // 월=0 … 일=6
  const monday = new Date(kst.getTime() - back * 24 * 60 * 60 * 1000);
  return `${monday.getUTCFullYear()}-${pad(monday.getUTCMonth() + 1)}-${pad(monday.getUTCDate())}`;
}

/** '2026-11-14T14:02:00'(KST) → '11월 14일 14:02'. 문자열 그대로 읽어 기기 시간대가 끼지 않는다 */
export function kstLabel(createdAt: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/.exec(createdAt);
  if (!m) return '';
  return `${Number(m[2])}월 ${Number(m[3])}일 ${m[4]}:${m[5]}`;
}

/** 타임라인 카드 함수(describeTask·describeNote)에 넘길 모양 */
export function toTimelineTask(item: StudyNoteListItem): TimelineTask {
  return {
    id: item.note.taskId,
    taskType: item.taskType,
    task: item.task,
    collectionId: item.collectionId,
    title: item.title ?? null,
    topicTitle: item.title ?? null,
    note: item.note,
  };
}
