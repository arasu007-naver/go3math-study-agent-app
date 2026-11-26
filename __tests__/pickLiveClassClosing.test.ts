import { pickLiveClassClosing } from '../src/kit/live-class/closing';

it('종료 메시지가 아니거나 정리 필드가 없으면 null', () => {
  expect(pickLiveClassClosing({ action: 'quiz' } as any)).toBeNull();
  expect(pickLiveClassClosing({ action: 'LIVE_CLASS_CLOSED', tutorId: 't1' } as any)).toBeNull();
});

it('모양이 맞는 항목만 남기고 중복을 없앤다', () => {
  expect(
    pickLiveClassClosing({
      action: 'LIVE_CLASS_CLOSED',
      description: 'd',
      concepts: [{ id: 7, title: 'A' }, { id: 7, title: 'B' }, { id: 0, title: 'C' }],
      quizzes: [{ quizId: 9, content: 'q' }, { quizId: 'x', content: 'y' }],
    } as any),
  ).toEqual({ description: 'd', concepts: [{ id: 7, title: 'A' }], quizzes: [{ quizId: 9, content: 'q' }] });
});

describe('경계 케이스', () => {
  const A = 'LIVE_CLASS_CLOSED';
  it('빈 title 개념과 중복 quizId를 걸러낸다', () => {
    expect(
      pickLiveClassClosing({ action: A, concepts: [{ id: 1, title: '' }, { id: 2, title: 'B' }], quizzes: [{ quizId: 9, content: 'a' }, { quizId: 9, content: 'b' }] } as any),
    ).toEqual({ description: '', concepts: [{ id: 2, title: 'B' }], quizzes: [{ quizId: 9, content: 'a' }] });
  });
  it('배열이 아니면 []로 보고 모두 비면 null', () => {
    expect(pickLiveClassClosing({ action: A, description: 'd', concepts: 'x', quizzes: {} } as any)).toEqual({ description: 'd', concepts: [], quizzes: [] });
    expect(pickLiveClassClosing({ action: A, description: 3, concepts: 'x', quizzes: {} } as any)).toBeNull();
  });
});
