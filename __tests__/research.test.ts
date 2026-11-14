import { RESEARCH_CATEGORY_KEY, resolveInitialCategory } from '../src/kit/research/ResearchPanel';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

const store = (v?: string) => ({ getString: (k: string) => (k === RESEARCH_CATEGORY_KEY ? v : undefined) });

describe('ResearchPanel initial category', () => {
  it('prefers preset over stored value', () => {
    expect(resolveInitialCategory('mentor', store('pre'))).toBe('mentor');
  });
  it('restores legacy lastAgenda value', () => {
    expect(resolveInitialCategory(undefined, store('pre'))).toBe('pre');
  });
  it('concept is a tab again: stored or preset concept opens it', () => {
    expect(resolveInitialCategory(undefined, store('concept'))).toBe('concept');
    expect(resolveInitialCategory('concept', store('pre'))).toBe('concept');
  });
  it('unknown preset falls back like a stored value (spec 4b D3)', () => {
    expect(resolveInitialCategory('unit' as never, store('pre'))).toBe('pre');
    expect(resolveInitialCategory('unit' as never, store())).toBe('recent');
  });
  it('falls back to recent for missing or retired categories', () => {
    expect(resolveInitialCategory(undefined, store())).toBe('recent');
    expect(resolveInitialCategory(undefined, store('topic'))).toBe('recent');
  });
});

describe('research widget registry', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { resolveComponent } = require('../src/host/registry');
  it('accepts an optional category preset and rejects unknown ones', () => {
    expect(resolveComponent('research', {}, 'phone')).toEqual({ ok: true, props: {} });
    expect(resolveComponent('research', { category: 'pre' }, 'phone')).toEqual({ ok: true, props: { category: 'pre' } });
    expect(resolveComponent('research', { category: 'topic' }, 'phone')).toMatchObject({ ok: false, code: 'invalid_props' });
    // 태블릿은 drawer '검색' dock이 맡는다
    expect(resolveComponent('research', {}, 'tablet')).toMatchObject({ ok: false, code: 'unsupported' });
  });
});
