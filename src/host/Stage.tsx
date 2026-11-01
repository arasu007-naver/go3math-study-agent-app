import { Image, StyleSheet, Text, View } from 'react-native';
import type { AgentSession, SessionSnapshot } from '../agent/session';
import { widgets } from './widgets';
import { useDeviceMode } from '../layout/deviceMode';
import { colors, layout, radius, space, type } from '../ui/theme';

const logo = require('../../assets/images/welcome/go3math-one-line-logo.png');
const emptyLogo = require('../../assets/images/splash-icon.png'); // launch screen과 같은 로고(400×342)

// 콘텐츠 영역(컴포넌트 호스트). 한 시점에 위젯 1개, 에이전트 명령으로만 교체된다(§4.1). 위젯이 없으면 가운데 로고만 보인다.
// 태블릿 Stage는 두 모드만: 빈 화면(로고)과 문제 목록(problem_list · problem_preview). 검색·주제 목록은 drawer dock이 맡는다(registry mode).
// 화면 전환(풀이 화면 등)에서 돌아와도 세션 상태라 그대로 남는다. 상단 뒤로 버튼은 두지 않는다.
export function Stage({ state, session }: { state: SessionSnapshot; session: AgentSession }) {
  const view = state.stage;
  const Widget = view ? widgets[view.componentId] : undefined;
  // 태블릿에서 drawer를 접으면 왼쪽에 레일이 남으므로 Stage(헤더·문제 목록)를 레일 오른쪽으로 민다
  const mode = useDeviceMode();

  return (
    <View style={[styles.root, mode === 'tablet' && styles.rootTablet]}>
      <View style={styles.header}>
        <View style={styles.title}>
          <Image source={logo} resizeMode="contain" style={styles.logo} accessibilityLabel="Go3Math" />
        </View>
        <View style={[styles.status, { backgroundColor: state.connected ? colors.online : colors.offline }]} />
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
  header: { height: layout.headerH, flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, backgroundColor: 'transparent' },
  rootTablet: { paddingLeft: layout.gutter + layout.chatRail },
  title: { flex: 1, paddingLeft: 4 },
  logo: { height: 32, width: 32 * (987 / 242) },
  status: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  fallback: { margin: space.md, padding: space.md, borderRadius: radius.sm, backgroundColor: colors.warnSoft, color: colors.text, ...type.body },
  body: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyLogo: { width: 200, height: 200 * (342 / 400) },
});
