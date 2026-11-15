jest.mock('react-native-mmkv', () => ({ createMMKV: () => ({ getString: () => undefined, set: () => {}, remove: () => {} }) }));
jest.mock('../src/state/bootstrap', () => ({ apolloClient: {} }));
jest.mock('../src/host/widgets', () => ({ topicFetchers: {} }));
jest.mock('react-native-webview', () => ({ WebView: () => null }));
jest.mock('react-native-blob-util', () => ({}));

import { initialTab } from '../src/agent/StudyLogPanel';

const ins = (over: object) => ({ messageId: 'm', source: 'default' as const, text: 't', choices: [], requiresResponse: false, ...over });

describe('initialTab', () => {
  it('안내가 없으면 이번 주 학습장', () => expect(initialTab(null, false)).toBe('notes'));
  it('답이 필요 없는 안내만 있으면 이번 주 학습장', () => expect(initialTab(ins({}), false)).toBe('notes'));
  it('응답이 필요하거나 선택지가 있으면 메시지', () => {
    expect(initialTab(ins({ requiresResponse: true }), false)).toBe('messages');
    expect(initialTab(ins({ choices: [{ id: 'a', label: 'A' }] }), false)).toBe('messages');
  });
  it('읽지 않은 메시지가 있으면 메시지', () => expect(initialTab(null, true)).toBe('messages'));
});
