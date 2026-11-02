import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AgentSession, SessionSnapshot } from './session';
import { InstructionCard } from './InstructionCard';
import { colors, layout, radius, shadow, space, type } from '../ui/theme';

// 폰 모드: 하단 탭 내비게이터 바로 위 하단 모달(§4.5). 자기 영역만 터치를 받는다.
export function PhoneInstructionModal({ state, session }: { state: SessionSnapshot; session: AgentSession }) {
  const [collapsed, setCollapsed] = useState(false);
  const ins = state.instruction;
  if (!ins) return null;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View accessibilityLabel="에이전트 instruction" style={styles.card}>
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

// design-spec P1-7: 하단 탭 바로 위에 붙는 흰 시트(위 모서리만 둥글게), 테두리 대신 그림자. 위치·열림 조건은 그대로.
const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: space.lg,
    paddingTop: space.xs,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.card,
    ...shadow.float,
  },
  grabArea: { height: layout.hit - space.lg, alignItems: 'center', justifyContent: 'center' },
  grab: { width: 36, height: 4, borderRadius: radius.pill, backgroundColor: colors.lineStrong },
  oneLine: { ...type.body, color: colors.text, paddingBottom: space.xs },
});
