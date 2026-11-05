import { fireEvent, render, screen } from '@testing-library/react-native';
import DocumentScanner from 'react-native-document-scanner-plugin';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { requestStorageUrl } from '../src/api/rest';
import { createSolutionPhotoUploader } from '../src/adapters/solutionPhoto';
import { ProblemActionRow } from '../src/kit/problem-list/ProblemActionRow';
import { ProblemListPanel } from '../src/kit/problem-list/ProblemListPanel';
import { authStore } from '../src/state/auth';

jest.mock('react-native-document-scanner-plugin', () => ({
  __esModule: true,
  default: { scanDocument: jest.fn() },
  ResponseType: { Base64: 'base64' },
  ScanDocumentResponseStatus: { Success: 'success', Cancel: 'cancel' },
}));
jest.mock('react-native-webview', () => {
  const { View } = require('react-native');
  return { WebView: (props: any) => <View testID="webview" {...props} /> };
});
jest.mock('react-native-blob-util', () => ({ __esModule: true, default: { fetch: jest.fn(async () => ({})) } }));
jest.mock('../src/api/rest', () => ({ requestStorageUrl: jest.fn() }));
jest.mock('../src/kit/ui/image-dynamic-dims', () => () => null);

describe('ProblemActionRow', () => {
  it('calls answer and camera handlers, and disables the camera while uploading', async () => {
    const onAnswer = jest.fn();
    const onCamera = jest.fn();
    const r = await render(<ProblemActionRow label="1번 문제" onAnswer={onAnswer} onCamera={onCamera} />);
    await fireEvent.press(screen.getByLabelText('1번 문제 해답 보기'));
    await fireEvent.press(screen.getByLabelText('1번 문제 풀이 사진 올리기'));
    expect(onAnswer).toHaveBeenCalledTimes(1);
    expect(onCamera).toHaveBeenCalledTimes(1);

    await r.rerender(<ProblemActionRow label="1번 문제" uploading onAnswer={onAnswer} onCamera={onCamera} />);
    await fireEvent.press(screen.getByLabelText('1번 문제 풀이 사진 올리기'));
    expect(onCamera).toHaveBeenCalledTimes(1);
  });
});

describe('ProblemListPanel footer', () => {
  it('renders the footer under every problem only when given', async () => {
    const set = { title: '세트', problems: [1, 2].map((id) => ({ sourceType: 'UNIT', sourceId: id, image: 'x' })) };
    const fetchers = { fetchProblems: async () => set };
    const source = { kind: 'task' as const, taskId: 1 };
    const r = await render(<ProblemListPanel fetchers={fetchers} source={source} onSelectProblem={() => {}} renderFooter={({ index }) => <ProblemActionRow label={`${index + 1}번`} onAnswer={() => {}} onCamera={() => {}} />} />);
    expect(await screen.findAllByLabelText(/해답 보기$/)).toHaveLength(2);

    await r.rerender(<ProblemListPanel fetchers={fetchers} source={source} onSelectProblem={() => {}} />);
    expect(screen.queryAllByLabelText(/해답 보기$/)).toHaveLength(0);
  });
});

describe('createSolutionPhotoUploader', () => {
  const scan = DocumentScanner.scanDocument as jest.Mock;
  const client = { mutate: jest.fn(async () => ({})) } as any;
  const upload = createSolutionPhotoUploader(client);

  beforeEach(() => jest.clearAllMocks());

  it('does nothing when the scan is cancelled', async () => {
    scan.mockResolvedValue({ status: 'cancel' });
    await expect(upload({ sourceType: 'UNIT', sourceId: 7 })).resolves.toBe(false);
    expect(requestStorageUrl).not.toHaveBeenCalled();
    expect(client.mutate).not.toHaveBeenCalled();
  });

  it('uploads the scan and records it with the task', async () => {
    authStore.dispatch({ type: 'SIGN_IN', item: { token: 'tok' } } as any);
    scan.mockResolvedValue({ status: 'success', scannedImages: ['BASE64'] });
    (requestStorageUrl as jest.Mock).mockResolvedValue({ data: { url: 'https://blob/x.jpg?sig=1' } });
    await expect(upload({ sourceType: 'UNIT', sourceId: 7, taskId: 3 })).resolves.toBe(true);
    expect(ReactNativeBlobUtil.fetch).toHaveBeenCalledWith('PUT', 'https://blob/x.jpg?sig=1', expect.objectContaining({ 'x-ms-blob-type': 'BlockBlob' }), 'BASE64');
    expect(client.mutate).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { sourceType: 'UNIT', sourceId: 7, taskId: 3, fileName: 'https://blob/x.jpg', photoUnitId: 0 } }),
    );
  });
});
