/**
 * 학습장 입력 양식. 달성률(단일) · 어려웠던 점(복수) 칩과 메모 입력.
 * 처음 값은 초안 → 조회한 노트 → 빈 양식 순. 입력마다 초안을 저장하고, 저장에 성공하면 지운다.
 * 키보드 회피는 이 컴포넌트가 아니라 시트(SheetHost)가 맡는다.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { BottomSheetTextInput } from '@gorhom/bottom-sheet';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { KeyValueStore } from '../../storage/types';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { colors, radius, space, type } from '../../ui/theme';
import { clearDraft, loadDraft, saveDraft } from './draft';
import {
  ACHIEVEMENTS,
  DIFFICULTIES,
  MAX_TEXT,
  canSave,
  emptyForm,
  fromNote,
  toInput,
  toggleDifficulty,
  type FormState,
  type StudyNote,
} from './model';
import { persistNote, type StudyNoteFetchers } from './persist';

export type StudyNoteFormProps = {
  taskId: number;
  mode: 'self' | 'live';
  title: string;
  topicHints?: string[];
  fetchers: StudyNoteFetchers;
  store: KeyValueStore;
  onDone(result: 'saved' | 'dismissed'): void;
};

export function StudyNoteForm({ taskId, mode, title, topicHints, fetchers, store, onDone }: StudyNoteFormProps) {
  const [form, setForm] = useState<FormState>(() => loadDraft(store, taskId) ?? emptyForm());
  // undefined = 조회 실패(또는 아직 조회 전), null = 노트 없음
  const [existing, setExisting] = useState<StudyNote | null | undefined>(undefined);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [failed, setFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const touched = useRef(loadDraft(store, taskId) !== null);

  useEffect(() => {
    let alive = true;
    fetchers.fetchNote(taskId).then(
      (note) => {
        if (!alive) return;
        setExisting(note);
        if (!touched.current) setForm(fromNote(note));
      },
      () => {
        if (alive) setFetchFailed(true);
      },
    );
    return () => {
      alive = false;
    };
    // 열 때 한 번만 조회한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]);

  const change = useCallback(
    (patch: (prev: FormState) => FormState) => {
      touched.current = true;
      setForm((prev) => {
        const next = patch(prev);
        saveDraft(store, taskId, next);
        return next;
      });
    },
    [store, taskId],
  );

  const addHint = (hint: string) =>
    change((p) => {
      const joined = p.description ? `${p.description} ${hint}` : hint;
      return { ...p, description: joined.slice(0, MAX_TEXT) };
    });

  const save = async () => {
    if (saving || !canSave(form)) return;
    setSaving(true);
    try {
      await persistNote(fetchers, taskId, toInput(form, mode), existing);
      clearDraft(store, taskId);
      onDone('saved');
    } catch {
      setFailed(true);
      setSaving(false);
    }
  };

  const live = mode === 'live';
  const memoLabel = live ? '한 줄 메모 (선택)' : '공부한 내용';
  const saveLabel = failed ? '다시 저장' : existing ? '수정' : '저장';
  const saveDisabled = saving || !canSave(form);
  const goalVisible = goalOpen || form.expectations !== '';

  return (
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      <Text style={styles.header} accessibilityRole="header">{`학습장 · ${title}`}</Text>

      {fetchFailed ? <Text style={styles.notice}>이전 메모를 불러오지 못했어요</Text> : null}

      {live ? (
        <View style={styles.tutorBox}>
          <Text style={styles.caption}>선생님 정리</Text>
          <Text style={styles.body}>{existing?.tutorDescription || '선생님 정리가 아직 없어요'}</Text>
        </View>
      ) : null}

      <Text style={styles.question}>얼마나 해냈나요?</Text>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="얼마나 해냈나요?">
        {ACHIEVEMENTS.map((a) => (
          <Chip
            key={a.value}
            label={a.label}
            accessibilityRole="radio"
            selected={form.achievement === a.value}
            onPress={() => change((p) => ({ ...p, achievement: a.value }))}
          />
        ))}
      </View>

      <Text style={styles.question}>어려웠던 점 (여러 개)</Text>
      <View style={styles.chips} accessibilityLabel="어려웠던 점">
        {DIFFICULTIES.map((d) => (
          <Chip
            key={d.code}
            label={d.label}
            accessibilityRole="checkbox"
            selected={form.difficulties.includes(d.code)}
            onPress={() => change((p) => ({ ...p, difficulties: toggleDifficulty(p.difficulties, d.code) }))}
          />
        ))}
      </View>

      <Text style={styles.question}>{memoLabel}</Text>
      {topicHints && topicHints.length > 0 ? (
        <View style={styles.chips}>
          <Text style={styles.caption}>추천:</Text>
          {topicHints.map((h) => (
            <Chip key={h} label={h} selected={false} onPress={() => addHint(h)} />
          ))}
        </View>
      ) : null}
      <BottomSheetTextInput
        accessibilityLabel={memoLabel}
        style={styles.input}
        multiline
        maxLength={MAX_TEXT}
        value={form.description}
        onChangeText={(t) => change((p) => ({ ...p, description: t.slice(0, MAX_TEXT) }))}
        textAlignVertical="top"
      />

      {!live ? (
        <>
          <Button
            variant="text"
            size="sm"
            title="▸ 다음 목표 (선택)"
            expanded={goalVisible}
            onPress={() => setGoalOpen((v) => !v)}
            style={styles.toggle}
          />
          {goalVisible ? (
            <BottomSheetTextInput
              accessibilityLabel="다음 목표"
              style={styles.input}
              multiline
              maxLength={MAX_TEXT}
              value={form.expectations}
              onChangeText={(t) => change((p) => ({ ...p, expectations: t.slice(0, MAX_TEXT) }))}
              textAlignVertical="top"
            />
          ) : null}
        </>
      ) : null}

      {failed ? <Text style={styles.error}>저장하지 못했어요. 다시 시도해 주세요.</Text> : null}

      <View style={styles.actions}>
        <Button variant="text" title="나중에" onPress={() => onDone('dismissed')} />
        <Button variant="primary" title={saveLabel} disabled={saveDisabled} onPress={save} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: space.lg, gap: space.md },
  header: { ...type.title, color: colors.text },
  notice: { ...type.body, color: colors.muted },
  tutorBox: { backgroundColor: colors.cardMuted, borderRadius: radius.md, padding: space.md, gap: space.xs },
  caption: { ...type.caption, color: colors.muted },
  body: { ...type.body, color: colors.text },
  question: { ...type.bodyStrong, color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: space.sm },
  input: {
    ...type.body,
    color: colors.text,
    minHeight: 72,
    backgroundColor: colors.cardMuted,
    borderRadius: radius.md,
    padding: space.md,
  },
  // 펼치기 버튼은 왼쪽 정렬(질문 줄과 맞춘다)
  toggle: { alignSelf: 'flex-start' },
  error: { ...type.body, color: colors.danger },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: space.sm },
});
