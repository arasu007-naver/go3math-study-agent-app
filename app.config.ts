import type { ExpoConfig } from 'expo/config';

// 명세서 §3.3.2. 비밀값은 process.env / EAS 환경변수로만 주입한다.
// v0.4.4: 아이콘은 기존 앱 AppIcon 1024.png 그대로(Android도 기존처럼 비-adaptive 아이콘). 표시 이름 'Go3 Math', 스플래시 로고는 기존 assets/bootsplash/logo@4x.png.
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
    usesAppleSignIn: true, // Sign in with Apple entitlement(기존 앱과 같음)
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
    'expo-apple-authentication',
    // 소셜 로그인 SDK — 기존 앱(qoolla-student-app)과 같은 앱 키·URL 스킴(공개 식별자)
    ['@react-native-seoul/kakao-login', { kakaoAppKey: 'c1097c6dc3f50d32de009614c4d7071a' }],
    './plugins/withKakaoMavenRepo', // Kakao SDK 저장소를 jitpack보다 앞에(jitpack 401로 빌드 실패 방지)
    ['@react-native-seoul/naver-login', { urlScheme: 'com.qoolla.student' }],
    ['@react-native-google-signin/google-signin', { iosUrlScheme: 'com.googleusercontent.apps.121794604621-3pqp7qd3tea1mpvhlo1ma4vd34r11r55' }],
    // 태블릿 launch screen 로고: iPad 3배(300pt). Android 태블릿은 SplashScreen 원형 마스크(지름 192dp) 때문에 흰 바탕만 두고
    // 3배(300dp) 로고는 앱의 TabletLaunchOverlay가 그린다.
    // expo-splash-screen보다 앞에 둬야 그 결과를 덮어쓴다(plugins/withTabletSplash.js 주석 참고).
    [
      './plugins/withTabletSplash',
      { image: './assets/images/splash-icon.png', iosTabletWidth: 300, backgroundColor: '#ffffff' },
    ],
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 100, // 기존 BootSplash 로고 100×86pt, 흰 바탕 가운데
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
        ios: { tabletImage: './assets/images/splash-icon.png' },
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
