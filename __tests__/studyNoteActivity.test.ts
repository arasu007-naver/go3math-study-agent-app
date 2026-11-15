import {
  activityKey,
  appendActivity,
  clearActivity,
  emptyActivities,
  isEmptyActivities,
  loadActivity,
  mergeActivities,
  parseActivities,
} from '../src/kit/study-note/activity';
import type { KeyValueStore } from '../src/storage/types';

function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    getString: (k) => m.get(k),
    set: (k, v) => void m.set(k, v),
    remove: (k) => void m.delete(k),
  };
}

const A = { v: 1 as const, concepts: [{ id: 1, title: '일반항' }], quizIds: [45] };
const B = { v: 1 as const, concepts: [{ id: 1, title: '일반항' }, { id: 2, title: '점화식' }], quizIds: [45, 46] };

let store: KeyValueStore;
beforeEach(() => {
  store = memoryStore();
});

it('합칠 때 id가 같은 것은 한 번만, 처음 본 순서로 남긴다', () => {
  expect(mergeActivities(A, B)).toEqual({ v: 1, concepts: [{ id: 1, title: '일반항' }, { id: 2, title: '점화식' }], quizIds: [45, 46] });
});

it('합쳐도 입력을 바꾸지 않는다', () => {
  const a = emptyActivities();
  mergeActivities(a, B);
  expect(a).toEqual(emptyActivities());
});

it.each([null, undefined, '', 'not json', '[]', '{"concepts":"x"}'])('깨진 값 %p은 빈 기록', (raw) => {
  expect(parseActivities(raw)).toEqual(emptyActivities());
});

it('모양이 맞는 항목만 남긴다', () => {
  expect(parseActivities('{"v":1,"concepts":[{"id":1,"title":"a"},{"id":"x"}],"quizIds":[3,"4",null]}'))
    .toEqual({ v: 1, concepts: [{ id: 1, title: 'a' }], quizIds: [3] });
});

it('isEmptyActivities', () => {
  expect(isEmptyActivities(emptyActivities())).toBe(true);
  expect(isEmptyActivities(A)).toBe(false);
  expect(isEmptyActivities({ v: 1, concepts: [], quizIds: [1] })).toBe(false);
});

it('appendActivity는 기존 기록에 합쳐 쓰고, 빈 기록은 쓰지 않는다', () => {
  appendActivity(store, 7, emptyActivities());
  expect(store.getString(activityKey(7))).toBeUndefined();
  appendActivity(store, 7, A);
  appendActivity(store, 7, B);
  expect(loadActivity(store, 7)).toEqual(mergeActivities(A, B));
  clearActivity(store, 7);
  expect(loadActivity(store, 7)).toEqual(emptyActivities());
});

it('activityKey', () => expect(activityKey(7)).toBe('agent:studyNoteActivity:7'));
