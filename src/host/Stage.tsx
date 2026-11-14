import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { AgentSession, SessionSnapshot } from '../agent/session';
import { widgets } from './widgets';
import { colors, layout, radius, shadow, space, type } from '../ui/theme';

// 회색(colors.bg) 헤더에 맞춰 흰 바탕을 #F7F7F8로 바꾼 판. 원본(흰 바탕)은 welcome 화면이 쓴다
const logo = require('../../assets/images/welcome/go3math-one-line-logo-gray.png');
const emptyLogo = require('../../assets/images/splash-icon.png'); // launch screen과 같은 로고(400×342)

// 콘텐츠 영역(컴포넌트 호스트). 한 시점에 위젯 1개, 에이전트 명령으로만 교체된다(§4.1). 위젯이 없으면 가운데 로고만 보인다.
// 태블릿 Stage는 두 모드만: 빈 화면(로고)과 문제 목록(problem_list · problem_preview). 검색·주제 목록은 drawer dock이 맡는다(registry mode).
// 화면 전환(풀이 화면 등)에서 돌아와도 세션 상태라 그대로 남는다. 상단 뒤로 버튼은 두지 않는다.
export function Stage({ state, session }: { state: SessionSnapshot; session: AgentSession }) {
  const view = state.stage;
  const Widget = view ? widgets[view.componentId] : undefined;
  // 내 책갈피가 떠 있으면 헤더 버튼은 '문제 목록'(이전 화면으로 되돌리기)
  const showingBookmarks = view?.componentId === 'problem_list' && (view.props.source as { kind?: string } | undefined)?.kind === 'bookmarks';

  return (
    <View style={styles.root}>
      <View testID="stage-header" style={styles.header}>
        <View style={styles.title}>
          <Image source={logo} resizeMode="contain" style={styles.logo} accessibilityLabel="Go3Math" />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={showingBookmarks ? '문제 목록' : '내 책갈피'}
          hitSlop={8}
          onPress={() =>
            showingBookmarks ? session.restoreStage() : session.showLocalComponent('problem_list', { source: { kind: 'bookmarks' } })
          }
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
          <Ionicons name={showingBookmarks ? 'documents-outline' : 'bookmark-outline'} size={20} color={colors.text} />
        </Pressable>
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
  header: { height: layout.headerH, flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, backgroundColor: colors.bg }, // 캔버스 화면 하단 툴바 둘레와 같은 옅은 회색
  title: { flex: 1, paddingLeft: 4 },
  logo: { height: 32, width: 32 * (987 / 242) },
  // 책갈피 ↔ 문제 목록 전환 버튼: 회색 원 + 흰 테두리 2px + 그림자, 터치 크기는 공용 hit(44)
  iconButton: { minWidth: layout.hit, minHeight: layout.hit, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lineStrong, borderWidth: 2, borderColor: colors.card, ...shadow.card },
  pressed: { opacity: 0.6 },
  status: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  fallback: { margin: space.md, padding: space.md, borderRadius: radius.sm, backgroundColor: colors.warnSoft, color: colors.text, ...type.body },
  body: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyLogo: { width: 200, height: 200 * (342 / 400) },
});
