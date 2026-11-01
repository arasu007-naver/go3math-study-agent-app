import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAgentSession } from '@/src/agent/useAgentSession';
import { PhoneInstructionModal } from '@/src/agent/PhoneInstructionModal';
import { TabletAgentLayer } from '@/src/agent/TabletAgentLayer';
import { Stage } from '@/src/host/Stage';
import { useDeviceMode } from '@/src/layout/deviceMode';
import { colors } from '@/src/ui/theme';

// 에이전트 홈: Stage + 모드별 instruction 오버레이.
export default function AgentHome() {
  const { session, state } = useAgentSession();
  const mode = useDeviceMode();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={mode === 'tablet' ? ['top', 'bottom'] : ['top']}>
      <View style={{ flex: 1 }}>
        <Stage state={state} session={session} />
        {mode === 'phone' ? (
          <PhoneInstructionModal state={state} session={session} />
        ) : (
          <TabletAgentLayer state={state} session={session} />
        )}
      </View>
    </SafeAreaView>
  );
}
