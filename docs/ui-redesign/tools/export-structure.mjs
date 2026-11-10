import fs from 'node:fs'; import vm from 'node:vm';
const [html, outDir, mmdDir] = process.argv.slice(2);
const src = fs.readFileSync(html, 'utf8');
const body = src.slice(src.indexOf('const META = {'), src.indexOf('// ───────────────────────── 렌더'));
const ctx = {}; vm.createContext(ctx);
vm.runInContext(body + '\n;globalThis.__x = { META, NODES, EDGES, ISSUES, VIEWS, GROUPS, PLANNED, buildMermaid };', ctx);
const { META, NODES, EDGES, ISSUES, VIEWS, PLANNED, buildMermaid } = ctx.__x;
const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\\'/g, "'");
const json = {
  meta: { commit: META.commit, branch: META.branch, router: 'expo-router', generatedAt: META.generatedAt },
  nodes: NODES.map((n) => ({ id: n.id, kind: n.kind, name: n.name, component: n.comp, file: n.file, route: n.route ?? null, parent: n.parent ?? null, blocking: n.blocking ?? null, modes: [...n.modes], orphan: !!n.orphan, note: n.note ?? null })),
  edges: EDGES.map((e) => ({ from: e.from, to: e.to, rel: e.rel, trigger: e.trigger, condition: e.condition ?? null, source: e.source })),
  unresolved: ISSUES.map((i) => `[${i.tag}] ${strip(i.text)}`),
};
fs.writeFileSync(outDir + '/ui-structure.json', JSON.stringify(json, null, 2) + '\n');
const c = (v) => (v === null || v === undefined || v === '' ? '—' : String(v).replace(/\|/g, '\\|').replace(/\n/g, ' '));
const count = (arr, k) => Object.entries(arr.reduce((a, x) => ((a[x[k]] = (a[x[k]] || 0) + 1), a), {})).map(([a, b]) => `${a} ${b}`).join(', ');
let md = `# Go3Math 학생 앱 UI 구조\n\n> 이 파일은 \`ui-structure.html\`의 데이터에서 만든다. 고칠 때는 HTML의 \`NODES\`·\`EDGES\`·\`ISSUES\`를 고치고 다시 내보낸다.\n\n## 개요\n\n| 항목 | 값 |\n|---|---|\n| 프로젝트 | ${META.project} |\n| 기준 | \`${META.branch}\` @ \`${META.commit}\` |\n| 라우팅 | ${META.router} |\n| 분석 날짜 | ${META.generatedAt} |\n| 레이아웃 모드 | ${META.modes} |\n| 노드 | ${NODES.length}개 (${count(NODES, 'kind')}) |\n| 엣지 | ${EDGES.length}개 (${count(EDGES, 'rel')}) |\n\n블록 모양: 사각형 Screen, 이중 사각형 Modal, 둥근 사각형 Modeless, 사다리꼴 Bottom Sheet, 원 External. 실선 navigate, 점선 present, 굵은 선 deeplink. \`contains\`는 subgraph로 그렸고 엣지 표에는 남겼다.\n\n`;
VIEWS.forEach((v, i) => {
  const m = buildMermaid(v, false);
  if (mmdDir) fs.writeFileSync(`${mmdDir}/diagram-${i + 1}-${v.id}.mmd`, m + '\n');
  md += `## Block Diagram — ${v.label}\n\n${v.desc}\n\n\`\`\`mermaid\n${m}\n\`\`\`\n\n`;
});
md += `## 노드 목록\n\n| id | 종류 | 이름 | 컴포넌트 | 파일 경로 | route | 부모 | blocking | 모드 | 비고 |\n|---|---|---|---|---|---|---|---|---|---|\n`;
for (const n of NODES) md += `| ${n.id} | ${n.kind} | ${c(n.name)} | ${c(n.comp)} | \`${n.file}\` | ${c(n.route)} | ${c(n.parent)} | ${c(n.blocking)} | ${n.modes.join(', ')} | ${c((n.orphan ? 'orphan. ' : '') + (n.note ?? ''))} |\n`;
md += `\n## 엣지 목록\n\n| from | to | 관계 | 트리거 | 조건 | 근거(파일:라인) |\n|---|---|---|---|---|---|\n`;
for (const e of EDGES) md += `| ${e.from} | ${e.to} | ${e.rel} | ${c(e.trigger)} | ${c(e.condition)} | \`${e.source}\` |\n`;
md += `\n## 기존 블록도 대비 변경\n\n기존 \`screen-block-diagram.html\`(같은 커밋 \`76b99e3\`에서 작성)을 코드와 다시 대조했다.\n\n| 분류 | 내용 |\n|---|---|\n| 추가 | 없음. \`app/\`의 라우트 파일 30개가 모두 노드에 있고, Modal·BottomSheetModal·Sheet·Alert·toast를 쓰는 파일이 모두 노드·엣지·이슈에 있다 |\n| 삭제 | 없음 |\n| 근거 라인 수정 | \`canvas_toolbar → pencil_popover\`의 근거 두 곳을 파일명만 적힌 것에서 전체 경로로 고쳤다 |\n| 종류 수정 | 없음 |\n| 파일 | \`screen-block-diagram.html\`을 \`ui-structure.html\`로 옮기고 \`ui-structure.md\`, \`ui-structure.json\`을 추가했다 |\n\n검증: 엣지 115개의 근거 \`파일:라인\`이 모두 실제 파일의 줄 범위 안에 있고, 첫 근거 줄이 빈 줄이나 주석인 엣지는 없다. \`src/kit/ui/PdfViewerModal.web.tsx\`는 웹 전용 변형이라 노드로 두지 않았다. 네 개 뷰의 Mermaid는 \`@mermaid-js/mermaid-cli\`로 오류 없이 SVG로 렌더링됐다(2026-11-10).\n`;
md += `\n## 미확인/이슈 목록\n\n` + ISSUES.map((i) => `- **[${i.tag}]** ${strip(i.text)}`).join('\n') + `\n\n## 계획(미구현)\n\n코드에 자리만 있고 동작이 없는 항목이다. 실제 구조가 아니므로 위 다이어그램에는 넣지 않았다.\n\n\`\`\`mermaid\n${PLANNED.replace(/\n\s*class intro planned/, '')}\n\`\`\`\n`;
fs.writeFileSync(outDir + '/ui-structure.md', md);
console.log('exported', NODES.length, EDGES.length);
