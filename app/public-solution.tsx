/**
 * 공개 해답 화면(미인증) — 기존 `pages/welcome/public-solution-view.tsx`(PublicSolutionViewScreen)를 옮김.
 * public-questions의 '해답'이 넘긴 문제(sourceType, sourceId)의 해답 페이지(m-cache UNITANSWER)를 WebView로 보여 준다. 광고 래퍼(AdMob) 제외.
 */
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UNITANSWER } from '@/src/config/api.constants';
import QoollaWebView from '@/src/kit/ui/web-view';

export default function PublicSolutionViewScreen() {
  const { sourceType, sourceId } = useLocalSearchParams<{ sourceType: string; sourceId: string }>();
  return (
    <SafeAreaView style={styles.root} edges={['left', 'right', 'bottom']}>
      <Stack.Screen options={{ headerShown: true, title: '해답', headerBackTitle: '뒤로' }} />
      <QoollaWebView originWhitelist={['*']} source={{ uri: UNITANSWER(sourceType, sourceId)! }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
});
