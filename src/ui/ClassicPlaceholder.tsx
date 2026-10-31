import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';

// 비에이전트(classic) 화면 자리. 실제 화면은 M10 기능 동등성 단계에서 구현한다.
export function ClassicPlaceholder({ title }: { title: string }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ground }}>
      <View style={{ padding: 24, gap: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text }}>{title}</Text>
        <Text style={{ fontSize: 14, color: colors.muted }}>M10(기능 동등성)에서 구현 예정</Text>
      </View>
    </SafeAreaView>
  );
}
