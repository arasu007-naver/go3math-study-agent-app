import fs from 'fs';
import path from 'path';

import { cacheLiveReleaseScriptUrl, storage } from '@/src/kit/canvas/note-canvas/legacy';

// 선생님이 수업 중에 release 스크립트를 등록하면 guide에 scriptId와 releaseScriptUrl이 함께 온다(tutor-web 9614342).
// 스크립트 목록('live-scripts')은 화면에 들어올 때 한 번 받아 두므로 그 scriptId가 목록에 없고,
// 패널이 그 스크립트를 찾지 못해 캔버스가 끝없이 로딩했다. 기존 qoolla-student-app 1f4e554와 같은 동작.
const scripts = () => JSON.parse(storage.getString('live-scripts') || '[]');

beforeEach(() => storage.remove('live-scripts'));

test('adds a script the list does not have yet', () => {
  storage.set('live-scripts', JSON.stringify([{ id: 1, sourceType: 'unit', sourceId: 10, releaseScriptUrl: 'a.json' }]));
  const changed = cacheLiveReleaseScriptUrl({ scriptId: 2, sourceType: 'unit', sourceId: 20, releaseScriptUrl: 'b.json' });
  expect(changed).toBe(true);
  expect(scripts()).toEqual([
    { id: 1, sourceType: 'unit', sourceId: 10, releaseScriptUrl: 'a.json' },
    { id: 2, sourceType: 'unit', sourceId: 20, releaseScriptUrl: 'b.json' },
  ]);
});

test('fills in the release url of a script that had none', () => {
  storage.set('live-scripts', JSON.stringify([{ id: 1, sourceType: 'unit', sourceId: 10 }]));
  expect(cacheLiveReleaseScriptUrl({ scriptId: '1', sourceType: 'unit', sourceId: 10, releaseScriptUrl: 'a.json' })).toBe(true);
  expect(scripts()).toEqual([{ id: 1, sourceType: 'unit', sourceId: 10, releaseScriptUrl: 'a.json' }]);
});

test('leaves the list alone when nothing is new', () => {
  const list = JSON.stringify([{ id: 1, sourceType: 'unit', sourceId: 10, releaseScriptUrl: 'a.json' }]);
  storage.set('live-scripts', list);
  expect(cacheLiveReleaseScriptUrl({ scriptId: 1, releaseScriptUrl: 'a.json' })).toBe(false);
  expect(cacheLiveReleaseScriptUrl({ scriptId: 3 })).toBe(false);
  expect(cacheLiveReleaseScriptUrl({ sourceType: 'unit', sourceId: 10, releaseScriptUrl: 'a.json' })).toBe(false);
  expect(storage.getString('live-scripts')).toBe(list);
});

test('starts a list when none is stored yet', () => {
  expect(cacheLiveReleaseScriptUrl({ scriptId: 5, sourceType: 'unit', sourceId: 50, releaseScriptUrl: 'c.json' })).toBe(true);
  expect(scripts()).toEqual([{ id: 5, sourceType: 'unit', sourceId: 50, releaseScriptUrl: 'c.json' }]);
});

// 패널은 렌더 테스트가 없어 소스로 고정한다: guide를 받으면 스크립트를 고르기 전에 목록부터 갱신한다
test('hotline panel caches the guide release url before it picks the script', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src/kit/canvas/note-canvas/hotline-class-canvas.tsx'), 'utf8');
  const cache = src.indexOf('cacheLiveReleaseScriptUrl(guide)');
  const pick = src.indexOf('if (guide.scriptId == null)');
  expect(cache).toBeGreaterThan(-1);
  expect(pick).toBeGreaterThan(cache);
});
