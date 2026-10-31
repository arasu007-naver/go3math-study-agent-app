import type { ExpoConfig } from 'expo/config';

// 명세서 §3.3.2. 비밀값은 process.env / EAS 환경변수로만 주입한다.
// v0.4.4: 아이콘은 기존 앱 AppIcon 1024.png 그대로(Android도 기존처럼 비-adaptive 아이콘). 표시 이름 'Go3 Math'. TODO: 스플래시 교체.
const config: ExpoConfig = {
  name: 'Go3 Math', // 홈 화면 표시 이름(iOS CFBundleDisplayName · Android app_name)
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
    appleTeamId: '6TW3Y4L9SX', // 기존 앱과 같은 팀(공개 식별자)
    supportsTablet: true,
  },
  android: {
    package: 'com.qoolla.student',
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
