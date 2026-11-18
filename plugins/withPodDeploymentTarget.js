/**
 * Pod 타깃의 iOS 배포 버전 하한을 앱과 같은 값(15.1)으로 고정.
 *
 * Xcode 27은 배포 버전 15.0 미만인 타깃을 빌드하지 않는다. 일부 Pod(및 그 리소스 번들 타깃 —
 * Alamofire, SDWebImage, GoogleSignIn, KakaoSDKCommon 등)은 podspec에 9.0~13.0을 선언하고 있어
 * "IPHONEOS_DEPLOYMENT_TARGET is set to 9.0, but the range of supported ... is 15.0 to ..." 오류로 실패한다.
 *
 * ios/는 prebuild가 다시 만들므로 Podfile을 직접 고치지 않고, 여기서 post_install에 블록을 넣는다.
 * 15.1보다 낮은 타깃만 올린다 — 더 높은 버전을 요구하는 Pod은 그대로 둔다.
 */
const { withPodfile } = require('expo/config-plugins');

const DEPLOYMENT_TARGET = '15.1';
const MARKER = '# @generated withPodDeploymentTarget';
const ANCHOR = /(\n[ \t]*)post_install do \|installer\|\n/;

function buildBlock(indent) {
  return [
    // Podfile에는 ASCII만 쓴다 — 셸 로캘이 UTF-8이 아니면 CocoaPods가 Podfile을 읽다 실패한다.
    `${MARKER} (plugins/withPodDeploymentTarget.js): raise pod targets below the minimum`,
    `min_deployment_target = Gem::Version.new('${DEPLOYMENT_TARGET}')`,
    'installer.pods_project.targets.each do |pod_target|',
    '  pod_target.build_configurations.each do |build_configuration|',
    "    current = build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET']",
    '    next if current && Gem::Version.new(current) >= min_deployment_target',
    "    build_configuration.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = min_deployment_target.to_s",
    '  end',
    'end',
  ]
    .map((line) => `${indent}${line}\n`)
    .join('');
}

/** Podfile 문자열의 post_install 맨 앞에 블록을 넣는다. 이미 있으면 그대로 돌려준다. */
function applyPodDeploymentTarget(podfile) {
  if (podfile.includes(MARKER)) return podfile;
  const match = podfile.match(ANCHOR);
  if (!match) {
    throw new Error('withPodDeploymentTarget: Podfile에서 post_install 블록을 찾지 못했습니다.');
  }
  const indent = `${match[1].slice(1)}  `;
  return podfile.replace(ANCHOR, (anchor) => `${anchor}${buildBlock(indent)}\n`);
}

const withPodDeploymentTarget = (config) =>
  withPodfile(config, (config) => {
    config.modResults.contents = applyPodDeploymentTarget(config.modResults.contents);
    return config;
  });

module.exports = withPodDeploymentTarget;
module.exports.applyPodDeploymentTarget = applyPodDeploymentTarget;
