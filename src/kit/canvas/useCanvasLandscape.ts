import { useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { MODE_DEBOUNCE_MS } from '../../layout/deviceMode';
import { LANDSCAPE_RESTRICTED } from './landscapeRestrictions';

/**
 * 캔버스 화면 루트 View 크기로 가로 여부를 판단한다(전역 방향 API 없음, design-spec P2-5). 폭 = 높이면 세로로 본다.
 * restricted는 FloatingToolbar에, noticeActive·ping은 LandscapeNotice에 넘긴다. 제한 목록이 비어 있으면 안내도 없다.
 */
export function useCanvasLandscape() {
  const [isLandscape, setIsLandscape] = useState(false);
  const [ping, setPing] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setIsLandscape(width > height), MODE_DEBOUNCE_MS);
  };

  return {
    isLandscape,
    onLayout,
    restricted: isLandscape ? LANDSCAPE_RESTRICTED : undefined,
    noticeActive: isLandscape && LANDSCAPE_RESTRICTED.size > 0,
    ping,
    onRestrictedPress: () => setPing((n) => n + 1),
  };
}
