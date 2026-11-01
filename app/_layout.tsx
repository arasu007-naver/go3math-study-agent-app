import { ApolloProvider } from '@apollo/client/react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import GlobalLoadingOverlay from '@/src/kit/ui/loading-view/global-overlay';
import { apolloClient, bootstrap } from '@/src/state/bootstrap';

bootstrap();

export default function RootLayout() {
  return (
    <ApolloProvider client={apolloClient}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }} />
        <GlobalLoadingOverlay />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    </ApolloProvider>
  );
}
