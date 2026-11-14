import type { FlatList, LayoutChangeEvent } from 'react-native';
import { centerListItem } from '../src/kit/canvas/centerListItem';

const layout = (width: number) => ({ nativeEvent: { layout: { width, height: 500, x: 0, y: 0 } } }) as LayoutChangeEvent;
const listRef = () => ({ current: { scrollToOffset: jest.fn() } as unknown as FlatList });

describe('centerListItem', () => {
  it('scrolls so the current card sits in the middle of the list, without animation', () => {
    const ref = listRef();
    // 카드 380 + 간격 16, 목록 폭 1000 → 5번째 카드 왼쪽 = 396*4 = 1584, 가운데 맞춤 여백 = (1000-380)/2 = 310
    centerListItem(ref, 4, 380, 16).onLayout(layout(1000));
    expect(ref.current!.scrollToOffset).toHaveBeenCalledWith({ offset: 1274, animated: false });
  });

  it('stays at the start when the current card is too near the start to be centered', () => {
    const ref = listRef();
    centerListItem(ref, 0, 380, 16).onLayout(layout(1000));
    expect(ref.current!.scrollToOffset).toHaveBeenCalledWith({ offset: 0, animated: false });
  });

  it('does not scroll when there is no current problem', () => {
    const ref = listRef();
    centerListItem(ref, -1, 380, 16).onLayout(layout(1000));
    expect(ref.current!.scrollToOffset).not.toHaveBeenCalled();
  });

  it('tells the list where each fixed-width card is, so cards not drawn yet can be scrolled to', () => {
    expect(centerListItem(listRef(), 0, 380, 16).getItemLayout(null, 3)).toEqual({ length: 396, offset: 1188, index: 3 });
  });
});
