import fs from 'fs';
import path from 'path';

// 선생님 수업 캔버스에 막 들어오면 현재 스크립트가 아직 없다. refreshMenuscript가 그때 targetScript.id를 읽어
// "Cannot read property 'id' of undefined" 오류 배너가 떴다. 패널은 렌더 테스트가 없어 소스로 고정한다(주제 실황 패널은 이미 같은 검사가 있다).
const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', 'src/kit/canvas/note-canvas', f), 'utf8');

test('hotline refreshMenuscript does not read targetScript.id before there is a current script', () => {
  const src = read('hotline-class-canvas.tsx');
  const guard = src.indexOf('if (!targetScript) return;');
  const use = src.indexOf('src.id == targetScript.id');
  expect(guard).toBeGreaterThan(-1);
  expect(use).toBeGreaterThan(guard);
});

test('topic live refreshMenuscript checks targetScript before using it', () => {
  expect(read('topic-live-canvas.tsx')).toMatch(/if \(targetScript\) \{\s*let dScript = _\.filter\(scriptsArray, \(src: any\) => \(src\.id == targetScript\.id\)/);
});
