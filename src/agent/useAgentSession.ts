import { useSyncExternalStore } from 'react';
import { Dimensions, Platform } from 'react-native';
import Constants from 'expo-constants';
import { AgentSession } from './session';
import { MockAgentTransport, WebSocketTransport } from './mockAgent';
import { initialMode, nextMode, type DeviceMode } from '../layout/deviceMode';

// 세션은 앱 전역 싱글톤(화면 컴포넌트 밖)이다.
// TODO(M1): 오프라인 큐 저장소를 MMKV(`agent:` 접두사 키)로 교체 — 개발 빌드 필요. 지금은 메모리 저장소.
let session: AgentSession | undefined;
let lastMode: DeviceMode | undefined;

export function getAgentSession(): AgentSession {
  if (!session) {
    const url = Constants.expoConfig?.extra?.agentUrl as string | undefined;
    session = new AgentSession({
      transport: url ? new WebSocketTransport(url) : new MockAgentTransport(),
      appVersion: Constants.expoConfig?.version ?? '0.0.0',
      device: () => {
        const { width, height } = Dimensions.get('window');
        lastMode = lastMode ? nextMode(lastMode, width, height) : initialMode(width, height);
        return { mode: lastMode, width, height, os: Platform.OS };
      },
    });
    session.start();
  }
  return session;
}

export function useAgentSession() {
  const s = getAgentSession();
  const state = useSyncExternalStore(s.subscribe, s.getSnapshot, s.getSnapshot);
  return { session: s, state };
}
