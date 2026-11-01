import { initialRouterState, routeCommand } from '../src/agent/commandRouter';
import { createTopicFetchers } from '../src/adapters/topicFetchers';
import { buildPreExamQuery, buildThisYearQuery, defaultYearsFor } from '../src/kit/exam-search/query';
import { resolveInitialSubject, SUBJECT_STORAGE_KEY } from '../src/kit/topic-panel/TopicTabsPanel';
import { pickGoUnitIndex } from '../src/kit/topic-panel/TopicUnitList';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));

describe('exam-search query (legacy goExerciseScreen rules)', () => {
  it('this-year: 2026 fixed, defaults month 6 and numbers 1..30, sorts selections', () => {
    expect(buildThisYearQuery({ subject: 'CALCULUS', months: [], numbers: [] })).toMatchObject({
      major: 'CALCULUS',
      years: [2026],
      months: [6],
      numbers: Array.from({ length: 30 }, (_, i) => i + 1),
      studyType: 'MATH_DETAILED_PRE_EXAMS',
    });
    expect(buildThisYearQuery({ subject: 'CALCULUS', months: [10, 6], numbers: [30, 21] })).toMatchObject({ months: [6, 10], numbers: [21, 30] });
  });

  it('pre-exam: curriculum-specific default years, rejects more than 60 units', () => {
    expect(buildPreExamQuery({ subject: 'CALCULUS', years: [], months: [11], numbers: [21, 22] })).toMatchObject({ years: [2021, 2022, 2023, 2024] });
    expect(buildPreExamQuery({ subject: 'A', years: [], months: [11], numbers: [21] })).toMatchObject({ years: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020] });
    expect(buildPreExamQuery({ subject: 'CALCULUS', years: [2025], months: [], numbers: [] })).toEqual({ error: 'too_many', unitCount: 180 });
    expect(defaultYearsFor('GEOMETRY')).toEqual([2025]);
    expect(defaultYearsFor('B')).toEqual([2020]);
  });
});

describe('topic-panel', () => {
  it('"가자" picks the first unit with a release script, else 0 (legacy handleGoPress)', () => {
    const u = (url?: string) => ({ sourceType: 'UNIT', sourceId: 1, scripts: url === undefined ? [] : [{ id: 1, releaseScriptUrl: url }] });
    expect(pickGoUnitIndex([u(), u(''), u('https://x/s.json'), u('https://y')])).toBe(2);
    expect(pickGoUnitIndex([u(), u('')])).toBe(0);
  });

  it('resolves the initial subject: preset > stored > first', () => {
    const subjects = [{ label: '수능 공통', value: 'COMMON_MATH' }, { label: '미적분', value: 'CALCULUS' }];
    const store = { getString: (k: string) => (k === SUBJECT_STORAGE_KEY ? JSON.stringify(subjects[1]) : undefined) };
    expect(resolveInitialSubject(subjects, 'COMMON_MATH', store)).toBe('COMMON_MATH');
    expect(resolveInitialSubject(subjects, 'NOPE', store)).toBe('CALCULUS');
    expect(resolveInitialSubject(subjects, undefined, { getString: () => '{bad json' })).toBe('COMMON_MATH');
  });

  it('fetcher adapter only issues queries (M3: zero write calls)', async () => {
    const client = {
      query: jest.fn(async ({ variables }: any) => ({
        data: { subjectTopics: [{ id: 1, title: 't' }], subjectTopicTotalPageCount: 3, topicForStudy: { id: variables.topicId, title: 'x', units: [] } },
      })),
      mutate: jest.fn(),
    };
    const f = createTopicFetchers(client as any);
    await expect(f.fetchSubjectTopics({ subject: 'COMMON_MATH', page: 1, pageSize: 12 })).resolves.toHaveLength(1);
    await expect(f.fetchTotalPageCount({ subject: 'COMMON_MATH', pageSize: 12 })).resolves.toBe(3);
    await expect(f.fetchTopic(7)).resolves.toMatchObject({ id: 7 });
    expect(client.mutate).not.toHaveBeenCalled();
  });
});

describe('show_topic_list (M3)', () => {
  const cmd = (payload: unknown) => ({ v: 1, id: 'c1', sessionId: 's', seq: 1, ts: 't', kind: 'show_topic_list', payload });

  it('renders topic_list for subject and exam sources', () => {
    let r = routeCommand(initialRouterState, cmd({ source: { kind: 'subject', subject: 'CALCULUS' } }), 'phone');
    expect(r.ack?.payload.ok).toBe(true);
    expect(r.state.stage).toEqual({ componentId: 'topic_list', props: { subject: 'CALCULUS' } });

    r = routeCommand(initialRouterState, cmd({ source: { kind: 'exam', year: 2026, month: 10 } }), 'phone');
    expect(r.state.stage?.props).toMatchObject({ filter: { year: 2026, month: 10 } });
  });

  it('is phone-only: the tablet Stage shows only problem lists', () => {
    const r = routeCommand(initialRouterState, cmd({ source: { kind: 'subject', subject: 'CALCULUS' } }), 'tablet');
    expect(r.ack?.payload).toMatchObject({ ok: false, code: 'unsupported' });
    expect(r.state.stage).toBeNull();
  });

  it('rejects ids source as unsupported with a fallback', () => {
    const r = routeCommand(initialRouterState, cmd({ source: { kind: 'ids', topicIds: [1, 2] } }), 'phone');
    expect(r.ack?.payload).toMatchObject({ ok: false, code: 'unsupported' });
    expect(r.state.fallbackText).toBeTruthy();
  });

  it('validates exam_search props through the registry', () => {
    const show = (props: unknown) => ({ v: 1, id: 'c2', sessionId: 's', seq: 2, ts: 't', kind: 'show_component', payload: { componentId: 'exam_search', props } });
    expect(routeCommand(initialRouterState, show({ mode: 'pre_exam', preset: { subject: 'A' } }), 'phone').ack?.payload.ok).toBe(true);
    expect(routeCommand(initialRouterState, show({ mode: 'weekly' }), 'phone').ack?.payload).toMatchObject({ code: 'invalid_props' });
  });
});
