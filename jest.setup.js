// MMKV(Nitro 네이티브 모듈)는 Jest에 없으므로 메모리 구현으로 대체한다.
jest.mock('react-native-mmkv', () => {
  const data = new Map();
  return {
    createMMKV: () => ({
      getString: (k) => data.get(k),
      set: (k, v) => data.set(k, v),
      remove: (k) => data.delete(k),
    }),
  };
});

// react-native-pdf는 react-native-blob-util 네이티브 모듈이 필요하므로 빈 뷰로 대체한다.
jest.mock('react-native-pdf', () => {
  const { View } = require('react-native');
  return { __esModule: true, default: View };
});
