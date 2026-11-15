/**
 * Study Log 독(태블릿 dock 'chat', 폰 탭 'Study Log') 내용 — 이번 주 학습장 목록.
 * 답해야 할 에이전트 안내가 있을 때만 그 카드(InstructionCard)를 목록 위에 고정한다. 지난 메시지 기록은 두지 않는다.
 * 설계: docs/superpowers/specs/2026-11-15-study-log-review-design.md §4.
 */
import { StyleSheet, View } from 'react-native';
import { createStudyLogFetchers } from '../adapters/studyLogFetchers';
import { topicFetchers } from '../host/widgets';
import { StudyNoteReviewList } from '../kit/study-log/StudyNoteReviewList';
import { space } from '../ui/theme';
import type { Instruction } from './commandRouter';
import { InstructionCard } from './InstructionCard';
import type { AgentSession, SessionSnapshot } from './session';

const studyLogFetchers = createStudyLogFetchers();
const fetchTopicTitle = async (topicId: number) => (await topicFetchers.fetchTopic(topicId)).title;

/** 학생이 답해야 할 안내 — 응답이 필요하거나 고를 선택지가 있다 */
export function awaitsAnswer(ins: Instruction | null | undefined): ins is Instruction {
  return !!ins && (ins.requiresResponse || ins.choices.length > 0);
}

export function StudyLogPanel({ state, session, refreshKey }: { state: SessionSnapshot; session: AgentSession; refreshKey: number }) {
  const ins = state.instruction;
  return (
    <View style={styles.root}>
      {awaitsAnswer(ins) ? (
        <View style={styles.pinned}>
          <InstructionCard
            instruction={ins}
            paused={state.pausedDefault !== null}
            onChoice={(id) => session.selectChoice(ins.messageId, id)}
            onDismiss={() => session.dismissInstruction(ins.messageId)}
          />
        </View>
      ) : null}
      <View style={styles.body}>
        <StudyNoteReviewList fetchers={studyLogFetchers} refreshKey={refreshKey} fetchTopicTitle={fetchTopicTitle} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pinned: { padding: space.md },
  body: { flex: 1 },
});
