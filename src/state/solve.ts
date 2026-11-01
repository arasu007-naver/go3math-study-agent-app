// 풀이 화면(/notebook)에 넘길 문제 묶음. 문제 목록의 연필 버튼이 채우고 풀이 화면이 읽는다(경로 파라미터로 넘기기엔 길다).
import { createStore } from './createStore';

export type SolveProblem = { sourceType: string; sourceId: number; image: string };
/** taskId: 타임라인 학습 기록에서 왔을 때 풀이 기록(CREATE_RECORD)에 붙인다. topicId: 주제에서 왔을 때 멘토링 요청에 붙인다 */
export type SolveSession = { title?: string; problems: SolveProblem[]; index: number; taskId?: number; topicId?: number } | null;

export const solveStore = createStore((_: SolveSession, next: SolveSession) => next, null as SolveSession);
