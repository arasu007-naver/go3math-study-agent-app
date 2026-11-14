/**
 * 개념 설명만(제목 없이) — 개념 패널에서 개념을 눌렀을 때 보이는 내용 중 설명 부분과 같은 렌더러.
 * 개념 번호만 아는 곳(내 책갈피의 '내용' 말풍선, 캔버스 '해답/내용' 탭)에서 설명을 받아 와 그린다.
 */
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '../../ui/theme';
import MathJaxWrapper from '../math/MathJaxWrapper';
import { STATEMENT_FONT_SIZE } from '../ui/answerPageStyle';

export type ConceptBody = { rawStatement?: string | null; imgPath?: string | null };

/** 문제 종류가 개념인지 — 개념은 '해답' 대신 '내용'(개념 설명)을 보인다 */
export const isConceptType = (sourceType: string) => sourceType === 'MATH_CONCEPT' || sourceType === 'CONCEPT';

export function ConceptStatement({
  conceptId,
  fetchConcept,
  plain = false,
}: {
  conceptId: number;
  fetchConcept(conceptId: number): Promise<ConceptBody>;
  /** 설명 상자의 테두리·바탕을 없앤다(말풍선처럼 이미 테두리가 있는 곳) */
  plain?: boolean;
}) {
  const [body, setBody] = useState<ConceptBody | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchConcept(conceptId)
      .then((c) => alive && setBody(c ?? {}))
      .catch((e) => {
        console.warn('[ConceptStatement] fetchConcept failed:', e);
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [conceptId, fetchConcept]);

  if (failed) return <Text style={styles.message}>개념 내용을 불러오지 못했어요.</Text>;
  if (!body) return <ActivityIndicator style={styles.loading} color={colors.accent} />;
  return <MathJaxWrapper iPath={body.imgPath ?? ''} statement={body.rawStatement ?? ''} fontSize={STATEMENT_FONT_SIZE} color={colors.text} fullView plain={plain} />;
}

const styles = StyleSheet.create({
  message: { padding: 24, fontSize: 14, color: colors.subtle },
  loading: { padding: 32 },
});
