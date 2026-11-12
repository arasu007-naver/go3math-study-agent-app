import fs from 'node:fs';
import path from 'node:path';

// 단계 4b: dock 패널 파일에 hex 색·이름 색·숫자 fontSize를 남기지 않는다(값은 theme.ts에서만).
const FILES = ['src/kit/timeline/TimelinePanel.tsx', 'src/kit/research/ResearchPanel.tsx', 'src/kit/exam-search/ExamSearchPanel.tsx', 'src/kit/live-class/LiveClassListPanel.tsx'];

function findDrift(source: string): string[] {
  return [
    ...(source.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []),
    ...(source.match(/fontSize:\s*\d/g) ?? []),
    ...(source.match(/[cC]olor[:=]\s*["'](?!transparent)[a-zA-Z]+["']/g) ?? []),
  ];
}

test('drift finder catches named colors', () => {
  expect(findDrift(`a: '#FF8800', fontSize: 12, color: 'orange', color="orange" backgroundColor: 'transparent', c: colors.accent`)).toHaveLength(4);
});

test('dock panels have no drift', () => {
  for (const f of FILES) expect([f, findDrift(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'))]).toEqual([f, []]);
});
