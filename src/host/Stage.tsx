import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import type { AgentSession, SessionSnapshot } from '../agent/session';
import { widgets } from './widgets';
import { colors } from '../ui/theme';

const logo = require('../../assets/images/welcome/go3math-one-line-logo.png');
const emptyLogo = require('../../assets/images/splash-icon.png'); // launch screen과 같은 로고(400×342)

// 콘텐츠 영역(컴포넌트 호스트). 한 시점에 위젯 1개, 에이전트 명령으로만 교체된다(§4.1). 위젯이 없으면 가운데 로고만 보인다.
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
        <View style={styles.title}>
          <Image source={logo} resizeMode="contain" style={styles.logo} accessibilityLabel="Go3Math" />
        </View>
        <View style={[styles.status, { backgroundColor: state.connected ? '#15803D' : colors.border }]} />
      </View>
      {state.fallbackText && <Text style={styles.fallback}>{state.fallbackText}</Text>}
      <View style={styles.body}>
        {Widget && view ? (
          <Widget props={view.props} session={session} />
        ) : (
          <View style={styles.empty}>
            <Image source={emptyLogo} resizeMode="contain" style={styles.emptyLogo} accessibilityLabel="Go3Math" />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  header: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: colors.agent, backgroundColor: colors.surface },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 28, color: colors.text, lineHeight: 30 },
  title: { flex: 1, paddingLeft: 4 },
  logo: { height: 32, width: 32 * (987 / 242) },
  status: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  fallback: { margin: 12, padding: 12, borderRadius: 8, backgroundColor: '#FEF3C7', color: colors.text, fontSize: 14 },
  body: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyLogo: { width: 200, height: 200 * (342 / 400) },
});
