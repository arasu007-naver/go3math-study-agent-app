import type { RefObject } from 'react';
import type { FlatList, LayoutChangeEvent } from 'react-native';

/**
 * 캔버스 '목록' 모달의 가로 FlatList에 펼쳐 넣는 props — 열릴 때(목록이 배치될 때) 현재 문제 카드가 목록 가운데에 오게 한다.
 * 모달은 열 때마다 목록을 새로 올리므로 열 때마다 맞춰진다. 애니메이션 없이 그 자리에서 연다.
 * 카드 폭이 고정이라 getItemLayout으로 위치를 알려 준다(아직 안 그린 카드로도 스크롤된다). 처음 쪽은 0에서, 끝 쪽은 네이티브가 끝에서 멈춘다.
 * index가 -1(현재 문제 없음)이면 스크롤하지 않는다.
 */
export function centerListItem(ref: RefObject<FlatList | null>, index: number, itemWidth: number, gap: number) {
  const length = itemWidth + gap;
  return {
    ref,
    testID: 'canvas-sheet-list',
    getItemLayout: (_: unknown, i: number) => ({ length, offset: length * i, index: i }),
    onLayout: (e: LayoutChangeEvent) => {
      if (index < 0) return;
      const offset = Math.max(0, length * index - (e.nativeEvent.layout.width - itemWidth) / 2);
      ref.current?.scrollToOffset({ offset, animated: false });
    },
  };
}
