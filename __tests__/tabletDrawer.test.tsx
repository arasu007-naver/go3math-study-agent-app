import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { initialRouterState } from '../src/agent/commandRouter';
import type { SessionSnapshot } from '../src/agent/session';
import { TabletAgentLayer } from '../src/agent/TabletAgentLayer';

jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('../src/state/bootstrap', () => ({ apolloClient: { query: jest.fn(() => new Promise(() => {})) } }));
jest.mock('../src/host/widgets', () => ({ topicFetchers: {} }));
jest.mock('react-native-webview', () => ({ WebView: () => null }));

const session = { emit: jest.fn(), selectChoice: jest.fn(), dismissInstruction: jest.fn() } as any;
const base: SessionSnapshot = { ...initialRouterState, connected: true };
const say = (messageId: string) => ({ messageId, text: '안내', choices: [], source: 'default' as const });
const drawerOpen = () => screen.getByLabelText('에이전트 drawer').props.pointerEvents === 'auto';

describe('TabletAgentLayer drawer and problem lists', () => {
  it('closes the drawer whenever the agent shows a problem list, even if one was already shown', async () => {
    const r = await render(<TabletAgentLayer state={base} session={session} />);
    expect(drawerOpen()).toBe(true); // 홈 진입

    // 1) 안내 → 문제 목록 (mock 에이전트 순서)
    let s: SessionSnapshot = { ...base, instruction: say('m1') as any };
    await act(async () => r.rerender(<TabletAgentLayer state={s} session={session} />));
    s = { ...s, stage: { componentId: 'problem_list', props: { source: { kind: 'task', taskId: 1 } } } };
    await act(async () => r.rerender(<TabletAgentLayer state={s} session={session} />));
    expect(drawerOpen()).toBe(false);

    // 2) 문제 목록이 떠 있는 채로 drawer를 다시 열고 다른 기록의 '가자' → 같은 problem_list가 새 props로
    await fireEvent.press(screen.getByLabelText('에이전트 drawer 열기'));
    expect(drawerOpen()).toBe(true);
    s = { ...s, instruction: say('m2') as any };
    await act(async () => r.rerender(<TabletAgentLayer state={s} session={session} />));
    s = { ...s, stage: { componentId: 'problem_list', props: { source: { kind: 'task', taskId: 2 } } } };
    await act(async () => r.rerender(<TabletAgentLayer state={s} session={session} />));
    expect(drawerOpen()).toBe(false);
  });
});
