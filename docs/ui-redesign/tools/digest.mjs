import fs from 'node:fs';
const lines = fs.readFileSync(process.argv[2], 'utf8').trim().split('\n');
for (const l of lines) {
  const [file, ln] = l.split(':'); const src = fs.readFileSync(file, 'utf8'); const L = src.split('\n');
  // opening tag text: from line until first '>' that closes the tag (approx: up to 14 lines)
  let tag = ''; let depth = 0;
  for (let i = ln - 1; i < Math.min(L.length, ln - 1 + 16); i++) { tag += L[i].trim() + ' '; 
    for (const ch of L[i]) { if (ch === '{') depth++; if (ch === '}') depth--; }
    if (depth <= 0 && />\s*$/.test(L[i].trim())) break; }
  const body = L.slice(ln - 1, ln + 9).join(' ');
  const names = [...new Set([...tag.matchAll(/\b(?:styles|s|st)\.(\w+)/g)].map((m) => m[1]))];
  const defs = names.map((n) => { const m = new RegExp('\\b' + n + '\\s*:\\s*\\{([^}]*)\\}').exec(src); return m ? `${n}{${m[1].replace(/\s+/g, ' ').trim()}}` : n + '{?}'; });
  const txt = [...body.matchAll(/>([^<>{}]{1,24})</g)].map((m) => m[1].trim()).filter(Boolean)[0] ?? '';
  const f = (re) => (re.exec(tag) || [])[1] || '';
  console.log([`${file}:${ln}`, 'role=' + f(/accessibilityRole="(\w+)"/), 'label=' + (f(/accessibilityLabel=("[^"]*"|\{[^}]{0,40})/)).slice(0, 40),
    'dis=' + (/\bdisabled\b/.test(tag) ? 'y' : 'n'), 'sel=' + (/selected|checked/.test(tag) ? 'y' : 'n'), 'pressed=' + (/pressed/.test(tag) ? 'y' : 'n'),
    'spin=' + (/ActivityIndicator/.test(body) ? 'y' : 'n'), 'hit=' + (/hitSlop/.test(tag) ? 'y' : 'n'), 'txt=' + txt, defs.join(' ; ').slice(0, 330)].join(' | '));
}
