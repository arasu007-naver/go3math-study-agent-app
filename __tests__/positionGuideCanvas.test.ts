import fs from 'fs';
import path from 'path';
import { toPositionGuide } from '../src/kit/live-class/toPositionGuide';

// 캔버스 패널은 렌더 테스트가 없어(imageQuizGuide.test.ts처럼) 소스로 분기를 고정한다.
const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const pos = toPositionGuide({ action: 'imageQuiz', scriptId: 12, studyIdx: 3, step: 'main', quiz: 'Q', quizId: 9, imageUrl: 'u', conceptId: 1 });

it('변환 guide는 퀴즈 키 없이 refresh 위치 guide', () => {
  expect(pos).toEqual({ action: 'refresh', scriptId: 12, studyIdx: 3, step: 'main' });
});

describe.each(['topic-live-canvas.tsx', 'hotline-class-canvas.tsx'])('%s onReceiveGuide + 위치 guide', (file) => {
  const src = read('src/kit/canvas/note-canvas/' + file);
  const body = src.slice(src.indexOf('async onReceiveGuide(guide: any) {'));
  const handle = body.indexOf('await handleLiveClassMessage(guide, ctx');

  it('퀴즈 분기는 action이 quiz/imageQuiz일 때만 — refresh는 해당 없음', () => {
    const actions = [...body.slice(0, handle).matchAll(/guide\.action === '(\w+)'/g)].map((m) => m[1]);
    expect(actions).toContain('quiz');
    expect(actions.includes('refresh')).toBe(false);
    for (const q of body.slice(0, handle).matchAll(/onQuizReceived/g)) expect(q.index).toBeDefined();
  });
  it('같은 스크립트의 위치 guide는 handleLiveClassMessage까지 간다', () => {
    expect(handle).toBeGreaterThan(-1);
    expect(body).toContain('currentScriptId != Number(guide.scriptId)');
    expect(body).toContain("storage.set('syncPoint', JSON.stringify(guide))");
  });
});
