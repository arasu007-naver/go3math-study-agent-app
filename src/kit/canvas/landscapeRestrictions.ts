import type { ToolId } from './FloatingToolbar';

/** 캔버스 화면이 가로일 때 비활성화할 기능. 사용자 결정 대기(design-spec §10-1) — 임의로 채우지 말 것 */
export const LANDSCAPE_RESTRICTED: ReadonlySet<ToolId | 'playback' | 'snapshot'> = new Set([]);
