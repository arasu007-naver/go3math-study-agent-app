import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';

const mem: Record<string, string> = {};
jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: (k: string) => mem[k], set: (k: string, v: string) => void (mem[k] = v), remove: (k: string) => void delete mem[k] }) }));
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: (props: any) => <View testID="webview" accessibilityLabel={props.source?.uri} /> };
});
jest.mock('../src/kit/ui/image-dynamic-dims', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: (p: any) => <View testID="card-image" accessibilityHint={p.source.uri} /> };
});
const mockFetch = jest.fn();
jest.mock('../src/adapters/problemListFetchers', () => ({ createProblemListFetchers: () => ({ fetchProblems: (s: any) => mockFetch(s) }) }));
jest.mock('../src/state/bootstrap', () => ({ apolloClient: {} }));

import { Stage } from '../src/host/Stage';
import { notebookArgs } from '../src/host/widgets';
import { contentVersionOf } from '../src/kit/problem-list/contentVersion';

const set = (ids: number[]) => ({ title: 't', problems: ids.map((id) => ({ sourceType: 'UNIT', sourceId: id, image: `https://img/${id}.png` })) });
const urls = () => screen.getAllByTestId('card-image').map((n) => n.props.accessibilityHint);
const session = { emit: jest.fn(), showLocalComponent: jest.fn(), restoreStage: jest.fn() } as any;
const st = (componentId: string, source: any) => ({ stage: { componentId, props: { source } }, connected: true, fallbackText: null }) as any;
const FAIL = '새로고침하지 못했어요. 잠시 후 다시 시도해 주세요.';

