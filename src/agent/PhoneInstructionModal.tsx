import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AgentSession, SessionSnapshot } from './session';
import { InstructionCard } from './InstructionCard';
import { colors } from '../ui/theme';

// 폰 모드: 하단 탭 내비게이터 바로 위 하단 모달(§4.5). 자기 영역만 터치를 받는다.
export function PhoneInstructionModal({ state, session }: { state: SessionSnapshot; session: AgentSession }) {
  const [collapsed, setCollapsed] = useState(false);
  const ins = state.instruction;
  if (!ins) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View accessibilityLabel="에이전트 instruction" style={[styles.card, ins.source === 'tutor' && styles.cardTutor]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={collapsed ? '모달 펼치기' : '모달 접기'}
          onPress={() => setCollapsed((c) => !c)}
          style={styles.grabArea}>
          <View style={styles.grab} />
        </Pressable>
        {collapsed ? (
          <Text numberOfLines={1} style={styles.oneLine}>
            {ins.text}
          </Text>
        ) : (
          <InstructionCard
            instruction={ins}
            paused={state.pausedDefault !== null}
            onChoice={(id) => session.selectChoice(ins.messageId, id)}
            onDismiss={() => session.dismissInstruction(ins.messageId)}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    padding: 16,
    paddingTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.agent,
    backgroundColor: colors.surface,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  cardTutor: { borderColor: colors.tutor },
  grabArea: { height: 28, alignItems: 'center', justifyContent: 'center' },
  grab: { width: 32, height: 4, borderRadius: 2, backgroundColor: colors.agent },
  oneLine: { fontSize: 14, color: colors.text, paddingBottom: 4 },
});
