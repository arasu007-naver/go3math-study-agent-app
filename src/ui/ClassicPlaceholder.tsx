import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, type } from './theme';

// 비에이전트(classic) 화면 자리. 실제 화면은 M10 기능 동등성 단계에서 구현한다.
export function ClassicPlaceholder({ title }: { title: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ padding: 24, gap: 8 }}>
        <Text style={{ ...type.heading, color: colors.text }}>{title}</Text>
        <Text style={{ ...type.body, color: colors.muted }}>M10(기능 동등성)에서 구현 예정</Text>
      </View>
    </SafeAreaView>
  );
}