beforeEach(() => {
  for (const k of Object.keys(mem)) delete mem[k];
  mockFetch.mockReset();
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

describe.each([
  ['problem_list', { kind: 'task', taskId: 3 }],
  ['bookmarks', { kind: 'bookmarks' }],
])('Stage + %s', (componentId, source) => {
  it('refetches once with the current source, keeps cards while busy, blocks re-press, versions urls', async () => {
    mockFetch.mockResolvedValue(set([1, 2]));
    await render(<Stage state={st(componentId, source)} session={session} />);
    await waitFor(() => expect(urls()).toEqual(['https://img/1.png', 'https://img/2.png']));
    expect(mockFetch).toHaveBeenCalledTimes(1);

    let resolve!: (v: any) => void;
    mockFetch.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    await fireEvent.press(screen.getByTestId('stage-refresh'));
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch).toHaveBeenLastCalledWith(source);
    expect(urls()).toEqual(['https://img/1.png', 'https://img/2.png']);
    expect(screen.getByTestId('stage-refresh').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('stage-refresh'));
    expect(mockFetch).toHaveBeenCalledTimes(2);

    await act(async () => resolve(set([1, 2])));
    expect(screen.getByTestId('stage-refresh').props.accessibilityState.disabled).toBe(false);
    const first = urls().map((u) => u.split('v=')[1]);
    expect(first[0]).toBeTruthy();
    expect(new Set(first).size).toBe(1);

    // 다시 새로고침하면 버전이 바뀐다
    await new Promise((r) => setTimeout(r, 5));
    mockFetch.mockResolvedValue(set([1, 2]));
    await fireEvent.press(screen.getByTestId('stage-refresh'));
    await waitFor(() => expect(urls()[0].split('v=')[1]).not.toBe(first[0]));
  });
});

describe('Stage refresh behaviors', () => {
  it('button sits right before the bookmark toggle', async () => {
    mockFetch.mockResolvedValue(set([1]));
    await render(<Stage state={st('problem_list', { kind: 'task', taskId: 3 })} session={session} />);
    const kids = screen.getByTestId('stage-header').children as any[];
    const idx = kids.findIndex((c) => c.props?.testID === 'stage-refresh');
    expect(idx).toBeGreaterThan(-1);
    expect(kids[idx + 1].props.accessibilityLabel).toBe('내 책갈피');
  });

  it('applies adds/removals, keeps selection in range, resets to 0 out of range, null when empty', async () => {
    mockFetch.mockResolvedValue(set([1, 2, 3]));
    const state = st('problem_list', { kind: 'task', taskId: 3 });
    await render(<Stage state={state} session={session} />);
    await waitFor(() => expect(urls()).toHaveLength(3));
    const selected = () => screen.getAllByRole('button', { name: /번 문제/ }).map((b) => !!b.props.accessibilityState?.selected);
    await fireEvent.press(screen.getByRole('button', { name: '2번 문제' }));
    expect(selected()).toEqual([false, true, false]);
    const refresh = async (ids: number[]) => {
      mockFetch.mockResolvedValue(set(ids));
      await fireEvent.press(screen.getByTestId('stage-refresh'));
      await waitFor(() => expect(screen.getByTestId('stage-refresh').props.accessibilityState.disabled).toBe(false));
    };
    await refresh([1, 2, 3, 4]);
    expect(urls()).toHaveLength(4);
    expect(selected()).toEqual([false, true, false, false]);
    await refresh([7]);
    expect(urls()).toHaveLength(1);
    expect(selected()).toEqual([true]);
    await refresh([]);
    expect(screen.getByText('문제가 없어요.')).toBeTruthy();
    expect(screen.queryAllByTestId('card-image')).toHaveLength(0);
  });

  it('closes an open answer bubble when refresh starts and versions the answer url', async () => {
    mockFetch.mockResolvedValue(set([1]));
    await render(<Stage state={st('problem_list', { kind: 'task', taskId: 3 })} session={session} />);
    await waitFor(() => expect(urls()).toHaveLength(1));
    await fireEvent.press(screen.getByText('해답'));
    expect(screen.getByTestId('webview').props.accessibilityLabel).toMatch(/unit-answer\/1$/i);
    let resolve!: (v: any) => void;
    mockFetch.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    await fireEvent.press(screen.getByTestId('stage-refresh'));
    expect(screen.queryByTestId('webview')).toBeNull();
    await act(async () => resolve(set([1])));
    await waitFor(() => expect(screen.getByTestId('stage-refresh').props.accessibilityState.disabled).toBe(false));
    await new Promise((r) => setTimeout(r, 700)); // Button 연타 방지 간격
    await fireEvent.press(screen.getByText('해답'));
    expect(screen.getByTestId('webview').props.accessibilityLabel).toMatch(/unit-answer\/1\?v=\d+$/i);
  });

  it('keeps list and shows notice on failure, clears notice on next refresh start', async () => {
    mockFetch.mockResolvedValue(set([1]));
    await render(<Stage state={st('problem_list', { kind: 'task', taskId: 3 })} session={session} />);
    await waitFor(() => expect(urls()).toHaveLength(1));
    mockFetch.mockRejectedValueOnce(new Error('x'));
    await fireEvent.press(screen.getByTestId('stage-refresh'));
    await waitFor(() => expect(screen.getByText(FAIL)).toBeTruthy());
    expect(urls()).toEqual(['https://img/1.png']);
    expect(contentVersionOf('UNIT', 1)).toBeUndefined();
    expect(screen.getByTestId('stage-refresh').props.accessibilityState.disabled).toBe(false);
    let resolve!: (v: any) => void;
    mockFetch.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    await fireEvent.press(screen.getByTestId('stage-refresh'));
    expect(screen.queryByText(FAIL)).toBeNull();
    await act(async () => resolve(set([1])));
  });

  it('releases busy and ignores late response when the stage view changes', async () => {
    mockFetch.mockResolvedValue(set([1]));
    const { rerender } = await render(<Stage state={st('problem_list', { kind: 'task', taskId: 3 })} session={session} />);
    await waitFor(() => expect(urls()).toHaveLength(1));
    let resolve!: (v: any) => void;
    mockFetch.mockImplementationOnce(() => new Promise((r) => (resolve = r)));
    await fireEvent.press(screen.getByTestId('stage-refresh'));
    expect(screen.getByTestId('stage-refresh').props.accessibilityState.disabled).toBe(true);
    mockFetch.mockResolvedValue(set([9]));
    await rerender(<Stage state={st('problem_list', { kind: 'task', taskId: 4 })} session={session} />);
    await waitFor(() => expect(urls()).toEqual(['https://img/9.png']));
    expect(screen.getByTestId('stage-refresh').props.accessibilityState.disabled).toBe(false);
    await act(async () => resolve(set([1, 2])));
    expect(urls()).toEqual(['https://img/9.png']);
    expect(contentVersionOf('UNIT', 2)).toBeUndefined();
    expect(screen.getByTestId('stage-refresh').props.accessibilityState.disabled).toBe(false);
  });

  it('failure notice clears when the stage view changes', async () => {
    mockFetch.mockResolvedValue(set([1]));
    const { rerender } = await render(<Stage state={st('problem_list', { kind: 'task', taskId: 3 })} session={session} />);
    await waitFor(() => expect(urls()).toHaveLength(1));
    mockFetch.mockRejectedValueOnce(new Error('x'));
    await fireEvent.press(screen.getByTestId('stage-refresh'));
    await waitFor(() => expect(screen.getByText(FAIL)).toBeTruthy());
    mockFetch.mockResolvedValue(set([5]));
    await rerender(<Stage state={st('problem_list', { kind: 'task', taskId: 4 })} session={session} />);
    expect(screen.queryByText(FAIL)).toBeNull();
  });

  it('does not put v= into Problem.image or the TaskSpec', async () => {
    const problems = set([1, 2]).problems;
    mockFetch.mockResolvedValue({ title: 't', problems });
    await render(<Stage state={st('bookmarks', { kind: 'bookmarks' })} session={session} />);
    await waitFor(() => expect(urls()).toHaveLength(2));
    await fireEvent.press(screen.getByTestId('stage-refresh'));
    await waitFor(() => expect(urls()[0]).toContain('?v='));
    expect(problems.every((p) => !p.image.includes('v='))).toBe(true);
    const [, , spec] = notebookArgs({ kind: 'bookmarks' }, problems);
    expect(JSON.stringify(spec)).not.toContain('v=');
  });

  it('unrefreshed problems keep exact urls', async () => {
    mockFetch.mockResolvedValue(set([1]));
    await render(<Stage state={st('problem_list', { kind: 'task', taskId: 3 })} session={session} />);
    await waitFor(() => expect(urls()).toEqual(['https://img/1.png']));
  });
});
