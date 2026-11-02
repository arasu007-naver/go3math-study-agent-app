import { fireEvent, render, screen } from '@testing-library/react-native';
import { FloatingToolbar } from '../src/kit/canvas/FloatingToolbar';
import { LANDSCAPE_RESTRICTED } from '../src/kit/canvas/landscapeRestrictions';

const tools = [
  { id: 'color' as const, label: '펜 색·굵기' },
  { id: 'clearBoard' as const, label: '보드 지우기' },
  { id: 'save' as const, label: '내 풀이 저장' },
];

describe('FloatingToolbar (design-spec P2-1, P2-5)', () => {
  it('calls the tool handler with the tool id', async () => {
    const onSelectTool = jest.fn();
    await render(<FloatingToolbar mode="draw" tools={tools} onSelectTool={onSelectTool} strokeColor="orange" />);
    await fireEvent.press(screen.getByLabelText('보드 지우기'));
    expect(onSelectTool).toHaveBeenCalledWith('clearBoard');
  });

  it('keeps restricted tools visible but disabled, and pings the notice instead of running them', async () => {
    const onSelectTool = jest.fn();
    const onRestrictedPress = jest.fn();
    await render(
      <FloatingToolbar
        mode="draw"
        tools={tools}
        onSelectTool={onSelectTool}
        restricted={new Set(['clearBoard'])}
        onRestrictedPress={onRestrictedPress}
      />,
    );
    const btn = screen.getByLabelText('보드 지우기');
    expect(btn.props.accessibilityState).toMatchObject({ disabled: true });
    await fireEvent.press(btn);
    expect(onSelectTool).not.toHaveBeenCalled();
    expect(onRestrictedPress).toHaveBeenCalledTimes(1);
  });

  it('ships with no landscape restrictions until the user decides the list (§10-1)', () => {
    expect(LANDSCAPE_RESTRICTED.size).toBe(0);
  });
});
