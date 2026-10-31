import { RESEARCH_CATEGORY_KEY, resolveInitialCategory } from '../src/kit/research/ResearchPanel';

const store = (v?: string) => ({ getString: (k: string) => (k === RESEARCH_CATEGORY_KEY ? v : undefined) });

describe('ResearchPanel initial category', () => {
  it('prefers preset over stored value', () => {
    expect(resolveInitialCategory('mentor', store('pre'))).toBe('mentor');
  });
  it('restores legacy lastAgenda value', () => {
    expect(resolveInitialCategory(undefined, store('pre'))).toBe('pre');
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
    expect(resolveComponent('research', {}, 'tablet')).toEqual({ ok: true, props: {} });
    expect(resolveComponent('research', { category: 'pre' }, 'phone')).toEqual({ ok: true, props: { category: 'pre' } });
    expect(resolveComponent('research', { category: 'topic' }, 'tablet')).toMatchObject({ ok: false, code: 'invalid_props' });
  });
});
