// 주제 카드 제목 — 같은 주제 id는 앱이 켜져 있는 동안 한 번만 조회한다(실패하면 다음에 다시 시도).
const cache = new Map<number, Promise<string>>();

export function cachedTopicTitle(topicId: number, fetch: (topicId: number) => Promise<string>): Promise<string> {
  let hit = cache.get(topicId);
  if (!hit) {
    hit = fetch(topicId);
    cache.set(topicId, hit);
    hit.catch(() => cache.delete(topicId));
  }
  return hit;
}

/** 테스트용 */
export function clearTopicTitles() {
  cache.clear();
}
