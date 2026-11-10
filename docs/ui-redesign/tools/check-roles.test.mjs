import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkRoles } from './check-roles.mjs';

const HEAD = '| node id | 역할 | 기대 차단 | 기록 blocking | 열림·닫힘 | Phone / Tablet | 어긋남 |\n|---|---|---|---|---|---|---|';
const cell = (v) => (v === null ? '—' : String(v));
const mdRow = (r) => `| \`${r.id}\` | ${r.role} | ${cell(r.expectedBlocking)} | ${cell(r.recordedBlocking)} | ${r.openClose} | ${r.forms} | ${r.deviations.join(', ') || '—'} |`;
const mdOf = (rows) => `# 단계 2\n\n## 3. 역할 표\n\n${HEAD}\n${rows.map(mdRow).join('\n')}\n\n## 4. 어긋남\n\n| D-13 | x |\n`;

function fixture() {
  const structure = { nodes: [
    { id: 'home', kind: 'screen', blocking: null, modes: ['phone', 'tablet'] },
    { id: 'confirm', kind: 'modal', blocking: true, modes: ['tablet'] },
    { id: 'nav_root', kind: 'navigator', blocking: null, modes: ['phone', 'tablet'] },
  ] };
  const roles = {
    roles: ['screen', 'dock', 'modeless', 'bottomsheet', 'modal', 'outside'],
    rows: [
      { id: 'home', role: 'screen', expectedBlocking: null, recordedBlocking: null, openClose: '라우트', forms: 'Phone: 탭 화면 / Tablet: Stage', deviations: [] },
      { id: 'confirm', role: 'modal', expectedBlocking: true, recordedBlocking: true, openClose: '확인·취소', forms: 'Tablet: 대화상자', deviations: ['D-13'] },
      { id: 'nav_root', role: 'outside', expectedBlocking: null, recordedBlocking: null, openClose: '—', forms: 'Phone / Tablet', deviations: [], reason: 'navigator' },
    ],
    deviations: [{ id: 'D-13', nodes: ['confirm'], rule: '대화상자 틀 하나', stage: 3 }],
  };
  return { roles, structure, md: mdOf(roles.rows), diagnosis: '| D-13 | P3 | 모달 표현 |' };
}
const row = (f, id) => f.roles.rows.find((r) => r.id === id);
const hasError = (errs, prefix) => assert.ok(errs.some((e) => e.startsWith(prefix)), `expected "${prefix}" in ${JSON.stringify(errs)}`);
// json을 바꾼 뒤 md도 같은 행으로 다시 만든다(md 규칙이 다른 오류를 섞지 않게)
const sync = (f) => ({ ...f, md: mdOf(f.roles.rows) });

test('valid fixture passes', () => {
  assert.deepEqual(checkRoles(fixture()), []);
});

test('missing row', () => {
  const f = fixture();
  f.roles.rows = f.roles.rows.filter((r) => r.id !== 'home');
  hasError(checkRoles(sync(f)), 'missing row home');
});

test('unknown node', () => {
  const f = fixture();
  f.roles.rows.push({ ...row(f, 'home'), id: 'ghost' });
  hasError(checkRoles(sync(f)), 'unknown node ghost');
});

test('duplicate row', () => {
  const f = fixture();
  f.roles.rows.push({ ...row(f, 'home') });
  hasError(checkRoles(sync(f)), 'duplicate row home');
});

test('bad role', () => {
  const f = fixture();
  row(f, 'home').role = 'page';
  hasError(checkRoles(sync(f)), 'bad role home');
});

test('outside without reason', () => {
  const f = fixture();
  row(f, 'nav_root').reason = '';
  hasError(checkRoles(sync(f)), 'outside without reason nav_root');
});

test('expected blocking', () => {
  const f = fixture();
  row(f, 'confirm').expectedBlocking = false;
  hasError(checkRoles(sync(f)), 'expected blocking confirm');
});

test('recorded blocking', () => {
  const f = fixture();
  row(f, 'confirm').recordedBlocking = false;
  hasError(checkRoles(sync(f)), 'recorded blocking confirm');
});

test('mismatch needs deviation', () => {
  const f = fixture();
  f.structure.nodes.find((n) => n.id === 'confirm').blocking = false;
  row(f, 'confirm').recordedBlocking = false;
  row(f, 'confirm').deviations = [];
  const errs = checkRoles(sync(f));
  hasError(errs, 'mismatch needs deviation confirm');
  assert.ok(!errs.some((e) => e.startsWith('recorded blocking')), 'recorded value matches the diagram here');
});

test('forms must name every mode', () => {
  const f = fixture();
  row(f, 'home').forms = 'Tablet: Stage';
  hasError(checkRoles(sync(f)), 'forms must name every mode home');
});

test('unknown deviation', () => {
  const f = fixture();
  row(f, 'confirm').deviations = ['D-99'];
  f.roles.deviations[0].id = 'D-99';
  hasError(checkRoles(sync(f)), 'unknown deviation D-99');

  const g = fixture();
  row(g, 'confirm').deviations = ['NEW-1'];
  g.roles.deviations[0].id = 'NEW-1';
  hasError(checkRoles(sync(g)), 'unknown deviation NEW-1');

  const h = fixture();
  row(h, 'confirm').deviations = ['NEW-01'];
  h.roles.deviations[0].id = 'NEW-01';
  assert.deepEqual(checkRoles(sync(h)), []);
});

test('undeclared deviation', () => {
  const f = fixture();
  row(f, 'home').deviations = ['D-13'];
  assert.deepEqual(checkRoles(sync(f)), []);
  row(f, 'home').deviations = ['NEW-02'];
  hasError(checkRoles(sync(f)), 'undeclared deviation home NEW-02');
});

test('bad stage', () => {
  const f = fixture();
  f.roles.deviations[0].stage = 5;
  hasError(checkRoles(f), 'bad stage D-13');
  f.roles.deviations[0].stage = '사용자 결정';
  assert.deepEqual(checkRoles(f), []);
});

test('md columns', () => {
  const f = fixture();
  row(f, 'home').openClose = 'a | b';
  hasError(checkRoles(sync(f)), 'md columns home');
});

test('md rows', () => {
  const f = fixture();
  f.md = mdOf(f.roles.rows.filter((r) => r.id !== 'home'));
  hasError(checkRoles(f), 'md rows 2 != json 3');
});

test('md role', () => {
  const f = fixture();
  f.md = f.md.replace('| `home` | screen |', '| `home` | modal |');
  hasError(checkRoles(f), 'md role home');
});
