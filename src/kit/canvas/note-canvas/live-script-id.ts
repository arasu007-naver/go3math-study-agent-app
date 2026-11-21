// 실황 guide의 scriptId 판정. 스크립트 없는 유닛의 defaultScript는 음수 id를 쓴다.
export const hasScriptId = (id: unknown): boolean => {
  if (id == null) return false;
  const n = Number(id);
  return Number.isFinite(n) && n !== 0;
};

// 공용 처리기(handleLiveClassMessage)는 guide.scriptId가 null이 아니고 currentScript.id와 다르면 '스크립트 전환'으로 보고
// 나머지 처리(주석 adhoc, 컷 재생 등)를 건너뛴다. 스크립트 없는 유닛은 guide가 scriptId 0, currentScript에는 id가 없어
// 늘 다르다고 판정되므로, id가 없는 guide는 scriptId를 비워 넘긴다(유닛 전환은 패널이 source로 이미 처리했다).
export const dropEmptyScriptId = (guide: any): any => (!guide || hasScriptId(guide.scriptId) ? guide : { ...guide, scriptId: undefined });

// scriptId가 없는(null/0) guide는 live-scripts에서 sourceType/sourceId가 같은 스크립트의 id로 바꾼다.
export const normalizeGuideScriptId = (guide: any, scripts: any[]): any => {
  if (!guide || hasScriptId(guide.scriptId) || !guide.sourceType || !guide.sourceId) return guide;
  const matched = (Array.isArray(scripts) ? scripts : []).filter(
    (src: any) => src && src.sourceType == guide.sourceType && String(src.sourceId) == String(guide.sourceId) && hasScriptId(src.id),
  );
  const found = matched.find((src: any) => src.isDefaultScript === true) ?? matched[0];
  return found ? { ...guide, scriptId: Number(found.id) } : guide;
};
