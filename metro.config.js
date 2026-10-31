const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// @apollo/client가 쓰는 tslib는 웹 번들에서 ESM interop이 깨진다
// ("Cannot destructure property '__extends' of 'tslib.default'"). ES 모듈 빌드로 고정한다.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'tslib') {
    return context.resolveRequest(context, 'tslib/tslib.es6.js', platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
