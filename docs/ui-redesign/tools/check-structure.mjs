import fs from 'node:fs'; import path from 'node:path';
const [jsonP, mdP, root] = process.argv.slice(2); const errs = [];
if (!fs.existsSync(jsonP)) { console.error('FAIL missing ' + jsonP); process.exit(1); }
if (!fs.existsSync(mdP)) { console.error('FAIL missing ' + mdP); process.exit(1); }
const j = JSON.parse(fs.readFileSync(jsonP, 'utf8')); const md = fs.readFileSync(mdP, 'utf8');
const KINDS = new Set(['navigator','screen','modal','modeless','bottomsheet','external']);
const RELS = new Set(['contains','navigate','present','dismiss_to','deeplink']);
const ids = new Set(); const lines = {};
const flen = (f) => (lines[f] ??= fs.readFileSync(path.join(root, f), 'utf8').split('\n').length);
for (const n of j.nodes) {
  if (!/^[a-z_][a-z0-9_]*$/.test(n.id)) errs.push('bad id ' + n.id);
  if (ids.has(n.id)) errs.push('dup id ' + n.id); ids.add(n.id);
  if (!KINDS.has(n.kind)) errs.push('bad kind ' + n.id);
  if (!n.file || !fs.existsSync(path.join(root, n.file))) errs.push('missing file ' + n.id + ' ' + n.file);
}
const incoming = new Set();
for (const e of j.edges) {
  const tag = `${e.from}->${e.to}`;
  if (!RELS.has(e.rel)) errs.push('bad rel ' + tag);
  if (!ids.has(e.from) || !ids.has(e.to)) errs.push('unknown endpoint ' + tag);
  incoming.add(e.to);
  const refs = [...String(e.source || '').matchAll(/((?:[\w@][\w@().\-\/\[\]]*\.(?:tsx?|js|json))?):(\d+)/g)];
  if (!refs.length) errs.push('no source ' + tag);
  let cur = null;
  for (const m of refs) {
    if (m[1]) cur = m[1];
    if (!cur) { errs.push('line without file ' + tag); continue; }
    if (!fs.existsSync(path.join(root, cur))) { errs.push('source file missing ' + tag + ' ' + cur); continue; }
    if (Number(m[2]) > flen(cur)) errs.push('source line beyond EOF ' + tag + ' ' + cur + ':' + m[2]);
  }
}
const unresolved = j.unresolved.join('\n');
for (const n of j.nodes) if (!['navigator','external'].includes(n.kind) && !incoming.has(n.id) && !(n.orphan && unresolved.includes('orphan')))
  errs.push('no entry path ' + n.id);
const rows = (h) => { const s = md.split(new RegExp('^## ' + h + '.*$', 'm'))[1]; if (!s) return -1;
  return s.split(/^## /m)[0].split('\n').filter((l) => /^\|/.test(l)).length - 2; };
if (rows('노드 목록') !== j.nodes.length) errs.push(`md node rows ${rows('노드 목록')} != ${j.nodes.length}`);
if (rows('엣지 목록') !== j.edges.length) errs.push(`md edge rows ${rows('엣지 목록')} != ${j.edges.length}`);
if (errs.length) { console.error('FAIL\n' + errs.join('\n')); process.exit(1); }
console.log(`OK nodes=${j.nodes.length} edges=${j.edges.length}`);
