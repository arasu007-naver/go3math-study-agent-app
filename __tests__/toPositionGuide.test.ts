import { toPositionGuide } from '../src/kit/live-class/toPositionGuide';

describe('toPositionGuide', () => {
  it('imageQuiz → 위치 guide(refresh)', () => {
    const out = toPositionGuide({ action: 'imageQuiz', scriptId: 12, studyIdx: 3, rawCutIdx: 17, step: 'epilogue', sourceType: 'A', sourceId: 5, quiz: 'Q', quizId: 9, imageUrl: 'u', conceptId: 1 });
    expect(out).toEqual({ action: 'refresh', scriptId: 12, studyIdx: 3, rawCutIdx: 17, step: 'epilogue', sourceType: 'A', sourceId: 5 });
    expect(Object.keys(out)).not.toContain('quiz');
  });
  it('quiz도 같은 규칙', () => {
    expect(toPositionGuide({ action: 'quiz', scriptId: 1, studyIdx: 2, quiz: 'Q', quizId: 9 })).toEqual({ action: 'refresh', scriptId: 1, studyIdx: 2 });
  });
  it('step은 그대로', () => {
    const g = { action: 'step', scriptId: 1, studyIdx: 2, step: 'main' };
    expect(toPositionGuide(g)).toBe(g);
  });
});
