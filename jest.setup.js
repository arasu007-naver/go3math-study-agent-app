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
