import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAgentSession } from '@/src/agent/useAgentSession';
import { TabletAgentLayer } from '@/src/agent/TabletAgentLayer';
import { Stage } from '@/src/host/Stage';
import { useDeviceMode } from '@/src/layout/deviceMode';
import { colors } from '@/src/ui/theme';

// 태블릿 에이전트 홈: Stage + ChatRail·dock. 폰은 하단 탭 화면들이 맡으므로 타임라인 탭으로 보낸다.
export default function AgentHome() {
  const { session, state } = useAgentSession();
  const mode = useDeviceMode();
  if (mode === 'phone') return <Redirect href="/timeline" />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <View style={{ flex: 1 }}>
        <Stage state={state} session={session} />
        <TabletAgentLayer state={state} session={session} />
      </View>
    </SafeAreaView>
  );
}
