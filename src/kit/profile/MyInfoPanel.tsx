/**
 * 내 정보 패널 — 기존 `components/panels/profile/my-info-tablet.tsx`(+폰 `my-info.tsx`)의 프로필 카드 부분.
 * 보존: 아바타 64 · 주황 이름 · 이메일, 주황 테두리 카드.
 * 바뀐 점: AppCtx 대신 props로 받는다. '나가기' 버튼은 없앴다(로그아웃은 drawer 하단 '로그 아웃').
 * 아직 안 옮김: '정보 변경'(ChangeProfilePage 필요). 쪽지 목록은 MessageBoxPanel.
 */
import { Image, StyleSheet, Text, View } from 'react-native';

export const DEFAULT_AVATAR_URL = 'https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer/public/go3math.png';

export type MyInfo = { name?: string | null; email?: string | null; imageUrl?: string | null; via?: string };

export function MyInfoPanel({ info }: { info: MyInfo }) {
  return (
    <View style={styles.root}>
      <View style={styles.card}>
        <Image source={{ uri: info.imageUrl || DEFAULT_AVATAR_URL }} style={styles.avatar} />
        <View style={styles.text}>
          <Text style={styles.name}>{info.name || '이름 없음'}</Text>
          {!!info.email && <Text style={styles.email}>{info.email}</Text>}
          {!!info.via && <Text style={styles.via}>로그인: {info.via}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: 16, gap: 12, backgroundColor: '#FFFFFF' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 12, borderWidth: 1, borderColor: 'orange', borderRadius: 6 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E4E4E7' },
  text: { flex: 1, gap: 4 },
  name: { fontSize: 18, fontWeight: '600', color: 'darkorange' },
  email: { fontSize: 14, color: '#18181B' },
  via: { fontSize: 12, color: '#52525B' },
});
