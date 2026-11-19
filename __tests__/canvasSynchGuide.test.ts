import fs from 'fs';
import path from 'path';

// 캔버스 패널은 렌더 테스트가 없어(imageQuizGuide.test.ts 처럼) 소스로 canvas-synch 처리를 고정한다.
const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

describe.each(['topic-live-canvas.tsx', 'hotline-class-canvas.tsx'])('%s canvas-synch', (file) => {
  const src = read('src/kit/canvas/note-canvas/' + file);
  const start = src.indexOf("guide.action === 'canvas-synch'");
  const block = src.slice(start, src.indexOf('\n            }\n', start));

  // 선생님이 CLEAN 컷으로 넘어가면 canvas-synch(studyIdx=CLEAN 컷)가 온다. SYNCH는 빠진 객체를 더하기만 해서
  // 그 지점까지 재생하지 않으면 CLEAN이 적용되지 않는다.
  it('studyIdx가 있으면 그 지점까지 재생한다', () => {
    expect(start).toBeGreaterThan(-1);
    expect(block).toMatch(/if \(guide\.studyIdx != null\) \{\s*await playToPointInternal\(guide, lastGuide\);\s*return;\s*\}/);
  });

  it('studyIdx가 없으면 지금처럼 객체만 동기화한다', () => {
    expect(block).toContain("sendBoardAction({ actionType: 'SYNCH', objects: guide.objects });");
  });
});
