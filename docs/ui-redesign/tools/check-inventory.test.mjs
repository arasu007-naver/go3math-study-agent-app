import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkInventory, findPressables } from './check-inventory.mjs';

const HEAD = '| 파일:라인 | 역할 | 현재 표현 | 동작·상태 | 대상 | 예외 사유 | 교체 단계 |\n|---|---|---|---|---|---|---|';
const row = (id, target = 'Button primary md', reason = '—', stage = '4') => `| \`${id}\` | 저장 | accent | pressed | ${target} | ${reason} | ${stage} |`;
const mdOf = (rows) => `# 인벤토리\n\n## 1. 눌리는 요소\n\n${HEAD}\n${rows.join('\n')}\n\n## 2. 배지\n\n| a | b |\n|---|---|\n| x | y |\n`;
const HITS = ['app/a.tsx:2', 'src/x/b.tsx:10', 'src/y/c.tsx:3'];
const valid = () => [row('app/a.tsx:2'), row('src/x/b.tsx:10', 'Chip', '—', '5'), row('src/y/c.tsx:3', '예외', '이미 공용', '—')];
const hasError = (errs, prefix) => assert.ok(errs.some((e) => e.startsWith(prefix)), `expected "${prefix}" in ${JSON.stringify(errs)}`);

test('valid fixture passes', () => {
  assert.deepEqual(checkInventory({ md: mdOf(valid()), hits: HITS }), []);
});

test('missing row', () => {
  hasError(checkInventory({ md: mdOf(valid().slice(0, 2)), hits: HITS }), 'missing row src/y/c.tsx:3');
});

test('stale row', () => {
  hasError(checkInventory({ md: mdOf([...valid(), row('src/z.tsx:1')]), hits: HITS }), 'stale row src/z.tsx:1');
});

test('duplicate row', () => {
  hasError(checkInventory({ md: mdOf([...valid(), row('app/a.tsx:2')]), hits: HITS }), 'duplicate row app/a.tsx:2');
});

test('bad target', () => {
  const rows = valid(); rows[0] = row('app/a.tsx:2', 'Button primary lg');
  hasError(checkInventory({ md: mdOf(rows), hits: HITS }), 'bad target app/a.tsx:2');
});

test('exception without reason', () => {
  const rows = valid(); rows[2] = row('src/y/c.tsx:3', '예외', '—', '—');
  hasError(checkInventory({ md: mdOf(rows), hits: HITS }), 'exception without reason src/y/c.tsx:3');
});

test('bad stage', () => {
  const a = valid(); a[0] = row('app/a.tsx:2', 'Button primary md', '—', '3');
  hasError(checkInventory({ md: mdOf(a), hits: HITS }), 'bad stage app/a.tsx:2');
  const b = valid(); b[2] = row('src/y/c.tsx:3', '예외', '이미 공용', '4');
  hasError(checkInventory({ md: mdOf(b), hits: HITS }), 'bad stage src/y/c.tsx:3');
});

test('md columns', () => {
  const rows = valid(); rows[0] = '| `app/a.tsx:2` | 저장 | a | b | Button primary md | — |';
  hasError(checkInventory({ md: mdOf(rows), hits: HITS }), 'md columns app/a.tsx:2');
});

test('crlf line endings', () => {
  assert.deepEqual(checkInventory({ md: mdOf(valid()).replace(/\n/g, '\r\n'), hits: HITS }), []);
});

test('findPressables walks app and src only, posix paths', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'inv-'));
  fs.mkdirSync(path.join(root, 'app'));
  fs.mkdirSync(path.join(root, 'src', 'x'), { recursive: true });
  fs.mkdirSync(path.join(root, 'docs'));
  fs.writeFileSync(path.join(root, 'app', 'a.tsx'), 'x\n<Pressable onPress={f}>\n<View>\n');
  fs.writeFileSync(path.join(root, 'src', 'x', 'b.ts'), '<TouchableOpacity />\n');
  fs.writeFileSync(path.join(root, 'docs', 'c.tsx'), '<Pressable />\n');
  fs.writeFileSync(path.join(root, 'src', 'x', 'd.md'), '<Pressable />\n');
  assert.deepEqual(findPressables(root), ['app/a.tsx:2', 'src/x/b.ts:1']);
});

test('a subsection heading ends the table', () => {
  const md = mdOf(valid()).replace('\n\n## 2. 배지', '\n\n### 1.1 다른 표\n\n| a | b | c |\n|---|---|---|\n| `x.tsx:1` | y | z |\n\n## 2. 배지');
  assert.deepEqual(checkInventory({ md, hits: HITS }), []);
});
