import fs from 'fs';
import path from 'path';

const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

describe.each(['topic-live-canvas.tsx', 'hotline-class-canvas.tsx'])('%s 진입 재생', (file) => {
  const src = read('src/kit/canvas/note-canvas/' + file);
  it('fastforward/isResetCut import와 진입 판정', () => {
    expect(src).toContain('fastforward,');
    expect(src).toContain('isResetCut,');
    expect(src).toContain('const hasPlayedSinceLoadRef = useRef(false)');
    expect(src).toContain('await fastforward(studySequences, targetPt, callbacks)');
    expect(src).toContain('await playToPoint(studySequences, targetPt, fromPt, callbacks)');
  });
  it('follow는 sequential로 기존 경로', () => {
    expect(src).toContain('playToPointInternal(lastGuide, startPoint, { sequential: true })');
  });
  it('runCurtains와 리셋 컷 120ms 대기', () => {
    expect(src).toContain('runCurtains: async (startIdx)');
    expect(src).toContain("actionType: 'ADD', obj: backStuffs[id]");
    expect(src).toMatch(/if \(isResetCut\(cut\)\) \{[^}]*await sleep\(120\)/);
  });
  it('로드 시 플래그 초기화', () => {
    expect(src.match(/hasPlayedSinceLoadRef\.current = false;\n\s*setStudySequences\(cuts\.contents\)/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

it('템플릿이 CLEAR 계열을 clearCanvas로 처리', () => {
  expect(read('src/kit/canvas/templates/live-class-canvas-template.ts')).toContain("case 'CLEAR':case 'CLEAN_SCENE':");
  expect(read('src/kit/canvas/templates/topic-canvas-template.ts')).toContain("case 'CLEAR_CANVAS':case 'CLEAN':case 'CLEAR':");
});

it('script-parser v1.5.0', () => {
  expect(read('package.json')).toContain('qoolla-package#v1.5.0');
});
