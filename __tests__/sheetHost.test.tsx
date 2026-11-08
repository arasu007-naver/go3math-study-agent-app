import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SheetHost } from '../src/host/SheetHost';
import type { AgentSession, SessionSnapshot } from '../src/agent/session';
import { initialRouterState } from '../src/agent/commandRouter';
import { solveStore } from '../src/state/solve';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../src/state/bootstrap', () => ({ apolloClient: {} }));

const mockFetchNote = jest.fn(async (_id: number) => null);
const mockRegister = jest.fn(async () => {});
const mockUpdate = jest.fn(async () => {});
jest.mock('../src/adapters/studyNoteFetchers', () => ({
  createStudyNoteFetchers: () => ({
    fetchNote: (id: number) => mockFetchNote(id),
    register: () => mockRegister(),
    update: () => mockUpdate(),
  }),
}));

function snap(props: Record<string, unknown> | null): SessionSnapshot {
  return {
    ...initialRouterState,
    connected: true,
    sheet: props ? { componentId: 'study_note', props } : null,
  } as SessionSnapshot;
}

function fakeSession() {
  return { emit: jest.fn(), closeSheet: jest.fn() } as unknown as AgentSession & {
    emit: jest.Mock;
    closeSheet: jest.Mock;
  };
}

function findModal(): any {
  let node: any = screen.getByLabelText('학습장 배경');
  while (node && !node.props.onRequestClose) node = node.parent;
  return node;
}

beforeEach(() => {
  jest.clearAllMocks();
  solveStore.dispatch(null);
});

describe('SheetHost', () => {
  it('renders the study note form when sheet is set', async () => {
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: '21번' })} session={fakeSession()} />);
    expect(await screen.findByText('학습장 · 21번')).toBeTruthy();
  });

  it('title defaults to 학습장 기록', async () => {
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self' })} session={fakeSession()} />);
    expect(await screen.findByText('학습장 · 학습장 기록')).toBeTruthy();
  });

  it('sheet title falls back to solve session title for the same taskId', async () => {
    solveStore.dispatch({ title: '수열 21번', problems: [], index: 0, taskId: 7 });
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self' })} session={fakeSession()} />);
    expect(await screen.findByText('학습장 · 수열 21번')).toBeTruthy();
  });

  it('ignores the solve session title for another taskId', async () => {
    solveStore.dispatch({ title: '수열 21번', problems: [], index: 0, taskId: 8 });
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self' })} session={fakeSession()} />);
    expect(await screen.findByText('학습장 · 학습장 기록')).toBeTruthy();
  });

  it('passes topicHints through', async () => {
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self', topicHints: ['일반항'] })} session={fakeSession()} />);
    expect(await screen.findByText('일반항')).toBeTruthy();
  });

  it('saved → emits study_note_saved once and closes', async () => {
    const session = fakeSession();
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(session.closeSheet).toHaveBeenCalledTimes(1));
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_saved', { taskId: 7 });
  });

  it('dismissed → emits study_note_dismissed and closes', async () => {
    const session = fakeSession();
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByLabelText('학습장 배경'));
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_dismissed', { taskId: 7 });
    expect(session.closeSheet).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when sheet is null', async () => {
    await render(<SheetHost state={snap(null)} session={fakeSession()} />);
    expect(screen.queryByText(/학습장/)).toBeNull();
  });

  it('remounts the form when taskId changes and saves against the new task', async () => {
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    expect(mockFetchNote).toHaveBeenCalledWith(7);
    await rerender(<SheetHost state={snap({ taskId: 8, mode: 'self', title: 't' })} session={session} />);
    await waitFor(() => expect(mockFetchNote).toHaveBeenCalledWith(8));
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(session.closeSheet).toHaveBeenCalledTimes(1));
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_saved', { taskId: 8 });
  });

  it('double backdrop press emits once', async () => {
    const session = fakeSession();
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByLabelText('학습장 배경'));
    await fireEvent.press(screen.getByLabelText('학습장 배경'));
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.closeSheet).toHaveBeenCalledTimes(1);
  });

  it('dismiss during pending save emits once', async () => {
    let release!: () => void;
    mockRegister.mockImplementationOnce(() => new Promise<void>((r) => (release = r)));
    const session = fakeSession();
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByText('거의'));
    const savePress = fireEvent.press(screen.getByText('저장'));
    findModal().props.onRequestClose(); // 저장 act가 끝나기 전이라 fireEvent를 겹쳐 쓰지 않는다
    release();
    await savePress;
    await new Promise((r) => setTimeout(r, 20));
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_dismissed', { taskId: 7 });
    expect(session.closeSheet).toHaveBeenCalledTimes(1);
  });

  it('Android back (onRequestClose) dismisses once', async () => {
    const session = fakeSession();
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    const node = findModal();
    await act(async () => node.props.onRequestClose());
    await act(async () => node.props.onRequestClose());
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_dismissed', { taskId: 7 });
    expect(session.closeSheet).toHaveBeenCalledTimes(1);
  });
});
