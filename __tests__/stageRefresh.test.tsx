import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mem: Record<string, string> = {};
jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: (k: string) => mem[k], set: (k: string, v: string) => void (mem[k] = v), remove: (k: string) => void delete mem[k] }) }));
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: (props: any) => <View testID="webview" {...props} /> };
});
jest.mock('../src/kit/ui/image-dynamic-dims', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: (p: any) => <View testID="card-image" accessibilityHint={p.source.uri} /> };
});

import { ProblemListPanel, type ProblemListFetchers } from '../src/kit/problem-list/ProblemListPanel';
import { bumpContentVersions, contentVersionOf, versionedUrl } from '../src/kit/problem-list/contentVersion';

beforeEach(() => {
  for (const k of Object.keys(mem)) delete mem[k];
});

describe('versionedUrl', () => {
  it('handles url shapes', async () => {
    bumpContentVersions([{ sourceType: 'U', sourceId: 1 }], 55);
    expect(versionedUrl('https://a/b.png', 'U', '1')).toBe('https://a/b.png?v=55');
    expect(versionedUrl('https://a/b.png?x=1', 'U', 1)).toBe('https://a/b.png?x=1&v=55');
    expect(versionedUrl('https://a/b.png?v=1&x=1', 'U', 1)).toBe('https://a/b.png?x=1&v=55');
    expect(versionedUrl('https://a/b.png#f', 'U', 1)).toBe('https://a/b.png?v=55#f');
    expect(versionedUrl('', 'U', 1)).toBe('');
    expect(versionedUrl('https://a/c.png', 'U', 2)).toBe('https://a/c.png');
  });
  it('keeps other versions and survives broken storage', async () => {
    bumpContentVersions([{ sourceType: 'U', sourceId: 1 }], 1);
    bumpContentVersions([{ sourceType: 'U', sourceId: 2 }], 2);
    expect(contentVersionOf('U', 1)).toBe(1);
    mem['agent:unitContentVersions'] = '{broken';
    expect(contentVersionOf('U', 1)).toBeUndefined();
  });
});

describe('ProblemListPanel refresh', () => {
  const set = (ids: number[]) => ({ title: 't', problems: ids.map((id) => ({ sourceType: 'U', sourceId: id, image: `https://img/${id}.png` })) });
  const urls = () => screen.getAllByTestId('card-image').map((n) => n.props.accessibilityHint);
  const make = (fetchProblems: jest.Mock) => ({ fetchProblems }) as unknown as ProblemListFetchers;
  const el = (f: ProblemListFetchers, token: number, onDone = jest.fn(), source: any = { kind: 'bookmarks' }) => (
    <ProblemListPanel fetchers={f} source={source} onSelectProblem={() => {}} refresh={{ token, onDone }} />
  );

  it('does not refresh on mount; refreshes on token bump, versions all problems', async () => {
    const fetchProblems = jest.fn().mockResolvedValue(set([1, 2]));
    const f = make(fetchProblems);
    const onDone = jest.fn();
    const { rerender } = await render(el(f, 0, onDone));
    await waitFor(() => expect(urls()).toEqual(['https://img/1.png', 'https://img/2.png']));
    expect(fetchProblems).toHaveBeenCalledTimes(1);
    fetchProblems.mockResolvedValue(set([2, 3, 4]));
    await rerender(el(f, 1, onDone));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(true));
    expect(fetchProblems).toHaveBeenCalledTimes(2);
    const u = urls();
    expect(u).toHaveLength(3);
    const v = u[0].split('v=')[1];
    expect(u.every((x) => x.endsWith(`?v=${v}`))).toBe(true);
    expect(u[0]).toContain('/2.png');
  });

  it('keeps list on failure', async () => {
    const fetchProblems = jest.fn().mockResolvedValue(set([1]));
    const f = make(fetchProblems);
    const onDone = jest.fn();
    const { rerender } = await render(el(f, 0, onDone));
    await waitFor(() => expect(urls()).toHaveLength(1));
    fetchProblems.mockRejectedValue(new Error('x'));
    await rerender(el(f, 1, onDone));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith(false));
    expect(urls()).toEqual(['https://img/1.png']);
    expect(contentVersionOf('U', 1)).toBeUndefined();
  });

  it('ignores a late response after source changes', async () => {
    const fetchProblems = jest.fn().mockResolvedValue(set([1]));
    const f = make(fetchProblems);
    const onDone = jest.fn();
    const { rerender } = await render(el(f, 0, onDone));
    await waitFor(() => expect(urls()).toHaveLength(1));
    let resolve!: (v: any) => void;
    fetchProblems.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    await rerender(el(f, 1, onDone));
    fetchProblems.mockResolvedValue(set([9]));
    await rerender(el(f, 1, onDone, { kind: 'task', taskId: 3 }));
    await waitFor(() => expect(urls()).toEqual(['https://img/9.png']));
    await act(async () => resolve(set([1, 2, 3])));
    expect(urls()).toEqual(['https://img/9.png']);
    expect(onDone).not.toHaveBeenCalled();
    expect(contentVersionOf('U', 2)).toBeUndefined();
  });
});
