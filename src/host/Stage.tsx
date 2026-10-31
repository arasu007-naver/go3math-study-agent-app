import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AgentSession, SessionSnapshot } from '../agent/session';
import { widgets } from './widgets';
import { colors } from '../ui/theme';

// 콘텐츠 영역(컴포넌트 호스트). 한 시점에 위젯 1개, 에이전트 명령으로만 교체된다(§4.1).
export function Stage({ state, session }: { state: SessionSnapshot; session: AgentSession }) {
  const view = state.stage;
  const Widget = view ? widgets[view.componentId] : undefined;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {view && view.componentId !== 'topic_list' && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="뒤로"
            onPress={() => session.emit('back_requested', { from: view.componentId })}
            style={styles.back}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
        )}
        <Text style={styles.title}>Qoolla</Text>
        <View style={[styles.status, { backgroundColor: state.connected ? '#15803D' : colors.border }]} />
      </View>
      {state.fallbackText && <Text style={styles.fallback}>{state.fallbackText}</Text>}
      <View style={styles.body}>
        {Widget && view ? (
          <Widget props={view.props} session={session} />
        ) : (
          <Text style={styles.empty}>{state.connected ? '에이전트가 준비 중이에요…' : '에이전트에 연결하는 중…'}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.ground },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: colors.line, backgroundColor: colors.surface },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: colors.text, lineHeight: 30 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', color: colors.text, paddingLeft: 4 },
  status: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  fallback: { margin: 12, padding: 12, borderRadius: 8, backgroundColor: '#FEF3C7', color: colors.text, fontSize: 14 },
  body: { flex: 1 },
  empty: { padding: 24, fontSize: 14, color: colors.muted },
});
