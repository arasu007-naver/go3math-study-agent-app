/**
 * 태블릿 launch screen 로고 크기 키우기 (expo-splash-screen 보완).
 * app.config의 plugins에서 'expo-splash-screen'보다 앞에 둔다 — 나중에 등록된 mod가 먼저 실행되므로
 * 이 플러그인의 파일 쓰기가 expo-splash-screen이 만든 결과를 덮어쓴다.
 *
 * - iOS: expo-splash-screen의 `ios.tabletImage`가 iPad용 이미지(tablet_image*)를 imageset에 넣는다.
 *   SplashScreen.storyboard의 이미지 뷰는 크기 제약 없이 이미지의 고유 크기(pt)를 쓰므로,
 *   iPad 이미지만 `iosTabletWidth` pt로 다시 만들면 iPad에서만 그 크기로 보인다.
 * - Android: Android 12+ SplashScreen은 288dp 캔버스를 지름 192dp 원으로 잘라 보여 주므로 태블릿용 큰 로고(300dp)를
 *   그릴 수 없다. 짧은 변 600dp 이상(drawable-sw600dp-*)에는 흰 바탕만 두고, 로고는 앱의 TabletLaunchOverlay가 그린다.
 */
const fs = require('fs');
const path = require('path');
const { withDangerousMod, IOSConfig } = require('expo/config-plugins');
const { generateImageAsync, generateImageBackgroundAsync } = require('@expo/image-utils');

const CACHE = 'tablet-splash';
const ANDROID_DENSITIES = { mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 };
const ANDROID_CANVAS_DP = 288;

async function squareImage(projectRoot, src, size) {
  const { source } = await generateImageAsync({ projectRoot, cacheType: CACHE }, { src, width: size, height: size, resizeMode: 'contain' });
  return source;
}

const withTabletSplash = (config, { image, iosTabletWidth, backgroundColor = '#ffffff' }) => {
  config = withDangerousMod(config, [
    'ios',
    async (config) => {
      const { projectRoot } = config.modRequest;
      const imageset = path.join(IOSConfig.Paths.getSourceRoot(projectRoot), 'Images.xcassets/SplashScreenLogo.imageset');
      for (const [scale, suffix] of [[1, ''], [2, '@2x'], [3, '@3x']]) {
        const file = path.join(imageset, `tablet_image${suffix}.png`);
        if (!fs.existsSync(file)) continue;
        await fs.promises.writeFile(file, await squareImage(projectRoot, image, iosTabletWidth * scale));
      }
      return config;
    },
  ]);

  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const { platformProjectRoot } = config.modRequest;
      for (const [density, m] of Object.entries(ANDROID_DENSITIES)) {
        const canvas = ANDROID_CANVAS_DP * m;
        const blank = await generateImageBackgroundAsync({ width: canvas, height: canvas, backgroundColor, resizeMode: 'cover' });
        const dir = path.join(platformProjectRoot, `app/src/main/res/drawable-sw600dp-${density}`);
        await fs.promises.mkdir(dir, { recursive: true });
        await fs.promises.writeFile(path.join(dir, 'splashscreen_logo.png'), blank);
      }
      return config;
    },
  ]);

  return config;
};

module.exports = withTabletSplash;
