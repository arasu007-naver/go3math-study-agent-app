import { groupByProblem } from '../src/kit/diary/DailyRecordsList';

describe('groupByProblem', () => {
  it('groups records of the same problem in first-seen order', () => {
    const groups = groupByProblem([
      { id: 1, sourceType: 'unit', sourceId: 10, fileName: 'a.png' },
      { id: 2, sourceType: 'unit', sourceId: 20, fileName: 'b.png' },
      { id: 3, sourceType: 'unit', sourceId: 10, fileName: 'c.png' },
      { id: 4, sourceType: 'exam', sourceId: 10, fileName: 'd.png' },
    ]);
    expect(groups.map((g) => [g.key, g.records.map((r) => r.id)])).toEqual([
      ['unit:10', [1, 3]],
      ['unit:20', [2]],
      ['exam:10', [4]],
    ]);
  });
});
