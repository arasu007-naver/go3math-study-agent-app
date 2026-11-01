/**
 * Kakao SDK(com.kakao.sdk) 저장소를 jitpack보다 앞에 둔다.
 * @react-native-seoul/kakao-login이 rootProject.allprojects에 Kakao 저장소를 추가하지만 jitpack 뒤에 붙고,
 * jitpack이 없는 아티팩트에 401을 돌려주면 Gradle은 다음 저장소로 넘어가지 않고 실패한다.
 */
const { withProjectBuildGradle } = require('expo/config-plugins');

const KAKAO_REPO = "maven { url 'https://devrepo.kakao.com/nexus/content/groups/public/' }";
const JITPACK = "maven { url 'https://www.jitpack.io' }";

const withKakaoMavenRepo = (config) =>
  withProjectBuildGradle(config, (config) => {
    const gradle = config.modResults;
    if (!gradle.contents.includes(KAKAO_REPO) && gradle.contents.includes(JITPACK)) {
      gradle.contents = gradle.contents.replace(JITPACK, `${KAKAO_REPO}\n    ${JITPACK}`);
    }
    return config;
  });

module.exports = withKakaoMavenRepo;
