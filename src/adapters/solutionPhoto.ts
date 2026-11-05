// 폰 결과 화면 문제별 카메라 버튼의 구현 — 기존 `components/cards/bookmark.tsx` onCameraPress('새 풀이')와 같은 흐름.
// 문서 스캔(카메라만, 보관함 선택 없음) 1장 → /api/storage로 서명 URL 받기 → BlockBlob PUT → CREATE_RECORD(풀이 기록).
import type { ApolloClient } from '@apollo/client';
import DocumentScanner, { ResponseType, ScanDocumentResponseStatus } from 'react-native-document-scanner-plugin';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { CREATE_RECORD } from '../api/graphql/mutations';
import { requestStorageUrl } from '../api/rest';
import { authStore } from '../state/auth';

export type SolutionTarget = { sourceType: string; sourceId: number; taskId?: number };

/** 찍어 올렸으면 true, 스캔을 닫았으면 false. 업로드·기록 실패는 throw */
export type SolutionPhotoUploader = (target: SolutionTarget) => Promise<boolean>;

export function createSolutionPhotoUploader(client: ApolloClient): SolutionPhotoUploader {
  return async ({ sourceType, sourceId, taskId }) => {
    const scan = await DocumentScanner.scanDocument({ maxNumDocuments: 1, responseType: ResponseType.Base64 });
    const image = scan.status === ScanDocumentResponseStatus.Cancel ? undefined : scan.scannedImages?.[0];
    if (!image) return false;

    const fileName = `${Date.now()}.jpg`;
    const { data } = await requestStorageUrl(fileName, authStore.getState().appToken ?? '');
    const signedUrl: string = data.url;
    await ReactNativeBlobUtil.fetch(
      'PUT',
      signedUrl,
      { 'x-ms-blob-type': 'BlockBlob', 'content-type': 'application/octet-stream', 'x-ms-blob-content-type': 'image/jpeg' },
      image,
    );
    await client.mutate({
      mutation: CREATE_RECORD,
      variables: { sourceType, sourceId, taskId: taskId ?? 0, fileName: signedUrl.split('?')[0], photoUnitId: 0 },
    });
    return true;
  };
}
