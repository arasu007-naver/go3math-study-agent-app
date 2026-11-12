/**
 * 해답 말풍선 — 문제 목록(ProblemListPanel) 위에 떠서 해답 페이지(WebView)를 보인다.
 * 말꼬리가 해당 문항을 가리키고, 문항은 가리지 않는다(자리는 placeAnswerBubble이 정한다).
 */
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, radius, shadow, z } from '../../ui/theme';
import Go3MathLoader from '../ui/loading-view';
import { BUBBLE_TAIL, type BubblePlacement } from './answerBubblePlacement';

const TAIL_SIZE = BUBBLE_TAIL * 1.6; // 45° 돌린 정사각형 — 절반(대각선의 반 ≈ BUBBLE_TAIL)이 말풍선 밖으로 나온다

export function AnswerBubble({ url, placement }: { url: string; placement: BubblePlacement }) {
  const { left, top, width, height, tailSide, tailOffset } = placement;
  const along = tailOffset - TAIL_SIZE / 2;
  const tailPosition =
    tailSide === 'left' || tailSide === 'right' ? { [tailSide]: -TAIL_SIZE / 2, top: along } : { [tailSide]: -TAIL_SIZE / 2, left: along };

  return (
    <View testID="answer-bubble" accessibilityLabel="해답" style={[styles.bubble, { left, top, width, height }]}>
      <View testID="answer-bubble-tail" style={[styles.tail, tailPosition]} />
      <View style={styles.body}>
        <WebView
          originWhitelist={['*']}
          source={{ uri: url }}
          style={styles.fullSize}
          startInLoadingState
          nestedScrollEnabled
          renderLoading={() => <Go3MathLoader style={styles.fullSize} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: { position: 'absolute', zIndex: z.modal, borderRadius: radius.md, backgroundColor: colors.card, ...shadow.float },
  tail: {
    position: 'absolute',
    width: TAIL_SIZE,
    height: TAIL_SIZE,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  // 말꼬리의 안쪽 절반을 덮는다
  body: { flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.accent },
  fullSize: { width: '100%', height: '100%' },
});
