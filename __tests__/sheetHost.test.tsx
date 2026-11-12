import { BackHandler } from 'react-native';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { SheetHost } from '../src/host/SheetHost';
import type { AgentSession, SessionSnapshot } from '../src/agent/session';
import { initialRouterState } from '../src/agent/commandRouter';
import { solveStore } from '../src/state/solve';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('../src/state/bootstrap', () => ({ apolloClient: {} }));

// gorhom 모달: 내용을 그리고, present·dismiss·onDismiss를 잡는다. dismiss는 실제처럼 onDismiss를 부른다.
const mockPresent = jest.fn();
const mockDismiss = jest.fn();
// defer = true면 실제 gorhom처럼 닫힘 애니메이션이 끝날 때까지 onDismiss를 미룬다(finishClose로 끝낸다)
const mockModal: { props: any; defer: boolean; pending: (() => void) | null } = { props: null, defer: false, pending: null };
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { TextInput, ScrollView } = require('react-native');
  return {
    BottomSheetModal: React.forwardRef((props: any, ref: any) => {
      mockModal.props = props;
      React.useImperativeHandle(ref, () => ({
        present: mockPresent,
        dismiss: () => {
          mockDismiss();
          if (mockModal.defer) mockModal.pending = () => mockModal.props.onDismiss?.();
          else mockModal.props.onDismiss?.();
        },
      }));
      return props.children;
    }),
    BottomSheetView: ({ children }: any) => children,
    BottomSheetScrollView: ScrollView,
    BottomSheetTextInput: TextInput,
  };
});
const finishClose = () =>
  act(async () => {
    const p = mockModal.pending;
    mockModal.pending = null;
    p?.();
  });

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

const dragDown = () => act(async () => mockModal.props.onDismiss());

beforeEach(() => {
  jest.clearAllMocks();
  mockModal.props = null;
  mockModal.defer = false;
  mockModal.pending = null;
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
    expect(mockPresent).not.toHaveBeenCalled();
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

describe('SheetHost as a bottom sheet (Gate B Q5)', () => {
  it('presents once when a sheet appears, and not again for a new taskId', async () => {
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    expect(mockPresent).toHaveBeenCalledTimes(1);
    await rerender(<SheetHost state={snap({ taskId: 8, mode: 'self', title: 't' })} session={session} />);
    await waitFor(() => expect(mockFetchNote).toHaveBeenCalledWith(8));
    expect(mockPresent).toHaveBeenCalledTimes(1);
  });

  it('has no backdrop or scrim, sizes to content up to 90%, and keeps the keyboard behaviour', async () => {
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={fakeSession()} />);
    await screen.findByText('학습장 · t');
    const p = mockModal.props;
    expect(p.backdropComponent).toBeUndefined();
    expect(p.enableDynamicSizing).toBe(true);
    const { height } = require('react-native').Dimensions.get('window');
    expect(p.maxDynamicContentSize).toBeCloseTo(height * 0.9);
    expect(p.keyboardBehavior).toBe('interactive');
    expect(p.keyboardBlurBehavior).toBe('restore');
    expect(p.android_keyboardInputMode).toBe('adjustResize');
    expect(screen.queryByLabelText('닫기')).toBeNull();
  });

  it('drag down → study_note_dismissed once and closes, even if it fires twice', async () => {
    const session = fakeSession();
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    await dragDown();
    await dragDown();
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_dismissed', { taskId: 7 });
    expect(session.closeSheet).toHaveBeenCalledTimes(1);
  });

  it('save, then the session closes the sheet → only study_note_saved', async () => {
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(session.closeSheet).toHaveBeenCalledTimes(1));
    await rerender(<SheetHost state={snap(null)} session={session} />);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_saved', { taskId: 7 });
  });

  it('session closes the sheet without a widget finish → nothing emitted', async () => {
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    await rerender(<SheetHost state={snap(null)} session={session} />);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(session.emit).not.toHaveBeenCalled();
    expect(session.closeSheet).not.toHaveBeenCalled();
  });

  it('dismiss during pending save emits once', async () => {
    let release!: () => void;
    mockRegister.mockImplementationOnce(() => new Promise<void>((r) => (release = r)));
    const session = fakeSession();
    await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByText('거의'));
    const savePress = fireEvent.press(screen.getByText('저장'));
    mockModal.props.onDismiss(); // 저장 act가 끝나기 전이라 act를 겹쳐 쓰지 않는다
    release();
    await savePress;
    await new Promise((r) => setTimeout(r, 20));
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_dismissed', { taskId: 7 });
    expect(session.closeSheet).toHaveBeenCalledTimes(1);
  });

  it('session closes and reopens before the close animation ends → presents again and the new sheet works', async () => {
    mockModal.defer = true;
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    await rerender(<SheetHost state={snap(null)} session={session} />);
    await rerender(<SheetHost state={snap({ taskId: 8, mode: 'self', title: 'u' })} session={session} />);
    await finishClose();
    expect(mockPresent).toHaveBeenCalledTimes(2);
    expect(await screen.findByText('학습장 · u')).toBeTruthy();
    expect(session.emit).not.toHaveBeenCalled();
  });

  it('reopened sheet for the same taskId after a save can be saved again', async () => {
    mockModal.defer = true;
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(session.closeSheet).toHaveBeenCalledTimes(1));
    await rerender(<SheetHost state={snap(null)} session={session} />);
    await rerender(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await finishClose();
    expect(mockPresent).toHaveBeenCalledTimes(2);
    await screen.findByText('학습장 · t');
    await fireEvent.press(screen.getByText('나중에'));
    expect(session.emit).toHaveBeenCalledTimes(2);
    expect(session.emit).toHaveBeenLastCalledWith('study_note_dismissed', { taskId: 7 });
  });

  it('Android back closes the open sheet once and is released when the sheet goes', async () => {
    const remove = jest.fn();
    let onBack: (() => boolean) | undefined;
    const add = jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_e, h) => {
      onBack = h as () => boolean;
      return { remove };
    });
    const session = fakeSession();
    const { rerender } = await render(<SheetHost state={snap({ taskId: 7, mode: 'self', title: 't' })} session={session} />);
    await screen.findByText('학습장 · t');
    expect(add).toHaveBeenCalledWith('hardwareBackPress', expect.any(Function));
    let consumed = false;
    await act(async () => {
      consumed = onBack!();
    });
    expect(consumed).toBe(true);
    expect(mockDismiss).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledTimes(1);
    expect(session.emit).toHaveBeenCalledWith('study_note_dismissed', { taskId: 7 });
    await rerender(<SheetHost state={snap(null)} session={session} />);
    await waitFor(() => expect(remove).toHaveBeenCalled());
    add.mockRestore();
  });
});
