import Expo
import UIKit

/**
 * UIScene 수명주기 채택 (plugins/withIosSceneLifecycle.js가 prebuild 때 iOS 프로젝트에 복사한다).
 *
 * iOS 27 런타임은 scene 수명주기를 채택하지 않은 앱을 실행 직후 중단시킨다. Expo SDK 54 템플릿은
 * AppDelegate가 UIWindow를 직접 만들고 scene을 쓰지 않으므로, 이 delegate가 그 사이를 잇는다.
 *
 * - window 생성과 React Native 시작은 AppDelegate(didFinishLaunching)에 그대로 둔다. expo-dev-launcher가
 *   그 시점에 window를 요구하기 때문이다. 여기서는 그 window를 연결된 scene에 붙이기만 한다.
 * - scene 수명주기에서는 UIKit이 UIApplicationDelegate의 URL·user activity·수명주기 콜백을 부르지 않는다.
 *   소셜 로그인(Kakao·Naver·Google)과 Expo 모듈(ExpoAppDelegateSubscriber)이 그 콜백에 의존하므로
 *   scene 이벤트를 AppDelegate로 다시 넘긴다.
 */
class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  private var hasEnteredBackground = false

  private var appDelegate: AppDelegate? {
    UIApplication.shared.delegate as? AppDelegate
  }

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene, let window = appDelegate?.window else {
      return
    }
    window.windowScene = windowScene
    window.frame = windowScene.coordinateSpace.bounds
    window.makeKeyAndVisible()
    self.window = window

    // 콜드 스타트로 전달된 URL·user activity (scene 이전에는 UIKit이 실행 직후 AppDelegate로 넘기던 것)
    self.scene(scene, openURLContexts: connectionOptions.urlContexts)
    connectionOptions.userActivities.forEach { self.scene(scene, continue: $0) }
  }

  // MARK: - URL · Universal Links

  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    for context in URLContexts {
      var options: [UIApplication.OpenURLOptionsKey: Any] = [.openInPlace: context.options.openInPlace]
      if let sourceApplication = context.options.sourceApplication {
        options[.sourceApplication] = sourceApplication
      }
      if let annotation = context.options.annotation {
        options[.annotation] = annotation
      }
      _ = appDelegate?.application(UIApplication.shared, open: context.url, options: options)
    }
  }

  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    _ = appDelegate?.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
  }

  // MARK: - 수명주기

  func sceneDidBecomeActive(_ scene: UIScene) {
    appDelegate?.applicationDidBecomeActive(UIApplication.shared)
  }

  func sceneWillResignActive(_ scene: UIScene) {
    appDelegate?.applicationWillResignActive(UIApplication.shared)
  }

  func sceneDidEnterBackground(_ scene: UIScene) {
    hasEnteredBackground = true
    appDelegate?.applicationDidEnterBackground(UIApplication.shared)
  }

  func sceneWillEnterForeground(_ scene: UIScene) {
    // 실행 직후에도 불리지만, applicationWillEnterForeground는 백그라운드에서 돌아올 때만 불리던 콜백이다.
    guard hasEnteredBackground else {
      return
    }
    appDelegate?.applicationWillEnterForeground(UIApplication.shared)
  }
}
