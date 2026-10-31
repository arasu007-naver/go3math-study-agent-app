/**
 * 재생 툴바 — 기존 `pages/notebook/topic-note/components/PlaybackToolbar.tsx` 이식.
 * 바뀐 점: navigation.goBack() 대신 onExit 콜백(에이전트 주도라 back_requested로 올림),
 * 모듈 레벨 Dimensions 폭 대신 부모 폭을 따르는 레이아웃.
 */
import type { FC } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GoButton from '../ui/go-button';
import { sleep } from './useScriptPlayer';

type Props = {
  startIdx: number;
  currentCutIdx: number;
  subCutMode: string;
  totalCuts: number | undefined;
  feedbackMode: boolean;
  setFeedbackMode: (v: boolean) => void;
  onExit: () => void;
  onRangePlay: () => void;
  onReplay: () => void;
  onBackward: () => void;
  onPlay: () => void;
  onShowWorkouts: () => void;
};

export const PlaybackToolbar: FC<Props> = ({
  startIdx,
  currentCutIdx,
  subCutMode,
  totalCuts,
  feedbackMode,
  setFeedbackMode,
  onExit,
  onRangePlay,
  onReplay,
  onBackward,
  onPlay,
  onShowWorkouts,
}) => {
  const insets = useSafeAreaInsets();

  const exitFeedbackMode = async () => {
    if (feedbackMode) {
      setFeedbackMode(false);
      await sleep(36);
    }
  };

  return (
    <ScrollView
      horizontal={true}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.buttonContainerStyle}
      style={[styles.horizontalScrollView, { marginBottom: Math.max(insets.bottom, 12) }]}>
      <GoButton title={'나가기'} onPress={onExit} />
      <GoButton title={'내 이전 풀이'} onPress={onShowWorkouts} />
      <GoButton
        title={'⏩ ' + startIdx + ' >> ' + (currentCutIdx + 1)}
        onPress={async () => {
          await exitFeedbackMode();
          onRangePlay();
        }}
      />
      <GoButton
        title={currentCutIdx + 1 + ' / ' + subCutMode + '/' + (totalCuts ?? 0)}
        onPress={async () => {
          await exitFeedbackMode();
          onReplay();
        }}
      />
      <GoButton
        title={'◀️'}
        onPress={async () => {
          await exitFeedbackMode();
          onBackward();
        }}
      />
      <GoButton
        title={'▶️'}
        onPress={async () => {
          await exitFeedbackMode();
          onPlay();
        }}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  buttonContainerStyle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', flexGrow: 1 },
  horizontalScrollView: { maxHeight: 48, height: 36, padding: 3, alignSelf: 'stretch', marginHorizontal: 16 },
});
