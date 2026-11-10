import fs from 'node:fs';
import path from 'node:path';

// 공용 UI 컴포넌트에는 hex 색과 숫자 fontSize를 쓰지 않는다(값은 theme.ts에서만).
const FILES = ['src/ui/Button.tsx', 'src/ui/Chip.tsx', 'src/ui/StateView.tsx', 'src/ui/Dialog.tsx'];

function findDrift(source: string): string[] {
  return [...(source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []), ...(source.match(/fontSize:\s*\d/g) ?? [])];
}

test('drift finder catches literals', () => {
  expect(findDrift("a: '#FF8800', fontSize: 12, b: colors.accent")).toHaveLength(2);
});

test('ui primitives have no drift', () => {
  for (const f of FILES) expect([f, findDrift(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'))]).toEqual([f, []]);
});
