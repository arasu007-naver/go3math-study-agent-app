// 웹: react-native-pdf가 없으므로 브라우저 PDF 뷰어(iframe)로 연다. 비밀번호 PDF는 브라우저가 비밀번호를 묻는다.
import { createElement } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { PdfDoc } from './PdfViewerModal';

export type { PdfDoc };

export function PdfViewerModal({ doc, onClose }: { doc: PdfDoc | null; onClose(): void }) {
  const { width, height } = useWindowDimensions();
  return (
    <Modal visible={!!doc} transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.root, { maxWidth: width * 0.6, maxHeight: height * 0.8 }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{doc?.password ? `비밀번호: ${doc.password}` : 'PDF'}</Text>
            <Pressable accessibilityRole="button" onPress={onClose}>
              <Text style={styles.closeText}>닫기</Text>
            </Pressable>
          </View>
          {doc && createElement('iframe', { src: doc.url, style: { flex: 1, border: 0, width: '100%', height: '100%' } })}
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
  closeText: { fontSize: 15, color: 'orange', fontWeight: '700' },
});
