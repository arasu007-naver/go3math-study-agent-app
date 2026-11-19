import fs from 'fs';
import path from 'path';

// 캔버스 패널은 렌더 테스트가 없어(imageQuizGuide.test.ts처럼) 소스로 CLASS_ON_AIR 분기를 고정한다.
const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

it('상수', () => {
  expect(read('src/kit/live-class/constants.ts')).toContain("export const CLASS_ON_AIR = 'CLASS_ON_AIR'");
});

describe.each(['topic-live-canvas.tsx', 'hotline-class-canvas.tsx'])('%s CLASS_ON_AIR', (file) => {
  const src = read('src/kit/canvas/note-canvas/' + file);
  const body = src.slice(src.indexOf('async onReceiveGuide(guide: any) {'));
  const start = body.indexOf('guide.action === CLASS_ON_AIR');
  const block = body.slice(start, body.indexOf('const ctx: LiveClassMessageContext'));

  it('기존 scriptId 전환 분기·handleLiveClassMessage보다 먼저 처리한다', () => {
    expect(start).toBeGreaterThan(-1);
    expect(body.indexOf('if (guide.scriptId == null)')).toBeGreaterThan(start);
  });
  it('다른 스크립트면 syncPoint 저장 후 전환', () => {
    expect(block).toContain('currentScriptId != onAirScriptId');
    expect(block).toContain('currentScript?.sourceType != guide.sourceType');
    expect(block).toContain("storage.set('syncPoint', JSON.stringify(guide))");
    expect(block).toContain('setCurrentScriptId(onAirScriptId)');
  });
  it('같은 스크립트면 cuts[0]부터 backgroundCut 포함 재생, handleLiveClassMessage 없음', () => {
    expect(block).toContain('setCurrentIdx(0)');
    expect(block).toContain("setLastGuide({ ...guide, studyIdx: 0, step: 'main' })");
    expect(block).toContain("playToPointInternal({ studyIdx: 0, step: 'main' }, null, { force: true })");
    expect(block).not.toContain('handleLiveClassMessage');
  });
});
