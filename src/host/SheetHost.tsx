// 앱 전역 모달 시트 호스트: 에이전트 세션의 sheet 슬롯에 든 위젯을 Modal로 띄운다.
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import type { AgentSession, SessionSnapshot } from '../agent/session';
import { useAgentSession } from '../agent/useAgentSession';
import { useDeviceMode } from '../layout/deviceMode';
import { colors, radius, space } from '../ui/theme';
import { sheetWidgets } from './widgets';

const TABLET_CARD_MAX_W = 560;

type Props = { state?: SessionSnapshot; session?: AgentSession };

export function SheetHost(props: Props) {
  const live = useAgentSession();
  const state = props.state ?? live.state;
  const session = props.session ?? live.session;
  const mode = useDeviceMode();
  const reduceMotion = useReducedMotion();

  const sheet = state.sheet;
  const Widget = sheet ? sheetWidgets[sheet.componentId] : undefined;
  if (!sheet || !Widget) return null;

  const dismiss = () => {
    session.emit('study_note_dismissed', { taskId: sheet.props.taskId as number });
    session.closeSheet();
  };

  return (
    <Modal transparent visible animationType={reduceMotion ? 'fade' : 'slide'} onRequestClose={dismiss}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.scrim} accessibilityRole="button" accessibilityLabel="학습장 배경" onPress={dismiss} />
        <View style={[styles.card, mode === 'tablet' && styles.cardTablet]}>
          <Widget props={sheet.props} session={session} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, justifyContent: 'flex-end' },
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.scrim },
  card: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
    paddingBottom: space.md,
  },
  cardTablet: { width: '100%', maxWidth: TABLET_CARD_MAX_W, alignSelf: 'center' },
});
