// 실황 guide의 scriptId 판정. 스크립트 없는 유닛의 defaultScript는 음수 id를 쓴다.
export const hasScriptId = (id: unknown): boolean => {
  if (id == null) return false;
  const n = Number(id);
  return Number.isFinite(n) && n !== 0;
};

// scriptId가 없는(null/0) guide는 live-scripts에서 sourceType/sourceId가 같은 스크립트의 id로 바꾼다.
export const normalizeGuideScriptId = (guide: any, scripts: any[]): any => {
  if (!guide || hasScriptId(guide.scriptId) || !guide.sourceType || !guide.sourceId) return guide;
  const matched = (Array.isArray(scripts) ? scripts : []).filter(
    (src: any) => src && src.sourceType == guide.sourceType && String(src.sourceId) == String(guide.sourceId) && hasScriptId(src.id),
  );
  const found = matched.find((src: any) => src.isDefaultScript === true) ?? matched[0];
  return found ? { ...guide, scriptId: Number(found.id) } : guide;
};
