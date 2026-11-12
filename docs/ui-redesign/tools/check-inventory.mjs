// 단계 3 인벤토리 검증: app/·src/의 눌리는 요소가 모두 03-components-inventory.md §1에 행으로 있는지 확인한다.
import fs from 'node:fs'; import path from 'node:path'; import { pathToFileURL } from 'node:url';

const PRESSABLE = /<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button)\b/;
const TARGET = /^(Button (primary|secondary|danger|text) (md|sm)|Chip|StateView|Dialog|글자|예외)$/;

export function findPressables(root) {
  const hits = [];
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.tsx?$/.test(e.name)) {
        const rel = path.relative(root, p).split(path.sep).join('/');
        fs.readFileSync(p, 'utf8').split(/\r?\n/).forEach((l, i) => { if (PRESSABLE.test(l)) hits.push(`${rel}:${i + 1}`); });
      }
    }
  };
  for (const top of ['app', 'src']) if (fs.existsSync(path.join(root, top))) walk(path.join(root, top));
  return hits.sort();
}

export function checkInventory({ md, hits }) {
  const errs = [];
  // Windows 체크아웃(core.autocrlf)에서는 줄 끝이 \r\n이다
  const section = (md.replace(/\r\n/g, '\n').split('## 1. 눌리는 요소')[1] ?? '').split(/\n#{2,6} /)[0]; // 하위 절(### 1.1)에서도 끝난다
  const lines = section.split('\n').filter((l) => l.startsWith('|') && !l.includes('파일:라인') && !/^\|[\s|:-]+\|$/.test(l));
  const ids = new Set(); const hitSet = new Set(hits);
  for (const l of lines) {
    const cells = l.split('|').slice(1, -1).map((s) => s.trim()); const id = cells[0].replace(/`/g, '');
    if (ids.has(id)) errs.push(`duplicate row ${id}`); ids.add(id);
    if (cells.length !== 7) { errs.push(`md columns ${id}`); continue; }
    if (!hitSet.has(id)) errs.push(`stale row ${id}`);
    const [, , , , target, reason, stage] = cells;
    if (!TARGET.test(target)) errs.push(`bad target ${id}`);
    if (target === '예외') {
      if (!reason || reason === '—') errs.push(`exception without reason ${id}`);
      if (stage !== '—') errs.push(`bad stage ${id}`);
    } else if (stage !== '4' && stage !== '5') errs.push(`bad stage ${id}`);
  }
  for (const h of hits) if (!ids.has(h)) errs.push(`missing row ${h}`);
  return errs;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [mdP, root] = process.argv.slice(2);
  if (!mdP || !root) { console.error('usage: check-inventory.mjs <inventory.md> <repoRoot>'); process.exit(2); }
  if (!fs.existsSync(mdP)) { console.error('FAIL missing ' + mdP); process.exit(1); }
  const md = fs.readFileSync(mdP, 'utf8');
  const errs = checkInventory({ md, hits: findPressables(root) });
  if (errs.length) { console.error('FAIL\n' + errs.join('\n')); process.exit(1); }
  console.log(`OK rows=${findPressables(root).length}`);
}
