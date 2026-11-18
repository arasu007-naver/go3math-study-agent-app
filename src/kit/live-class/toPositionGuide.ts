type Guide = { action?: string; scriptId?: number | string } & Record<string, unknown>;

// 마지막 메시지가 quiz/imageQuiz이면 퀴즈 필드를 빼고 refresh 위치 guide로 바꾼다. 다른 guide는 그대로 돌려준다
export function toPositionGuide<T extends Guide>(guide: T): T | Guide {
  if (guide.action !== 'quiz' && guide.action !== 'imageQuiz') return guide;
  const { quiz: _quiz, quizId: _quizId, imageUrl: _imageUrl, conceptId: _conceptId, ...rest } = guide;
  return { ...rest, action: 'refresh' };
}
