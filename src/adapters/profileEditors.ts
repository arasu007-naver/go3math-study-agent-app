// kit/profile ProfileActions 포트의 구현 — 기존 `pages/profile/change-info.tsx`의 이름 변경·사진 변경 흐름.
// 사진: 보관함에서 정사각형으로 잘라 고름 → /api/storage로 서명 URL 받기 → BlockBlob PUT → CHANGE_PROFILE_IMAGE.
// 바꾼 뒤에는 /user/me로 내 정보를 다시 받아 authStore(MY_INFO)에 반영한다.
import type { ApolloClient } from '@apollo/client';
import * as ImagePicker from 'expo-image-picker';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { CHANGE_MY_NAME, CHANGE_PROFILE_IMAGE } from '../api/graphql/mutations';
import { myInfo, requestStorageUrl } from '../api/rest';
import type { ProfileEditors } from '../kit/profile/ProfileActions';
import { authStore } from '../state/auth';

export function createProfileEditors(client: ApolloClient): ProfileEditors {
  const token = () => authStore.getState().appToken ?? '';

  const refresh = async () => {
    const { data } = await myInfo(token());
    authStore.dispatch({ type: 'MY_INFO', item: { name: data.name, email: data.email, imageUrl: data.imageUrl } });
  };

  return {
    async changeName(name) {
      await client.mutate({ mutation: CHANGE_MY_NAME, variables: { myname: name } });
      await refresh();
    },
    async changeImage() {
      const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7, base64: true });
      const asset = picked.canceled ? null : picked.assets[0];
      if (!asset?.base64) return false;

      const mime = asset.mimeType ?? 'image/jpeg';
      const fileName = `${Date.now()}.${mime.slice(mime.lastIndexOf('/') + 1)}`;
      const { data } = await requestStorageUrl(fileName, token());
      const signedUrl: string = data.url;
      // 본문이 base64 문자열이고 content-type이 octet-stream이면 blob-util이 디코드해서 올린다(기존과 같음)
      await ReactNativeBlobUtil.fetch(
        'PUT',
        signedUrl,
        { 'x-ms-blob-type': 'BlockBlob', 'content-type': 'application/octet-stream', 'x-ms-blob-content-type': mime },
        asset.base64,
      );
      await client.mutate({ mutation: CHANGE_PROFILE_IMAGE, variables: { imageUrl: signedUrl.split('?')[0] } });
      await refresh();
      return true;
    },
  };
}
