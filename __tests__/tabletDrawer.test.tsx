import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { initialRouterState } from '../src/agent/commandRouter';
import type { SessionSnapshot } from '../src/agent/session';
import { TabletAgentLayer } from '../src/agent/TabletAgentLayer';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('../src/state/bootstrap', () => ({ apolloClient: { query: jest.fn(() => new Promise(() => {})) } }));
jest.mock('../src/host/widgets', () => ({ topicFetchers: {} }));
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('react-native-blob-util', () => ({}));

const session = { emit: jest.fn(), selectChoice: jest.fn(), dismissInstruction: jest.fn() } as any;
const base: SessionSnapshot = { ...initialRouterState, connected: true };
const say = (messageId: string) => ({ messageId, text: '안내', choices: [], source: 'default' as const });
const chatOpen = () => screen.queryByLabelText('Study Log dock') !== null;

describe('TabletAgentLayer dock', () => {
  it('closes the dock with its edge button', async () => {
    await render(<TabletAgentLayer state={base} session={session} />);
    expect(screen.getByLabelText('Study dock')).toBeTruthy(); // 홈 진입 시 타임라인 dock
    await fireEvent.press(screen.getByLabelText('Study dock 닫기'));
    expect(screen.queryByLabelText('Study dock')).toBeNull();
  });

  it('opens the chat as a dock from the toolbar chat button, replacing the open dock', async () => {
    await render(<TabletAgentLayer state={base} session={session} />);
    expect(chatOpen()).toBe(false);
    await fireEvent.press(screen.getByLabelText('채팅'));
    expect(chatOpen()).toBe(true);
    expect(screen.queryByLabelText('Study dock')).toBeNull();

    await fireEvent.press(screen.getByLabelText('채팅')); // 다시 누르면 닫힘
    expect(chatOpen()).toBe(false);
  });

  it('shows a toast instead of opening the chat while another dock is open', async () => {
    const r = await render(<TabletAgentLayer state={base} session={session} />);
    await act(async () => r.rerender(<TabletAgentLayer state={{ ...base, instruction: say('m1') as any }} session={session} />));
    expect(chatOpen()).toBe(false);
    await fireEvent.press(screen.getByLabelText('에이전트 열기'));
    expect(chatOpen()).toBe(true);
  });
});

describe('TabletAgentLayer chat and problem lists', () => {
  it('closes the chat whenever the agent shows a problem list, even if one was already shown', async () => {
    const r = await render(<TabletAgentLayer state={base} session={session} />);
    await fireEvent.press(screen.getByLabelText('Study dock 닫기'));

    // 1) 안내 → 문제 목록 (mock 에이전트 순서)
    let s: SessionSnapshot = { ...base, instruction: say('m1') as any };
    await act(async () => r.rerender(<TabletAgentLayer state={s} session={session} />));
    expect(chatOpen()).toBe(true);
    s = { ...s, stage: { componentId: 'problem_list', props: { source: { kind: 'task', taskId: 1 } } } };
    await act(async () => r.rerender(<TabletAgentLayer state={s} session={session} />));
    expect(chatOpen()).toBe(false);

    // 2) 문제 목록이 떠 있는 채로 채팅을 다시 열고 다른 기록의 '가자' → 같은 problem_list가 새 props로
    await fireEvent.press(screen.getByLabelText('채팅'));
    expect(chatOpen()).toBe(true);
    s = { ...s, instruction: say('m2') as any };
    await act(async () => r.rerender(<TabletAgentLayer state={s} session={session} />));
    s = { ...s, stage: { componentId: 'problem_list', props: { source: { kind: 'task', taskId: 2 } } } };
    await act(async () => r.rerender(<TabletAgentLayer state={s} session={session} />));
    expect(chatOpen()).toBe(false);
  });
});
