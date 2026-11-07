/**
 * 내 정보 버튼 줄(태블릿 dock 하단, 폰은 개인 사서함 위) — 오른쪽 정렬로 '이름 변경' · '프로필 이미지 변경' · '로그아웃'.
 * 기존 `pages/profile/change-info.tsx`(ProfileUpdateScreen)의 이름·사진 변경을 별도 화면 대신 이 줄에서 한다.
 * 이름은 작은 입력 모달, 사진은 사진 보관함 선택. 실제 호출은 editors로 받는다.
 * 아직 안 옮김: 이메일 변경, 캐시 지우기, 탈퇴.
 */
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
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

  return (
    <View style={styles.root}>
      {notice && <Text style={styles.notice}>{notice}</Text>}
      <View style={styles.row}>
        {busy && <ActivityIndicator color={colors.accent} />}
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => {
            setDraft(name ?? '');
            setEditing(true);
          }}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <View style={styles.underline}>
            <Text style={[styles.text, busy && styles.disabled]}>이름 변경</Text>
          </View>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={() => void run(editors.changeImage, '프로필 이미지를 변경했어요.')}
          style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <View style={styles.underline}>
            <Text style={[styles.text, busy && styles.disabled]}>프로필 이미지 변경</Text>
          </View>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onLogout} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
          <View style={styles.underline}>
            <Text style={[styles.text, styles.logout]}>로그아웃</Text>
          </View>
        </Pressable>
      </View>

      <Modal visible={editing} transparent animationType="fade" onRequestClose={() => setEditing(false)}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setEditing(false)} />
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>이름 변경</Text>
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
            <View style={styles.dialogRow}>
              <Pressable accessibilityRole="button" onPress={() => setEditing(false)} style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
                <Text style={[styles.text, styles.cancel]}>취소</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                disabled={!draft.trim() || draft.trim() === name}
                onPress={saveName}
                style={({ pressed }) => [styles.btn, pressed && styles.pressed]}>
                <Text style={[styles.text, (!draft.trim() || draft.trim() === name) && styles.disabled]}>저장</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { paddingHorizontal: space.sm, gap: space.xs },
  notice: { ...type.caption, color: colors.muted, textAlign: 'right', paddingHorizontal: space.sm },
  row: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space.xs },
  btn: { minHeight: layout.hit, justifyContent: 'center', paddingHorizontal: space.md, borderRadius: radius.sm },
  pressed: { backgroundColor: colors.cardMuted },
  text: { ...type.bodyStrong, color: colors.accentText },
  // 하단 줄 세 버튼만 검은 밑줄. textDecoration은 글자와의 간격을 못 정하므로 아래 테두리로 그리고 6px 띄운다
  underline: { paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#000000' },
  logout: { color: colors.danger },
  cancel: { color: colors.muted },
  disabled: { color: colors.disabled },
  backdrop: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', padding: space.lg },
  dialog: { width: '100%', maxWidth: 360, backgroundColor: colors.card, borderRadius: radius.lg, padding: space.lg, gap: space.md },
  dialogTitle: { ...type.title, color: colors.text },
  input: { ...type.body, color: colors.text, minHeight: layout.hit, paddingHorizontal: space.md, borderRadius: radius.sm, backgroundColor: colors.cardMuted },
  dialogRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: space.xs },
});
