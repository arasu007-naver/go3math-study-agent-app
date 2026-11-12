/**
 * 칩 전용 한 줄 수식 레이블. 수식 구분자(` 또는 $, \( )가 없으면 일반 Text로 그리고,
 * 있으면 여백 없는 투명 WebView에서 MathJax로 그린 뒤 내용 크기만큼만 자리를 차지한다(칩 높이가 늘지 않는다).
 * 크기를 재기 전에는 기호만 바꾼 텍스트를 대신 보여 준다. 터치는 받지 않는다 — 감싼 칩이 눌린다.
 */
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { cleanMathText } from './MathJaxWrapper';

const FONT_SIZE = 13;
const LINE_HEIGHT = 18;

export const hasMath = (s: string) => /[`$]|\\\(/.test(s);

export function buildMathChipHtml(label: string, color: string): string {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<script>
  window.MathJax = {
    loader: { load: ['input/asciimath', 'input/tex', 'output/chtml'] },
    asciimath: { delimiters: [['\`', '\`']] },
    tex: { inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], processEscapes: true },
    startup: {
      pageReady: function () {
        return MathJax.startup.defaultPageReady().then(function () {
          var rect = document.getElementById('label').getBoundingClientRect();
          window.ReactNativeWebView.postMessage(JSON.stringify({ width: Math.ceil(rect.width) + 1, height: Math.ceil(rect.height) }));
        });
      }
    }
  };
</script>
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/startup.js" async></script>
<style>
  html, body { margin: 0; padding: 0; background: transparent; overflow: hidden; }
  #label {
    display: inline-block;
    white-space: nowrap;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: ${FONT_SIZE}px;
    font-weight: 600;
    line-height: ${LINE_HEIGHT}px;
    color: ${color};
  }
</style>
</head>
<body><span id="label">${label}</span></body>
</html>`;
}

export function MathChipLabel({ label, color }: { label: string; color: string }) {
  const [size, setSize] = useState<{ width: number; height: number; marginVertical: number } | null>(null);
  const textStyle = [styles.text, { color }];

  if (!hasMath(label)) return <Text style={textStyle}>{cleanMathText(label)}</Text>;

  return (
    <View pointerEvents="none">
      {!size && <Text style={textStyle}>{cleanMathText(label)}</Text>}
      {/* key로 WebView를 그대로 둔다 — 크기를 잰 뒤 다시 불러오지 않게 */}
      <View key="math" style={size ?? styles.measuring}>
        <WebView
          originWhitelist={['*']}
          source={{ html: buildMathChipHtml(label, color) }}
          onMessage={(e: WebViewMessageEvent) => {
            const m = JSON.parse(e.nativeEvent.data);
            // 수식 줄은 글자 줄보다 조금 높다 — 넘치는 만큼 음수 여백을 줘 칩 높이를 텍스트 칩과 같게 한다
            if (m.width > 0 && m.height > 0) setSize({ width: m.width, height: m.height, marginVertical: (LINE_HEIGHT - m.height) / 2 });
          }}
          style={styles.webView}
          scrollEnabled={false}
          javaScriptEnabled={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: FONT_SIZE, lineHeight: LINE_HEIGHT, fontWeight: '600' },
  // 크기를 재는 동안: 보이지 않게, 줄바꿈되지 않을 만큼 넓게
  measuring: { position: 'absolute', opacity: 0, width: 600, height: LINE_HEIGHT },
  webView: { flex: 1, backgroundColor: 'transparent' },
});
