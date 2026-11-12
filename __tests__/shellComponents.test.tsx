import 'react-native-gesture-handler/jestSetup';
import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { InstructionCard } from '../src/agent/InstructionCard';
import { TimelineCard } from '../src/agent/tablet/ChatTimeline';
import { ChatRail, RAIL_BG, RAIL_ITEMS } from '../src/agent/tablet/ChatRail';
import { Stage } from '../src/host/Stage';
import { initialRouterState } from '../src/agent/commandRouter';
import type { AgentSession, SessionSnapshot } from '../src/agent/session';
import type { Instruction } from '../src/agent/commandRouter';
import { colors, layout } from '../src/ui/theme';

jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('../src/host/widgets', () => ({ widgets: {} }));

const bg = (name: string) => StyleSheet.flatten(screen.getByRole('button', { name }).props.style).backgroundColor;

describe('InstructionCard', () => {
  const instruction = (choices: { id: string; label: string }[]) =>
    ({ id: 'i', source: 'agent', text: '다음 문제로 갈까요?', choices }) as unknown as Instruction;

  it('first choice is primary, the rest secondary, and choices keep their ids', async () => {
    const onChoice = jest.fn();
    await render(<InstructionCard instruction={instruction([{ id: 'a', label: '풀기' }, { id: 'b', label: '나중에' }])} paused={false} onChoice={onChoice} onDismiss={() => {}} />);
    expect(bg('풀기')).toBe(colors.accent);
    expect(bg('나중에')).toBe(colors.card);
    await fireEvent.press(screen.getByRole('button', { name: '나중에' }));
    expect(onChoice).toHaveBeenCalledWith('b');
  });

  it('with no choices shows a secondary 확인 that dismisses', async () => {
    const onDismiss = jest.fn();
    await render(<InstructionCard instruction={instruction([])} paused={false} onChoice={() => {}} onDismiss={onDismiss} />);
    expect(bg('확인')).toBe(colors.card);
    await fireEvent.press(screen.getByRole('button', { name: '확인' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});

describe('TimelineCard', () => {
  it('summary cards show their label as an accent Tag', async () => {
    const session = { emit: jest.fn() } as unknown as AgentSession;
    await render(<TimelineCard item={{ id: 'd', ts: '2026-11-05T09:00:00Z', kind: 'daily_summary', title: '오늘' }} session={session} />);
    const tag = screen.getByTestId('tag');
    expect(StyleSheet.flatten(tag.props.style).backgroundColor).toBe(colors.accentSoft);
    expect(StyleSheet.flatten(screen.getByText('일간 정리').props.style).color).toBe(colors.accentText);
  });
});

describe('ChatRail', () => {
  it('only the background is translucent', () => {
    expect(RAIL_BG).toBe('rgba(255, 255, 255, 0.88)');
  });

  it('dock items are IconButtons with the same labels, state and hint', async () => {
    const onItem = jest.fn();
    await render(<ChatRail active={RAIL_ITEMS[0].kind as never} unread={false} onItem={onItem} />);
    const first = screen.getByRole('button', { name: RAIL_ITEMS[0].label });
    expect(first.props.accessibilityState).toMatchObject({ selected: true });
    expect(StyleSheet.flatten(first.props.style)).toMatchObject({ minWidth: layout.hit, backgroundColor: colors.accentSoft });
    const disabled = RAIL_ITEMS.find((it) => it.disabled);
    if (disabled) {
      const node = screen.getByRole('button', { name: disabled.label });
      expect(node.props.accessibilityState).toMatchObject({ disabled: true });
      expect(node.props.accessibilityHint).toBeTruthy();
    }
    const enabled = RAIL_ITEMS.find((it) => !it.disabled && it.kind !== RAIL_ITEMS[0].kind)!;
    await fireEvent.press(screen.getByRole('button', { name: enabled.label }));
    expect(onItem).toHaveBeenCalledWith(enabled.kind);
  });
});

describe('Stage', () => {
  const snapshot = (stage: SessionSnapshot['stage']) => ({ ...initialRouterState, connected: true, stage }) as SessionSnapshot;

  it('bookmark toggle is a 44 circle button that opens bookmarks', async () => {
    const session = { showLocalComponent: jest.fn(), restoreStage: jest.fn() } as unknown as AgentSession & { showLocalComponent: jest.Mock };
    await render(<Stage state={snapshot(null)} session={session} />);
    const toggle = screen.getByRole('button', { name: '내 책갈피' });
    expect(StyleSheet.flatten(toggle.props.style)).toMatchObject({ minWidth: layout.hit, minHeight: layout.hit });
    await fireEvent.press(toggle);
    expect(session.showLocalComponent).toHaveBeenCalledWith('problem_list', { source: { kind: 'bookmarks' } });
  });

  it('header background is the light gray behind the canvas toolbar (colors.bg)', async () => {
    const session = { showLocalComponent: jest.fn(), restoreStage: jest.fn() } as unknown as AgentSession;
    await render(<Stage state={snapshot(null)} session={session} />);
    expect(StyleSheet.flatten(screen.getByTestId('stage-header').props.style).backgroundColor).toBe(colors.bg);
    // 로고도 흰 상자가 보이지 않게 회색 바탕 판을 쓴다
    expect(screen.getAllByLabelText('Go3Math')[0].props.source).toBe(require('../assets/images/welcome/go3math-one-line-logo-gray.png'));
  });

  it('in the bookmarks view the toggle restores the stage', async () => {
    const session = { showLocalComponent: jest.fn(), restoreStage: jest.fn() } as unknown as AgentSession & { restoreStage: jest.Mock };
    await render(<Stage state={snapshot({ componentId: 'problem_list', props: { source: { kind: 'bookmarks' } } } as never)} session={session} />);
    await fireEvent.press(screen.getByRole('button', { name: '문제 목록' }));
    expect(session.restoreStage).toHaveBeenCalledTimes(1);
  });
});
