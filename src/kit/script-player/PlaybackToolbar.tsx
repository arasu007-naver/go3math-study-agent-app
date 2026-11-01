/**
 * 재생 툴바 — 기존 `pages/notebook/topic-note/components/PlaybackToolbar.tsx` 이식.
 * 바뀐 점: navigation.goBack() 대신 onExit 콜백(에이전트 주도라 back_requested로 올림),
 * 모듈 레벨 Dimensions 폭 대신 부모 폭을 따르는 레이아웃.
 * design-spec P2-1: 버튼 줄은 PlaybackControls로 분리했고, PlaybackToolbar는 FloatingToolbar 재생 모드를 감싸는 호환 래퍼다.
 */
import type { FC } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingToolbar } from '../canvas/FloatingToolbar';
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

/** 재생 버튼 줄(컨테이너 스타일 없음) — FloatingToolbar의 재생 모드가 그대로 담는다 */
export const PlaybackControls: FC<Props> = ({
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
  const exitFeedbackMode = async () => {
    if (feedbackMode) {
      setFeedbackMode(false);
      await sleep(36);
    }
  };

  return (
    <>
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
    </>
  );
};

export const PlaybackToolbar: FC<Props> = (props) => {
  const insets = useSafeAreaInsets();
  return <FloatingToolbar mode="playback" playback={props} insets={{ left: 0, right: 0, bottom: insets.bottom }} />;
};
