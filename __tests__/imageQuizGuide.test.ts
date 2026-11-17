import fs from 'fs';
import path from 'path';

// 화면과 캔버스 패널은 렌더 테스트가 없어(다른 패널 테스트처럼) 소스로 imageQuiz 처리 순서를 고정한다.
const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IMAGE_QUIZ_CALL = /receiveQuiz\(\{ quizId: guide\.quizId as number, content: guide\.quiz as string, imageUrl: guide\.imageUrl as string \}\);\s*return;/;

describe.each(['app/topic-live-class.tsx', 'app/hotline-class.tsx'])('%s onData', (file) => {
  it('imageQuiz는 모달을 열고 setLastPoint/onReceiveGuide 전에 return한다', () => {
    const src = read(file);
    const branch = src.indexOf("guide.action === 'imageQuiz'");
    expect(branch).toBeGreaterThan(-1);
    expect(src.slice(branch)).toMatch(new RegExp('^[^]*?' + IMAGE_QUIZ_CALL.source));
    const after = src.slice(branch);
    const lp = after.indexOf('setLastPoint');
    if (lp > -1) expect(after.search(IMAGE_QUIZ_CALL)).toBeLessThan(lp);
    expect(after.search(IMAGE_QUIZ_CALL)).toBeLessThan(after.indexOf('onReceiveGuide'));
  });
});

describe.each(['topic-live-canvas.tsx', 'hotline-class-canvas.tsx'])('%s onReceiveGuide', (file) => {
  const src = read('src/kit/canvas/note-canvas/' + file);
  const start = src.indexOf('async onReceiveGuide(guide: any) {');
  const body = src.slice(start);
  const branch = body.indexOf("guide.action === 'imageQuiz'");

  it('imageQuiz는 스크립트 전환·syncPoint 저장·handleLiveClassMessage보다 먼저 onQuizReceived로 끝난다', () => {
    expect(branch).toBeGreaterThan(-1);
    const block = body.slice(branch, body.indexOf('return;', branch) + 7);
    expect(block).toContain('onQuizReceived?.({ quizId: guide.quizId, content: guide.quiz, imageUrl: guide.imageUrl })');
    for (const later of ["storage.set('syncPoint'", 'setCurrentScriptId', 'setTargetGuide', 'handleLiveClassMessage', 'playToPoint', 'guide.scriptId']) {
      expect(body.indexOf(later)).toBeGreaterThan(branch);
    }
  });
  it('imageQuiz 분기는 한 번만 있다', () => {
    expect(src.split("guide.action === 'imageQuiz'").length).toBe(2);
  });
});
