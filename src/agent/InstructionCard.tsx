import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Instruction } from './commandRouter';
import { colors } from '../ui/theme';

// 튜터/기본 instruction 공용 렌더러 — 폰 하단 모달과 태블릿 drawer가 같이 쓴다(§4.5).
export function InstructionCard({
  instruction,
  paused,
  onChoice,
  onDismiss,
}: {
  instruction: Instruction;
  paused: boolean;
  onChoice(choiceId: string): void;
  onDismiss(): void;
}) {
  const tutor = instruction.source === 'tutor';
  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, tutor && styles.labelTutor]}>{tutor ? '튜터 메시지' : '에이전트'}</Text>
      <View style={tutor ? styles.tutorBox : undefined}>
        <Text style={styles.text}>{instruction.text}</Text>
      </View>
      <View style={styles.choices}>
        {instruction.choices.map((c, i) => (
          <Pressable
            key={c.id}
            accessibilityRole="button"
            onPress={() => onChoice(c.id)}
            style={({ pressed }) => [styles.btn, i === 0 ? styles.btnPrimary : styles.btnSecondary, pressed && styles.pressed]}>
            <Text style={[styles.btnText, i === 0 && styles.btnTextPrimary]}>{c.label}</Text>
          </Pressable>
        ))}
        {instruction.choices.length === 0 && (
          <Pressable accessibilityRole="button" onPress={onDismiss} style={({ pressed }) => [styles.btn, styles.btnSecondary, pressed && styles.pressed]}>
            <Text style={styles.btnText}>확인</Text>
          </Pressable>
        )}
      </View>
      {paused && <Text style={styles.note}>기본 흐름 일시정지됨 · 응답 후 이어서 재개</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  label: { fontSize: 12, fontWeight: '700', color: colors.agentText },
  labelTutor: { color: colors.tutor },
  tutorBox: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: '#F4F4F5' },
  text: { fontSize: 16, lineHeight: 24, color: colors.text },
  choices: { gap: 8 },
  btn: { minHeight: 44, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  btnPrimary: { backgroundColor: colors.agent, borderColor: colors.agent },
  btnSecondary: { backgroundColor: colors.surface, borderColor: colors.agent },
  btnText: { fontSize: 15, color: colors.text },
  btnTextPrimary: { fontWeight: '700' },
  note: { fontSize: 12, color: colors.muted },
  pressed: { opacity: 0.7 },
});
