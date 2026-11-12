// 단계 2 역할 표 검증: 02-roles.json · 02-ia-overlay-roles.md · ui-structure.json · 01-diagnosis.md를 서로 대조한다.
import fs from 'node:fs'; import { pathToFileURL } from 'node:url';

const ROLES = ['screen', 'dock', 'modeless', 'bottomsheet', 'modal', 'outside'];
const EXPECTED = { screen: null, dock: false, modeless: false, bottomsheet: false, modal: true, outside: null };
const STAGES = [2, 3, 4, '사용자 결정'];
const MODE_LABEL = { phone: 'Phone', tablet: 'Tablet' };

export function checkRoles({ roles, md, structure, diagnosis }) {
  const errs = []; const nodes = new Map(structure.nodes.map((n) => [n.id, n]));
  const rows = roles.rows ?? []; const seen = new Set();
  const devIds = new Set((roles.deviations ?? []).map((d) => d.id));

  for (const id of nodes.keys()) if (!rows.some((r) => r.id === id)) errs.push(`missing row ${id}`);
  for (const r of rows) {
    if (seen.has(r.id)) errs.push(`duplicate row ${r.id}`); seen.add(r.id);
    const n = nodes.get(r.id);
    if (!n) { errs.push(`unknown node ${r.id}`); continue; }
    if (!ROLES.includes(r.role)) errs.push(`bad role ${r.id}`);
    else if (r.expectedBlocking !== EXPECTED[r.role]) errs.push(`expected blocking ${r.id}`);
    if (r.role === 'outside' && !r.reason) errs.push(`outside without reason ${r.id}`);
    if (r.recordedBlocking !== n.blocking) errs.push(`recorded blocking ${r.id}`);
    if (r.expectedBlocking !== r.recordedBlocking && !(r.deviations ?? []).length) errs.push(`mismatch needs deviation ${r.id}`);
    for (const m of n.modes ?? []) if (!String(r.forms ?? '').includes(MODE_LABEL[m])) errs.push(`forms must name every mode ${r.id}`);
    for (const d of r.deviations ?? []) if (!devIds.has(d)) errs.push(`undeclared deviation ${r.id} ${d}`);
  }
  for (const d of roles.deviations ?? []) {
    const known = /^D-\d\d$/.test(d.id) ? diagnosis.includes(d.id) : /^NEW-\d\d$/.test(d.id);
    if (!known) errs.push(`unknown deviation ${d.id}`);
    if (!STAGES.includes(d.stage)) errs.push(`bad stage ${d.id}`);
  }

  // Windows 체크아웃(core.autocrlf)에서는 줄 끝이 \r\n이다
  const section = (md.replace(/\r\n/g, '\n').split('## 3. 역할 표')[1] ?? '').split('\n## ')[0];
  const mdRows = section.split('\n').filter((l) => l.startsWith('|') && !l.includes('node id') && !/^\|[\s|:-]+\|$/.test(l));
  const cell = (v) => (v === null ? '—' : String(v)); const mdIds = new Set();
  for (const l of mdRows) {
    const cells = l.split('|').slice(1, -1).map((s) => s.trim()); const id = cells[0].replace(/`/g, '');
    if (mdIds.has(id)) errs.push(`md duplicate id ${id}`); mdIds.add(id);
    if (cells.length !== 7) { errs.push(`md columns ${id}`); continue; }
    const r = rows.find((x) => x.id === id);
    if (!r) { errs.push(`md unknown id ${id}`); continue; }
    if (cells[1] !== r.role) errs.push(`md role ${id}`);
    const devs = (r.deviations ?? []).join(', ') || '—';
    if (cells[2] !== cell(r.expectedBlocking) || cells[3] !== cell(r.recordedBlocking) || cells[6] !== devs) errs.push(`md cell ${id}`);
  }
  for (const r of rows) if (!mdIds.has(r.id)) errs.push(`md missing id ${r.id}`);
  if (mdRows.length !== rows.length) errs.push(`md rows ${mdRows.length} != json ${rows.length}`);
  return errs;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const paths = process.argv.slice(2);
  for (const p of paths) if (!fs.existsSync(p)) { console.error('FAIL missing ' + p); process.exit(1); }
  const [rolesP, mdP, structP, diagP] = paths; const read = (p) => fs.readFileSync(p, 'utf8');
  const roles = JSON.parse(read(rolesP));
  const errs = checkRoles({ roles, md: read(mdP), structure: JSON.parse(read(structP)), diagnosis: read(diagP) });
  if (errs.length) { console.error('FAIL\n' + errs.join('\n')); process.exit(1); }
  console.log(`OK rows=${roles.rows.length} deviations=${roles.deviations.length}`);
}
