import type { ExpoConfig } from 'expo/config';

const CAMERA_PERMISSION = '문제 풀이를 사진으로 찍어 올리기 위해 카메라를 사용합니다.';

// Google AdMob — 기존 앱(qoolla-student-app app.json)과 같은 앱 ID·SKAdNetwork 목록
const ADMOB_SK_AD_NETWORK_ITEMS = [
  'cstr6suwn9.skadnetwork', '4fzdc2evr5.skadnetwork', '4pfyvq9l8r.skadnetwork', '2fnua5tdw4.skadnetwork',
  'ydx93a7ass.skadnetwork', '5a6flpkh64.skadnetwork', 'p78axxw29g.skadnetwork', 'v72qych5uu.skadnetwork',
  'ludvb6z3bs.skadnetwork', 'cp8zw746q7.skadnetwork', 'c6k4g5qg8m.skadnetwork', 's39g8k73mm.skadnetwork',
  '3qy4746246.skadnetwork', '3sh42y64q3.skadnetwork', 'f38h382jlk.skadnetwork', 'hs6bdukanm.skadnetwork',
  'prcb7njmu6.skadnetwork', 'v4nxqhlyqp.skadnetwork', 'wzmmz9fp6w.skadnetwork', 'yclnxrl5pm.skadnetwork',
  't38b2kh725.skadnetwork', '7ug5zh24hu.skadnetwork', '9rd848q2bz.skadnetwork', 'y5ghdn5j9k.skadnetwork',
  'n6fk4nfna4.skadnetwork', 'v9wttpbfk9.skadnetwork', 'n38lu8286q.skadnetwork', '47vhws6wlr.skadnetwork',
  'kbd757ywx3.skadnetwork', '9t245vhmpl.skadnetwork', 'a2p9lx4jpn.skadnetwork', '22mmun2rn5.skadnetwork',
  '4468km3ulz.skadnetwork', '2u9pt9hc89.skadnetwork', '8s468mfl3y.skadnetwork', 'av6w8kgt66.skadnetwork',
  'klf5c3l5u5.skadnetwork', 'ppxm28t8ap.skadnetwork', '424m5254lk.skadnetwork', 'ecpz2srf59.skadnetwork',
  'uw77j35x4d.skadnetwork', 'mlmmfzh3r3.skadnetwork', '578prtvx9j.skadnetwork', '4dzt52r2t5.skadnetwork',
  'gta9lk7p23.skadnetwork', 'e5fvkxwrpn.skadnetwork', '8c4e2ghe7u.skadnetwork', 'zq492l623r.skadnetwork',
  '3rd42ekr43.skadnetwork', '3qcr597p9d.skadnetwork',
];

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
    './plugins/withIosSceneLifecycle', // iOS 27 런타임 필수: UIScene 수명주기 채택(SDK 58 이상으로 올리면 제거)
    // 소셜 로그인 SDK — 기존 앱(qoolla-student-app)과 같은 앱 키·URL 스킴(공개 식별자)
    ['@react-native-seoul/kakao-login', { kakaoAppKey: 'c1097c6dc3f50d32de009614c4d7071a' }],
    './plugins/withKakaoMavenRepo', // Kakao SDK 저장소를 jitpack보다 앞에(jitpack 401로 빌드 실패 방지)
    ['@react-native-seoul/naver-login', { urlScheme: 'com.qoolla.student' }],
    ['@react-native-google-signin/google-signin', { iosUrlScheme: 'com.googleusercontent.apps.121794604621-3pqp7qd3tea1mpvhlo1ma4vd34r11r55' }],
    // 하단 배너 광고(src/ui/AdSlot) — 앱 ID는 위 ADMOB_SK_AD_NETWORK_ITEMS와 함께 기존 앱 값
    [
      'react-native-google-mobile-ads',
      { androidAppId: 'ca-app-pub-2632164502661597~7978681227', iosAppId: 'ca-app-pub-2632164502661597~2534782857', skAdNetworkItems: ADMOB_SK_AD_NETWORK_ITEMS },
    ],
    // 폰 결과 화면 문제별 카메라 버튼 — 풀이를 문서 스캔(가장자리 인식·자동 자르기)으로 찍어 올린다(기존 앱 책갈피 '새 풀이'와 같은 플러그인)
    ['react-native-document-scanner-plugin', { cameraPermission: CAMERA_PERMISSION }],
    // 내 정보 '프로필 이미지 변경' — 사진 보관함에서 고르기만 한다(마이크 권한 불필요).
    // 카메라 문구는 스캐너와 같게 둔다(false면 이 플러그인이 카메라 권한 문구를 지우고 Android 카메라 권한을 막는다)
    ['expo-image-picker', { photosPermission: '프로필 이미지로 쓸 사진을 고르기 위해 사진 보관함에 접근합니다.', cameraPermission: CAMERA_PERMISSION, microphonePermission: false }],
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
