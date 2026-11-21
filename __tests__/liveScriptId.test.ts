import fs from 'fs';
import path from 'path';
import { hasScriptId, normalizeGuideScriptId } from '../src/kit/canvas/note-canvas/live-script-id';

describe('hasScriptId', () => {
  it.each([5, -12, '-12', '7'])('%p -> true', (v) => expect(hasScriptId(v)).toBe(true));
  it.each([0, null, undefined, 'abc', NaN, '0'])('%p -> false', (v) => expect(hasScriptId(v)).toBe(false));
});

describe('normalizeGuideScriptId', () => {
  const scripts = [
    { id: '3', sourceType: 'UNIT', sourceId: 1 },
    { id: '-12', sourceType: 'UNIT', sourceId: 1, isDefaultScript: true },
  ];
  it('scriptId 0 → source가 같은 스크립트 id (default 우선)', () => {
    const guide = { scriptId: 0, sourceType: 'UNIT', sourceId: 1, studyIdx: 3 };
    expect(normalizeGuideScriptId(guide, scripts)).toEqual({ ...guide, scriptId: -12 });
  });
  it('null도 처리하고 sourceId는 문자열 비교', () => {
    expect(normalizeGuideScriptId({ scriptId: null, sourceType: 'UNIT', sourceId: '1' }, scripts)?.scriptId).toBe(-12);
  });
  it('default가 없으면 첫 항목', () => {
    expect(normalizeGuideScriptId({ sourceType: 'UNIT', sourceId: 1 }, [scripts[0]])?.scriptId).toBe(3);
  });
  it('scriptId가 있으면 그대로', () => {
    const g = { scriptId: 7 };
    expect(normalizeGuideScriptId(g, scripts)).toBe(g);
  });
  it('맞는 항목이 없으면 그대로', () => {
    const g = { scriptId: 0, sourceType: 'UNIT', sourceId: 99 };
    expect(normalizeGuideScriptId(g, scripts)).toBe(g);
  });
});

describe('topic-live-canvas source', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/kit/canvas/note-canvas/topic-live-canvas.tsx'), 'utf8');
  it('정규화 후 hasScriptId로 판정한다', () => {
    expect(src).toContain("guide = normalizeGuideScriptId(guide, JSON.parse(storage.getString('live-scripts') || '[]'))");
    expect(src).toContain('hasScriptId(onAirScriptId)');
    expect(src).toContain('hasScriptId(guide.scriptId)');
    expect(src).toContain('hasScriptId(targetScriptId)');
    expect(src).not.toMatch(/Number\(guide\.scriptId\) > 0/);
  });
});

describe('dropEmptyScriptId', () => {
  const { dropEmptyScriptId } = require('../src/kit/canvas/note-canvas/live-script-id');
  it('scriptId 0/null이면 비운다', () => {
    expect(dropEmptyScriptId({ action: 'adhoc', scriptId: 0, sourceId: 2 })).toEqual({ action: 'adhoc', scriptId: undefined, sourceId: 2 });
    expect(dropEmptyScriptId({ action: 'adhoc', scriptId: null }).scriptId).toBeUndefined();
  });
  it('id가 있으면(음수 포함) 그대로 돌려준다', () => {
    const g = { action: 'adhoc', scriptId: -12 };
    expect(dropEmptyScriptId(g)).toBe(g);
    const h = { action: 'adhoc', scriptId: 12 };
    expect(dropEmptyScriptId(h)).toBe(h);
  });
});
