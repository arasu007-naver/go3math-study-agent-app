import { Dimensions, StyleSheet } from 'react-native';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
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

// RN Modal 목: 마지막 props를 잡고, visible=false면 내용을 그리지 않는다(실제 Modal과 같다)
const mockModalProps: { current: any } = { current: null };
jest.mock('react-native/Libraries/Modal/Modal', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: (props: any) => {
      mockModalProps.current = props;
      return props.visible === false ? null : React.createElement(View, null, props.children);
    },
  };
});
const modal = () => ({ props: mockModalProps.current });
const modals = (): any[] => (mockModalProps.current?.visible ? [modal()] : []);
const back = () => act(async () => modal().props.onRequestClose());

beforeEach(() => {
  jest.clearAllMocks();
  mockModalProps.current = null;
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

  it('renders nothing when sheet is null', async () => {
    await render(<SheetHost state={snap(null)} session={fakeSession()} />);
    expect(screen.queryByText(/학습장/)).toBeNull();
    expect(modals().filter((m) => m.props.visible)).toHaveLength(0);
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
});

describe('SheetHost as a card modal', () => {
  const open = (extra: Record<string, unknown> = {}) => snap({ taskId: 7, mode: 'self', title: 't', ...extra });

  it('renders a visible transparent fade Modal with the card inside the keyboard avoider', async () => {
    await render(<SheetHost state={open()} session={fakeSession()} />);
    await screen.findByText('학습장 · t');
    expect(modal().props.visible).toBe(true);
    expect(modal().props.transparent).toBe(true);
    expect(modal().props.animationType).toBe('fade');
    const avoider = screen.getByTestId('sheet-keyboard-avoider');
    expect(within(avoider).getByText('학습장 · t')).toBeTruthy();
  });

  it('card width and max height follow the window', async () => {
    await render(<SheetHost state={open()} session={fakeSession()} />);
    const { width, height } = Dimensions.get('window');
    const card = screen.getByTestId('sheet-keyboard-avoider').children[0] as any;
    const st = StyleSheet.flatten(card.props.style);
    expect(st.width).toBeLessThanOrEqual(Math.min(width - 24, 560));
    expect(st.maxHeight).toBeLessThanOrEqual(height * 0.9);
  });

  it('renders no drag handle', async () => {
    await render(<SheetHost state={open()} session={fakeSession()} />);
    expect(screen.queryByLabelText('시트 핸들')).toBeNull();
  });

  it('scrim press → study_note_dismissed once and closes', async () => {
    const session = fakeSession();
    await render(<SheetHost state={open()} session={session} />);
    await fireEvent.press(screen.getByLabelText('닫기'));
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_dismissed', { taskId: 7 });
    expect(session.closeSheet).toHaveBeenCalledTimes(1);
  });

  it('onRequestClose twice → one dismissed and one closeSheet', async () => {
    const session = fakeSession();
    await render(<SheetHost state={open()} session={session} />);
    await back();
    await back();
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_dismissed', { taskId: 7 });
    expect(session.closeSheet).toHaveBeenCalledTimes(1);
  });

  it('save, then the session clears the sheet → only study_note_saved', async () => {
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={open()} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(session.closeSheet).toHaveBeenCalledTimes(1));
    await rerender(<SheetHost state={snap(null)} session={session} />);
    expect(modal().props.visible).toBe(false);
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_saved', { taskId: 7 });
  });

  it('session clears the sheet without a widget finish → nothing emitted', async () => {
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={open()} session={session} />);
    await screen.findByText('학습장 · t');
    await rerender(<SheetHost state={snap(null)} session={session} />);
    expect(session.emit).not.toHaveBeenCalled();
    expect(session.closeSheet).not.toHaveBeenCalled();
  });

  it('scrim during a pending save emits once as dismissed', async () => {
    let release!: () => void;
    mockRegister.mockImplementationOnce(() => new Promise<void>((r) => (release = r)));
    const session = fakeSession();
    await render(<SheetHost state={open()} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByText('거의'));
    const savePress = fireEvent.press(screen.getByText('저장'));
    modal().props.onRequestClose();
    release();
    await savePress;
    await new Promise((r) => setTimeout(r, 20));
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_dismissed', { taskId: 7 });
    expect(session.closeSheet).toHaveBeenCalledTimes(1);
  });

  it('close and reopen with a new sheet → new content, no events from the old widget', async () => {
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={open()} session={session} />);
    await screen.findByText('학습장 · t');
    await rerender(<SheetHost state={snap(null)} session={session} />);
    await rerender(<SheetHost state={snap({ taskId: 8, title: 'u' })} session={session} />);
    expect(await screen.findByText('학습장 · u')).toBeTruthy();
    expect(modal().props.visible).toBe(true);
    expect(session.emit).not.toHaveBeenCalled();
  });

  it('reopened sheet for the same taskId after a save can be dismissed', async () => {
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={open()} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(session.closeSheet).toHaveBeenCalledTimes(1));
    await rerender(<SheetHost state={snap(null)} session={session} />);
    await rerender(<SheetHost state={open()} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByText('나중에'));
    expect(session.emit).toHaveBeenCalledTimes(2);
    expect(session.emit).toHaveBeenLastCalledWith('study_note_dismissed', { taskId: 7 });
  });
});
