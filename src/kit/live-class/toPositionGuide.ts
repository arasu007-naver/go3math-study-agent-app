type Guide = { action?: string; scriptId?: number | string } & Record<string, unknown>;

// 수업 위치가 아닌 일회성 명령. 캔버스가 로드를 마칠 때마다 다시 넘기는 '마지막 지점'으로 남기지 않는다.
// renewScript/reload는 패널이 스크립트를 비우고 다시 받게 하므로, 남기면 다시 받기 → 로드 → 재전달이 끝없이 돈다
const ONE_SHOT_ACTIONS = new Set(['snapshot', 'canvas-synch', 'renewScript', 'reload']);

export function isPositionGuide(guide: Guide): boolean {
  return !ONE_SHOT_ACTIONS.has(String(guide.action));
}

// 마지막 메시지가 quiz/imageQuiz이면 퀴즈 필드를 빼고 refresh 위치 guide로 바꾼다. 다른 guide는 그대로 돌려준다
export function toPositionGuide<T extends Guide>(guide: T): T | Guide {
  if (guide.action !== 'quiz' && guide.action !== 'imageQuiz') return guide;
  const { quiz: _quiz, quizId: _quizId, imageUrl: _imageUrl, conceptId: _conceptId, ...rest } = guide;
  return { ...rest, action: 'refresh' };
}
