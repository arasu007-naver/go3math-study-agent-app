jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('../src/state/bootstrap', () => ({ apolloClient: {} }));
jest.mock('../src/host/widgets', () => ({ topicFetchers: {} }));
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('react-native-blob-util', () => ({}));

import { awaitsAnswer } from '../src/agent/StudyLogPanel';

const ins = (over: object) => ({ messageId: 'm', source: 'default' as const, text: 't', choices: [], requiresResponse: false, ...over });

describe('awaitsAnswer', () => {
  it('안내가 없으면 false', () => expect(awaitsAnswer(null)).toBe(false));
  it('답이 필요 없는 안내는 false', () => expect(awaitsAnswer(ins({}))).toBe(false));
  it('응답이 필요하거나 선택지가 있으면 true', () => {
    expect(awaitsAnswer(ins({ requiresResponse: true }))).toBe(true);
    expect(awaitsAnswer(ins({ choices: [{ id: 'a', label: 'A' }] }))).toBe(true);
  });
});
