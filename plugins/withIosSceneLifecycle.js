/**
 * iOS UIScene 수명주기 채택.
 *
 * iOS 27 런타임은 scene 수명주기를 채택하지 않은 앱(Info.plist에 UIApplicationSceneManifest 없음)을
 * 실행 직후 중단시킨다. Expo가 이를 기본 채택한 것은 SDK 58부터이고(SDK 57.0.23+는 옵트인 백포트),
 * 이 앱의 SDK 54 템플릿에는 없으므로 여기서 직접 넣는다. SDK 58 이상으로 올리면 이 플러그인은 지운다.
 *
 * - Info.plist에 UIApplicationSceneManifest(단일 scene)를 추가한다.
 * - plugins/ios/SceneDelegate.swift를 앱 타깃에 추가한다. 동작 설명은 그 파일 주석 참고.
 *   AppDelegate.swift는 건드리지 않는다(다른 플러그인들의 AppDelegate 수정과 충돌하지 않는다).
 */
const fs = require('fs');
const path = require('path');
const { withInfoPlist, withXcodeProject, IOSConfig } = require('expo/config-plugins');

const SCENE_DELEGATE_FILE = 'SceneDelegate.swift';
const SCENE_DELEGATE_SOURCE = path.join(__dirname, 'ios', SCENE_DELEGATE_FILE);

const SCENE_MANIFEST = {
  // React Native는 window 하나만 다룬다 — iPad 다중 창을 열지 않는다.
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: 'Default Configuration',
        UISceneDelegateClassName: `$(PRODUCT_MODULE_NAME).SceneDelegate`,
      },
    ],
  },
};

function applySceneManifest(infoPlist) {
  infoPlist.UIApplicationSceneManifest = SCENE_MANIFEST;
  return infoPlist;
}

const withIosSceneLifecycle = (config) => {
  config = withInfoPlist(config, (config) => {
    config.modResults = applySceneManifest(config.modResults);
    return config;
  });

  config = withXcodeProject(config, (config) => {
    const { projectRoot, projectName } = config.modRequest;
    const destination = path.join(IOSConfig.Paths.getSourceRoot(projectRoot), SCENE_DELEGATE_FILE);
    fs.copyFileSync(SCENE_DELEGATE_SOURCE, destination);

    const filepath = `${projectName}/${SCENE_DELEGATE_FILE}`;
    // --clean 없이 다시 prebuild해도 같은 파일을 두 번 등록하지 않는다
    if (!config.modResults.hasFile(filepath)) {
      config.modResults = IOSConfig.XcodeUtils.addBuildSourceFileToGroup({
        filepath,
        groupName: projectName,
        project: config.modResults,
      });
    }
    return config;
  });

  return config;
};

module.exports = withIosSceneLifecycle;
module.exports.applySceneManifest = applySceneManifest;
