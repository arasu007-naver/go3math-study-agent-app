/**
 * 캔버스 '개념·해답' 시트의 '해답/내용' 탭 내용 — 풀이 화면과 실황 수업 화면이 같이 쓴다.
 * 현재 문제가 개념(MATH_CONCEPT·CONCEPT)이면 개념 설명(내용)을, 아니면 해답 페이지를 개념 설명과 같은 상자 모양으로 보인다.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { UNITANSWER } from '../../config/api.constants';
import { colors, radius } from '../../ui/theme';
import { ConceptStatement, isConceptType, type ConceptBody } from '../concepts/ConceptStatement';
import { ANSWER_PAGE_STYLE_JS } from '../ui/answerPageStyle';
import Go3MathLoader from '../ui/loading-view';

export function CanvasAnswer({
  sourceType,
  sourceId,
  fetchConcept,
}: {
  sourceType: string;
  sourceId: string | number;
  fetchConcept(conceptId: number): Promise<ConceptBody>;
}) {
  const [pageLoadProgress, setPageLoadProgress] = useState(0);
  const answerUrl = UNITANSWER(sourceType, sourceId);

  return (
    <View style={styles.row}>
      <View style={styles.pane}>
        {isConceptType(sourceType) ? (
          <ConceptStatement key={sourceId} conceptId={Number(sourceId)} fetchConcept={fetchConcept} />
        ) : answerUrl ? (
          <WebView
            originWhitelist={['*']}
            source={{ uri: answerUrl }}
            injectedJavaScript={ANSWER_PAGE_STYLE_JS}
            // 다 불러올 때까지 숨긴다(스타일을 입히기 전 모습이 비치지 않게)
            style={[styles.fullSize, { opacity: pageLoadProgress < 1 ? 0 : 1 }]}
            onLoadStart={() => setPageLoadProgress(0)}
            startInLoadingState
            nestedScrollEnabled
            renderLoading={() => <Go3MathLoader style={styles.fullSize} />}
            onLoadProgress={({ nativeEvent }) => setPageLoadProgress(nativeEvent.progress)}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 시트 높이(보기·넓게)를 내용이 채운다(고정 높이 대신 flex)
  row: { flex: 1, flexDirection: 'row', width: '100%' },
  pane: { flex: 1, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card },
  fullSize: { flex: 1, width: '100%', height: '100%' },
});
