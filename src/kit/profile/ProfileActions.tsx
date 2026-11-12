/**
 * 내 정보 버튼 줄(태블릿 dock 하단, 폰은 개인 사서함 위) — 오른쪽 정렬로 '이름 변경' · '프로필 이미지 변경' · '로그아웃'.
 * 기존 `pages/profile/change-info.tsx`(ProfileUpdateScreen)의 이름·사진 변경을 별도 화면 대신 이 줄에서 한다.
 * 이름은 작은 입력 모달, 사진은 사진 보관함 선택. 실제 호출은 editors로 받는다.
 * 아직 안 옮김: 이메일 변경, 캐시 지우기, 탈퇴.
 */
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button } from '../../ui/Button';
import { Dialog } from '../../ui/Dialog';
import { colors, layout, radius, space, type } from '../../ui/theme';

export interface ProfileEditors {
  changeName(name: string): Promise<void>;
  /** 사진을 고르지 않고 닫으면 false */
  changeImage(): Promise<boolean>;
}

const NAME_MAX = 30; // 기존 maxLength

export function ProfileActions({ name, editors, onLogout }: { name?: string | null; editors: ProfileEditors; onLogout(): void }) {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const run = async (job: () => Promise<boolean>, done: string) => {
    setBusy(true);
    setNotice(null);
    try {
      if (await job()) setNotice(done);
    } catch (e) {
      console.warn('[profile]', e);
      setNotice('변경하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  };

  const saveName = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === name) return;
    void run(async () => {
      await editors.changeName(next);
      return true;
    }, '이름을 변경했어요.');
  };

  const trimmed = draft.trim();

  // 단계 4b: 공용 Button(text). 로그아웃은 구분선 뒤 마지막, 위험 톤. 버튼은 전처럼 바로 반응한다(debounceMs 0)
  return (
    <View style={styles.root}>
      {notice && <Text style={styles.notice}>{notice}</Text>}
      <View style={styles.row}>
        {busy && <ActivityIndicator color={colors.accent} />}
        <Button
          variant="text"
          title="이름 변경"
          disabled={busy}
          debounceMs={0}
          onPress={() => {
            setDraft(name ?? '');
            setEditing(true);
          }}
        />
        <Button
          variant="text"
          title="프로필 이미지 변경"
          disabled={busy}
          debounceMs={0}
          onPress={() => void run(editors.changeImage, '프로필 이미지를 변경했어요.')}
        />
        <View testID="profile-actions-divider" style={styles.divider} />
        <Button variant="text" tone="danger" title="로그아웃" debounceMs={0} onPress={onLogout} />
      </View>

      <Dialog
        visible={editing}
        title="이름 변경"
        onDismiss={() => setEditing(false)}
        cancel={{}}
        confirm={{ title: '저장', disabled: !trimmed || trimmed === name, onPress: saveName }}>
        <TextInput
          accessibilityLabel="새 이름"
          value={draft}
          onChangeText={setDraft}
          maxLength={NAME_MAX}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={saveName}
          style={styles.input}
        />
      </Dialog>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: space.sm, gap: space.xs },
  notice: { ...type.caption, color: colors.muted, textAlign: 'right', paddingHorizontal: space.sm },
  row: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space.xs },
  divider: { width: StyleSheet.hairlineWidth * 2, height: 24, backgroundColor: colors.line, marginHorizontal: space.xs },
  input: { ...type.body, color: colors.text, minHeight: layout.hit, paddingHorizontal: space.md, borderRadius: radius.sm, backgroundColor: colors.cardMuted },
});
