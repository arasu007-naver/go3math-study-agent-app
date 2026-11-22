/**
 * 문제별 콘텐츠 버전: Stage 새로고침이 올린 시각(epoch ms)을 Storage에 두고, 표시용 이미지·해답 URL에 `v=`로 붙여
 * 같은 URL의 오래된 캐시를 쓰지 않게 한다. 저장되는 문제 URL(Problem.image 등)은 바꾸지 않는다.
 */
import { storage } from '../../storage';

const KEY = 'agent:unitContentVersions';

const keyOf = (sourceType: string, sourceId: string | number) => `${sourceType}-${sourceId}`;

function readAll(): Record<string, number> {
  try {
    const parsed = JSON.parse(storage.getString(KEY) ?? '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/** 주어진 문제들의 버전을 같은 값으로 기록한다. 다른 문제의 버전은 유지한다 */
export function bumpContentVersions(problems: { sourceType: string; sourceId: string | number }[], version: number = Date.now()): void {
  const all = readAll();
  for (const p of problems) all[keyOf(p.sourceType, p.sourceId)] = version;
  storage.set(KEY, JSON.stringify(all));
}

export function contentVersionOf(sourceType: string, sourceId: string | number): number | undefined {
  const v = readAll()[keyOf(sourceType, sourceId)];
  return typeof v === 'number' ? v : undefined;
}

/** 버전이 없거나 url이 비었으면 그대로, 있으면 `v=<버전>`을 붙인다(이미 v가 있으면 교체, fragment 앞에 넣는다) */
export function versionedUrl<T extends string | null | undefined>(url: T, sourceType: string, sourceId: string | number): T {
  if (!url) return url;
  const version = contentVersionOf(sourceType, sourceId);
  if (version === undefined) return url;
  const hashAt = url.indexOf('#');
  const hash = hashAt >= 0 ? url.slice(hashAt) : '';
  const base = hashAt >= 0 ? url.slice(0, hashAt) : url;
  const qAt = base.indexOf('?');
  if (qAt < 0) return `${base}?v=${version}${hash}` as T;
  const path = base.slice(0, qAt);
  const kept = base.slice(qAt + 1).split('&').filter((s) => s !== '' && s.split('=')[0] !== 'v');
  return `${path}?${[...kept, `v=${version}`].join('&')}${hash}` as T;
}
