import { useEffect, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';

// 명세서 §4.7.1 (v0.4.2 결정): 짧은 변 기준, 진입 600 / 이탈 560, 200ms 디바운스.
export type DeviceMode = 'phone' | 'tablet';

export const TABLET_ENTER = 600;
export const TABLET_EXIT = 560;
export const MODE_DEBOUNCE_MS = 200;
export const FOLD_DRAWER_MAX_RATIO = 0.4;

/** 앱 시작 시 1회: 히스테리시스 없이 600 기준 */
export function initialMode(width: number, height: number): DeviceMode {
  return Math.min(width, height) >= TABLET_ENTER ? 'tablet' : 'phone';
}

/** 560~599 구간은 직전 모드 유지 */
export function nextMode(prev: DeviceMode, width: number, height: number): DeviceMode {
  const short = Math.min(width, height);
  if (prev === 'phone') return short >= TABLET_ENTER ? 'tablet' : 'phone';
  return short < TABLET_EXIT ? 'phone' : 'tablet';
}

/** drawer 폭: 화면 폭 36%(280~420), 펼친 폴더블(거의 정사각형)은 최대 40% */
export function drawerWidth(width: number, height: number): number {
  const base = Math.min(420, Math.max(280, width * 0.36));
  const nearSquare = Math.max(width, height) / Math.min(width, height) < 1.3;
  return nearSquare ? Math.min(base, width * FOLD_DRAWER_MAX_RATIO) : base;
}

export function useDeviceMode(): DeviceMode {
  const { width, height } = useWindowDimensions();
  const [mode, setMode] = useState<DeviceMode>(() => initialMode(width, height));
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMode((prev) => nextMode(prev, width, height)), MODE_DEBOUNCE_MS);
    return () => clearTimeout(timer.current);
  }, [width, height]);

  return mode;
}
