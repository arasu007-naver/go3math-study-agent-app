import { StyleSheet } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { colors, layout, radius } from '../src/ui/theme';

const mockClose = jest.fn();
jest.mock('@gorhom/bottom-sheet', () => ({ useBottomSheet: () => ({ close: mockClose }) }));

import { SheetHandle } from '../src/ui/SheetHandle';

describe('SheetHandle', () => {
  it('has a gray 480×18 pill grip bar under the close button and no top line', async () => {
    await render(<SheetHandle {...({} as any)} />);
    const gripBox = screen.getByTestId('sheet-handle-grip');
    const grip = gripBox.children[0] as any;
    expect(StyleSheet.flatten(grip.props.style)).toMatchObject({ width: 480, maxWidth: '100%', height: 18, borderRadius: radius.pill, backgroundColor: colors.lineStrong });
    // 좁은 화면에서는 gutter 안쪽 폭까지만
    expect(StyleSheet.flatten(gripBox.props.style)).toMatchObject({ position: 'absolute', left: layout.gutter, right: layout.gutter });
    // 막대가 버튼보다 먼저 그려진다 = 버튼 아래에 깔린다. 터치는 막지 않아 끌기가 손잡이 영역으로 넘어간다
    const siblings = gripBox.parent!.children as any[];
    // 손잡이 영역에는 막대와 버튼만 있다(위쪽 가로선 없음)
    expect(siblings).toHaveLength(2);
    expect(siblings.indexOf(gripBox)).toBeLessThan(siblings.indexOf(screen.getByRole('button', { name: '닫기' })));
    expect(gripBox.props.pointerEvents).toBe('none');
  });

  it('the button still closes the sheet', async () => {
    await render(<SheetHandle {...({} as any)} />);
    await fireEvent.press(screen.getByRole('button', { name: '닫기' }));
    expect(mockClose).toHaveBeenCalledTimes(1);
  });
});
