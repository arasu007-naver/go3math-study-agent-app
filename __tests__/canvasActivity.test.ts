import { canvasActivityStore } from '../src/state/canvasActivity';
import { emptyActivities } from '../src/kit/study-note/activity';

beforeEach(() => canvasActivityStore.dispatch({ type: 'reset' }));

it('개념은 id당 하나만, title은 rawTitle로 남긴다', () => {
  canvasActivityStore.dispatch({ type: 'concepts', concepts: [{ id: 1, rawTitle: '일반항' }] });
  canvasActivityStore.dispatch({ type: 'concepts', concepts: [{ id: 1, rawTitle: '일반항' }, { id: 2, rawTitle: '점화식' }] });
  expect(canvasActivityStore.getState().concepts).toEqual([
    { id: 1, title: '일반항' },
    { id: 2, title: '점화식' },
  ]);
});

it('퀴즈 id는 한 번만, 받은 순서로 남긴다', () => {
  for (const quizId of [45, 45, 46]) canvasActivityStore.dispatch({ type: 'quiz', quizId });
  expect(canvasActivityStore.getState().quizIds).toEqual([45, 46]);
});

it('유한한 수가 아닌 퀴즈 id는 무시한다', () => {
  canvasActivityStore.dispatch({ type: 'quiz', quizId: 45 });
  const before = canvasActivityStore.getState();
  canvasActivityStore.dispatch({ type: 'quiz', quizId: NaN });
  canvasActivityStore.dispatch({ type: 'quiz', quizId: Infinity });
  expect(canvasActivityStore.getState()).toBe(before);
});

it('reset은 빈 기록으로 돌린다', () => {
  canvasActivityStore.dispatch({ type: 'quiz', quizId: 45 });
  canvasActivityStore.dispatch({ type: 'reset' });
  expect(canvasActivityStore.getState()).toEqual(emptyActivities());
});
