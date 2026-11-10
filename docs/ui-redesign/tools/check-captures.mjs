import fs from 'node:fs'; import path from 'node:path';
const [mf, dir] = process.argv.slice(2); const errs = [];
if (!fs.existsSync(mf)) { console.error('FAIL missing ' + mf); process.exit(1); }
const rows = fs.readFileSync(mf, 'utf8').split('## 목록')[1].split('\n').filter((l) => /^\| [a-z_]/.test(l) && !/^\| node id/.test(l)).map((l) => l.split('|').slice(1, -1).map((s) => s.trim()));
// node id / 화면·상태 / 기기 / 방향 / 파일 / 출처 / 상태 / 사유
const NAME = /^(ipad|ipad-sim|phone-sim)-[a-z0-9_]+(-[a-z0-9_]+)?-before\.png$/; const listed = new Set(); let done = 0, blocked = 0;
for (const r of rows) {
  const [id, , , , fileCell, src, st, why] = r; const file = fileCell.replace(/`/g, '');
  if (!NAME.test(file)) errs.push('bad name ' + file);
  if (listed.has(file)) errs.push('dup ' + file); listed.add(file);
  if (st === '완료') { done++;
    if (!fs.existsSync(path.join(dir, file))) errs.push('missing file ' + file);
    const want = /^ipad-(?!sim-)/.test(file) ? "실기기" : "시뮬레이터";
    if (src !== want) errs.push(`source mismatch ${file}: ${src} != ${want}`);
  } else if (st === 'blocked') { blocked++; if (!why || why === '—') errs.push('blocked without reason ' + id); }
  else errs.push('bad status ' + id + ' ' + st);
}
for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.png'))) if (!listed.has(f)) errs.push('unlisted png ' + f);
if (!rows.length) errs.push('no rows');
if (errs.length) { console.error('FAIL\n' + errs.join('\n')); process.exit(1); }
console.log(`OK done=${done} blocked=${blocked}`);
