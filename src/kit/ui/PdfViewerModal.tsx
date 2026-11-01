/**
 * PDF 보기 모달 — 기존 `pages/share/pdf-view.tsx`(react-native-pdf, 비밀번호 PDF)를 화면 이동 대신 모달로.
 * 보존: 상단에 '비밀번호: …' 표시, 비밀번호로 PDF 열기, 캐시 사용. 바뀐 점: 닫기 버튼, 광고 래퍼 제외,
 * 화면 가운데 창(최대 화면 폭 60% · 높이 80%).
 */
import { useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Pdf from 'react-native-pdf';

export type PdfDoc = { url: string; password?: string | null };

export function PdfViewerModal({ doc, onClose }: { doc: PdfDoc | null; onClose(): void }) {
  const [error, setError] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();

  return (
    <Modal visible={!!doc} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose} onShow={() => setError(null)}>
      <View style={styles.backdrop}>
        <View style={[styles.root, { maxWidth: width * 0.6, maxHeight: height * 0.8 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{doc?.password ? `비밀번호: ${doc.password}` : 'PDF'}</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.close}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>
          {error ? (
            <Text style={styles.error}>PDF를 열지 못했어요. ({error})</Text>
          ) : (
            doc && (
              <Pdf
                source={{ uri: doc.url, cache: true }}
                // 기본값 true는 react-native-blob-util 0.25에서 "Use of own trust manager but none defined"로 실패한다. 인증서 검사는 기본대로.
                trustAllCerts={false}
                password={doc.password ?? undefined}
                renderActivityIndicator={() => <ActivityIndicator color="orange" />}
                onError={(e) => setError(String((e as Error)?.message ?? e))}
                style={styles.pdf}
              />
            )
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.4)' },
  root: { width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  header: { height: 52, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: 'orange' },
  title: { flex: 1, fontSize: 16, fontWeight: '700', color: '#18181B' },
  close: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center', borderRadius: 22, borderWidth: 1, borderColor: 'orange' },
  closeText: { fontSize: 15, color: 'orange', fontWeight: '700' },
  pdf: { flex: 1, backgroundColor: '#F4F4F5' },
  error: { padding: 24, fontSize: 14, color: '#52525B' },
});
