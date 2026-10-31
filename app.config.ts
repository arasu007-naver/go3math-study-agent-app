import type { ExpoConfig } from 'expo/config';

// 명세서 §3.3.2. 비밀값은 process.env / EAS 환경변수로만 주입한다.
// TODO(v0.4.4): 아이콘·스플래시·표시 이름은 기존 앱 자산으로 교체 (현재는 Expo 템플릿 자산).
const config: ExpoConfig = {
  name: 'Qoolla',
  slug: 'go3-math-brand-new-error',
  owner: 'arasu0070',
  version: '3.0.0',
  runtimeVersion: { policy: 'appVersion' },
  scheme: 'com.qoolla.student',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  // orientation 미지정(v0.4.3): 앱 전역 방향 고정 없음
  ios: {
    bundleIdentifier: 'com.qoolla.student',
    supportsTablet: true,
  },
  android: {
    package: 'com.qoolla.student',
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: { projectId: '78d46e15-5334-4ee4-bc65-f2dcff60c7ff' },
    agentUrl: process.env.EXPO_PUBLIC_AGENT_URL,
  },
};

export default config;
