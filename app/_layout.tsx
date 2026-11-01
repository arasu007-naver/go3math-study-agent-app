import { ApolloProvider } from '@apollo/client/react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GlobalLoadingOverlay from '@/src/kit/ui/loading-view/global-overlay';
import { apolloClient, bootstrap } from '@/src/state/bootstrap';

bootstrap();

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        {/* 옮겨 온 note-canvas 패널이 react-native-paper의 Portal·Modal을, 풀이 화면 하단 버튼이 bottom-sheet 모달을 쓴다 */}
        <GestureHandlerRootView style={{ flex: 1 }}>
          <PaperProvider>
            <BottomSheetModalProvider>
              <Stack screenOptions={{ headerShown: false }} />
              <GlobalLoadingOverlay />
              <StatusBar style="dark" />
            </BottomSheetModalProvider>
          </PaperProvider>
        </GestureHandlerRootView>
      </SafeAreaProvider>
    </ApolloProvider>
  );
}
