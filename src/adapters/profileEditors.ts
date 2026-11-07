// kit/profile ProfileActions 포트의 구현 — 기존 `pages/profile/change-info.tsx`의 이름 변경·사진 변경 흐름.
// Java API(api-v2 저장소 MyProfileController)를 먼저 쓴다:
//   이름: PATCH /api/users/me/name {name}
//   사진: POST /api/users/me/profile-image/upload-url {contentType} → 받은 uploadUrl로 BlockBlob PUT
//         → PATCH /api/users/me/profile-image {imageUrl}
//   둘 다 바뀐 내 정보 {name, email, imageUrl}를 돌려주므로 그걸로 authStore(MY_INFO)를 바로 갱신한다.
// Java에 닿지 못하면(배포 전 404, 토큰 거절 401, 네트워크 오류) 기존 경로로 한다:
//   GraphQL CHANGE_MY_NAME / www /api/storage 서명 URL + CHANGE_PROFILE_IMAGE, 그 뒤 /user/me 재조회.
// Java 쪽이 배포·확인되면 기존 경로를 지운다.
import type { ApolloClient } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { CHANGE_MY_NAME, CHANGE_PROFILE_IMAGE } from '../api/graphql/mutations';
import { myInfo, requestStorageUrl } from '../api/rest';
import { apiV3, isUnavailable } from '../api/rest/apiV3';
import type { ProfileEditors } from '../kit/profile/ProfileActions';
import { authStore } from '../state/auth';

type MyProfile = { name: string; email: string; imageUrl: string | null };

/** Java가 준 서명 URL로 올리다 실패 — Java에는 닿았으므로 기존 경로로 다시 하지 않는다 */
class UploadError extends Error {}

const putBlob = (signedUrl: string, mime: string, base64: string) =>
  // 본문이 base64 문자열이고 content-type이 octet-stream이면 blob-util이 디코드해서 올린다(기존과 같음)
  ReactNativeBlobUtil.fetch(
    'PUT',
    signedUrl,
    { 'x-ms-blob-type': 'BlockBlob', 'content-type': 'application/octet-stream', 'x-ms-blob-content-type': mime },
    base64,
  ).then((res) => {
    const status = res.info().status;
    if (status < 200 || status >= 300) throw new Error(`blob upload ${status}`);
  });

export function createProfileEditors(client: ApolloClient): ProfileEditors {
  const token = () => authStore.getState().appToken ?? '';

  const apply = (p: MyProfile) =>
    authStore.dispatch({ type: 'MY_INFO', item: { name: p.name, email: p.email, imageUrl: p.imageUrl ?? undefined } });

  const refresh = async () => {
    const { data } = await myInfo(token());
    apply(data);
  };

  /** Java를 먼저 부르고, 닿지 못하면 legacy로 */
  const viaJava = async (java: () => Promise<void>, legacy: () => Promise<void>, what: string) => {
    try {
      await java();
    } catch (e) {
      if (e instanceof UploadError || !isUnavailable(e)) throw e;
      console.warn(`[profile] Java ${what} 실패, 기존 경로로:`, String((e as Error)?.message ?? e));
      await legacy();
    }
  };

  return {
    async changeName(name) {
      await viaJava(
        async () => apply(await apiV3<MyProfile>('/api/users/me/name', token(), { method: 'PATCH', body: { name } })),
        async () => {
          await client.mutate({ mutation: CHANGE_MY_NAME, variables: { myname: name } });
          await refresh();
        },
        'name',
      );
    },
    async changeImage() {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
      const asset = picked.canceled ? null : picked.assets[0];
      if (!asset?.base64) return false;
      const base64 = asset.base64;
      const mime = asset.mimeType ?? 'image/jpeg';

      await viaJava(
        async () => {
          const { uploadUrl, imageUrl } = await apiV3<{ uploadUrl: string; imageUrl: string }>(
            '/api/users/me/profile-image/upload-url',
            token(),
            { method: 'POST', body: { contentType: mime } },
          );
          await putBlob(uploadUrl, mime, base64).catch((e) => {
            throw new UploadError(String(e?.message ?? e));
          });
          apply(await apiV3<MyProfile>('/api/users/me/profile-image', token(), { method: 'PATCH', body: { imageUrl } }));
        },
        async () => {
          const fileName = `${Date.now()}.${mime.slice(mime.lastIndexOf('/') + 1)}`;
          const { data } = await requestStorageUrl(fileName, token());
          const signedUrl: string = data.url;
          await putBlob(signedUrl, mime, base64);
          await client.mutate({ mutation: CHANGE_PROFILE_IMAGE, variables: { imageUrl: signedUrl.split('?')[0] } });
          await refresh();
        },
        'profile-image',
      );
      return true;
    },
  };
}
