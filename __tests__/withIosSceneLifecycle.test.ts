import fs from 'fs';
import path from 'path';

const { applySceneManifest } = require('../plugins/withIosSceneLifecycle');

describe('withIosSceneLifecycle', () => {
  it('Info.plist에 단일 scene manifest를 넣고 기존 키는 그대로 둔다', () => {
    const plist = applySceneManifest({ CFBundleDisplayName: 'Go3 Math' });

    expect(plist.CFBundleDisplayName).toBe('Go3 Math');
    expect(plist.UIApplicationSceneManifest.UIApplicationSupportsMultipleScenes).toBe(false);
    expect(plist.UIApplicationSceneManifest.UISceneConfigurations.UIWindowSceneSessionRoleApplication).toEqual([
      {
        UISceneConfigurationName: 'Default Configuration',
        UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
      },
    ]);
  });

  it('manifest가 가리키는 SceneDelegate 클래스가 플러그인이 복사하는 Swift 파일에 있다', () => {
    const source = fs.readFileSync(path.join(__dirname, '../plugins/ios/SceneDelegate.swift'), 'utf8');

    expect(source).toMatch(/^class SceneDelegate: UIResponder, UIWindowSceneDelegate \{$/m);
  });

  it('app.config의 plugins에 등록돼 있다', () => {
    const config = require('../app.config').default;

    expect(config.plugins).toContain('./plugins/withIosSceneLifecycle');
  });
});
