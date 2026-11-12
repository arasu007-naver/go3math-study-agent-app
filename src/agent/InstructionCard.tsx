import { StyleSheet, Text, View } from 'react-native';
import type { Instruction } from './commandRouter';
import { Button } from '../ui/Button';
import { colors, radius, space, type } from '../ui/theme';

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
          <Button key={c.id} variant={i === 0 ? 'primary' : 'secondary'} title={c.label} onPress={() => onChoice(c.id)} />
        ))}
        {instruction.choices.length === 0 && <Button variant="secondary" title="확인" onPress={onDismiss} />}
      </View>
      {paused && <Text style={styles.note}>기본 흐름 일시정지됨 · 응답 후 이어서 재개</Text>}
    </View>
  );
}

// design-spec P1-7: 테두리 없는 카드. 첫 선택지만 primary, 나머지와 확인은 secondary(공용 Button, 단계 4a). 튜터 문구는 카드 위 카드라 cardMuted 면.
const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  label: { ...type.caption, color: colors.muted },
  labelTutor: { color: colors.text },
  tutorBox: { padding: space.md, borderRadius: radius.md, backgroundColor: colors.cardMuted },
  text: { ...type.body, fontSize: type.title.fontSize, lineHeight: type.title.lineHeight, color: colors.text }, // 읽는 글이라 크기는 title, 굵기는 body
  choices: { gap: space.sm },
  note: { ...type.caption, color: colors.muted },
});
