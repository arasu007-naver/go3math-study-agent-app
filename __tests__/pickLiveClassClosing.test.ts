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
