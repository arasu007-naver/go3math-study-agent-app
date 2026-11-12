import React, { useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  StyleProp,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

const BLOB_PREFIX =
  'https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer/math-files/images';

export interface MathJaxWrapperProps {
  iPath?: string;
  statement?: string;
  titleStatement?: string;
  fontSize?: number;
  fontWeight?: TextStyle['fontWeight'];
  color?: string;
  /** fullView 배경색 (기본 흰색) */
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
  fullView?: boolean;
  inline?: boolean;
  /** fullView에서 렌더링된 내용 크기에 맞춰 WebView 크기를 조절 (최대 폭: maxWidth) */
  autoSize?: boolean;
  maxWidth?: number;
}

/**
 * HTML 엔티티 및 태그를 정리하고 수학 기호를 텍스트 기호로 변환하는 헬퍼
 */
export function cleanMathText(raw: string = ''): string {
  if (!raw) return '';
  let str = String(raw);

  // 1) HTML 엔티티 디코딩
  str = str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ');

  // 2) HTML 태그 제거
  str = str
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<[^>]+>/g, '');

  // 3) 자주 쓰이는 LaTeX/수학 기호 변환
  str = str
    .replace(/\\le\b/g, '≤')
    .replace(/\\ge\b/g, '≥')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\pm\b/g, '±')
    .replace(/\\mp\b/g, '∓')
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)')
    .replace(/\\sqrt\b/g, '√')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/`/g, '')
    .replace(/\$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return str;
}

/**
 * hwp-img-id 이미지를 Azure Blob URL로 치환
 */
function processHtmlImages(html: string = '', iPath: string = ''): string {
  if (!html) return '';
  return html.replace(
    /<img[^>]*hwp-img-id=["'\\]*([0-9a-zA-Z_-]+)["'\\]*[^>]*>/gi,
    (match, id) => {
      const src = `${BLOB_PREFIX}/${iPath}/${id}.jpg`;
      return `<img src="${src}" alt="개념 그림" style="max-width: 100%; height: auto; display: block; margin: 12px auto; border-radius: 8px;" />`;
    }
  );
}

/**
 * MathJax WebView용 전체 HTML 문서 생성
 */
export function buildMathJaxHtmlDocument({
  title = '',
  statement = '',
  iPath = '',
  fontSize = 15,
  color = '#1f2937',
  backgroundColor = '#ffffff',
  compact = false,
}: {
  title?: string;
  statement?: string;
  iPath?: string;
  fontSize?: number;
  color?: string;
  backgroundColor?: string;
  compact?: boolean;
}): string {
  const processedTitle = processHtmlImages(title, iPath);
  const processedStatement = processHtmlImages(statement, iPath);

  // compact: 여백을 없애고, MathJax 렌더링 후 내용 크기를 RN으로 전달
  const compactStyle = compact
    ? `
        body { padding: 0; }
        .concept-statement-card { display: inline-block; padding: 4px 8px; border: none; background-color: transparent; color: ${color}; white-space: nowrap; word-break: keep-all; }
      `
    : '';
  const compactStartup = compact
    ? `,
          startup: {
            pageReady: function () {
              return MathJax.startup.defaultPageReady().then(function () {
                var rect = document.querySelector('.concept-statement-card').getBoundingClientRect();
                if (rect.width > 0 && rect.height > 0) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'content_size',
                    width: Math.ceil(rect.width),
                    height: Math.ceil(rect.height)
                  }));
                }
              });
            }
          }`
    : '';

  return `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
      <title>Math Concept</title>
      <script>
        window.MathJax = {
          loader: { load: ['input/asciimath', 'input/tex', 'output/chtml'] },
          asciimath: {
            delimiters: [['\`', '\`']]
          },
          tex: {
            inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
            displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
            processEscapes: true
          },
          chtml: {
            displayAlign: 'left'
          }${compactStartup}
        };
      </script>
      <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/startup.js" async></script>
      <style>
        * {
          box-sizing: border-box;
          -webkit-user-select: none;
        }
        body {
          margin: 0;
          padding: 14px 12px 32px 12px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
          font-size: ${fontSize}px;
          line-height: 1.65;
          color: ${color};
          background-color: ${backgroundColor};
          word-break: keep-all;
          overflow-wrap: break-word;
        }
        .concept-title-card {
          background-color: #fff7ed;
          border-left: 4px solid #ea580c;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 16px;
          font-weight: 700;
          color: #ea580c;
          margin-bottom: 12px;
        }
        .concept-statement-card {
          background-color: #f9fafb;
          border: 1.5px solid #fed7aa;
          border-radius: 12px;
          padding: 14px;
          font-size: ${fontSize}px;
          color: #1f2937;
        }
        p {
          margin: 0 0 8px 0;
        }
        p:last-child {
          margin-bottom: 0;
        }
        img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 12px auto;
          border-radius: 6px;
        }
        .mjx-chtml {
          outline: none !important;
        }
        .empty-desc {
          color: #9ca3af;
          text-align: center;
          padding: 16px 0;
          font-size: 13px;
        }
        ${compactStyle}
      </style>
    </head>
    <body>
      ${processedTitle
      ? `<div class="concept-title-card">${processedTitle}</div>`
      : ''
    }
      <div class="concept-statement-card">
        ${processedStatement
      ? processedStatement
      : '<div class="empty-desc">상세 설명이 준비 중인 개념입니다.</div>'
    }
      </div>
    </body>
    </html>
  `;
}

export default function MathJaxWrapper({
  iPath = '',
  statement = '',
  titleStatement = '',
  fontSize = 14,
  fontWeight = 'normal',
  color = '#1f2937',
  backgroundColor = '#ffffff',
  style,
  fullView = false,
  inline = true,
  autoSize = false,
  maxWidth = 480,
}: MathJaxWrapperProps) {
  const [contentSize, setContentSize] = useState<{ width: number; height: number } | null>(null);

  // 1) 인라인 모드: 칩/버튼 내부에서 즉시 텍스트 표시
  if (!fullView && inline) {
    const displayText = cleanMathText(statement);
    return (
      <View style={[styles.inlineContainer, style]}>
        <Text
          style={[
            styles.inlineText,
            {
              fontSize,
              fontWeight,
              color,
            },
          ]}
          numberOfLines={2}
        >
          {displayText || statement}
        </Text>
      </View>
    );
  }

  // 2) FullView 모드: 모달 등에서 전체 수식 + 이미지 + 텍스트를 WebView로 렌더링
  const htmlSource = buildMathJaxHtmlDocument({
    title: titleStatement,
    statement,
    iPath,
    fontSize,
    color,
    backgroundColor,
    compact: autoSize,
  });

  // autoSize: 측정 전에는 maxWidth 폭으로 렌더링한 뒤, 측정된 내용 크기로 줄임
  const autoSizeStyle = autoSize
    ? contentSize
      ? { flex: 0, width: Math.min(contentSize.width, maxWidth), height: contentSize.height }
      : { flex: 0, width: maxWidth, height: Math.ceil(fontSize * 1.8) }
    : null;

  return (
    <View style={[styles.fullViewContainer, { backgroundColor }, style, autoSizeStyle]}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlSource }}
        onMessage={autoSize ? (event: WebViewMessageEvent) => {
          const message = JSON.parse(event.nativeEvent.data);
          if (message.type === 'content_size') {
            setContentSize({ width: message.width, height: message.height });
          }
        } : undefined}
        style={[styles.webView, { backgroundColor }]}
        scrollEnabled={true}
        showsVerticalScrollIndicator={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={[styles.loadingOverlay, { backgroundColor }]}>
            <ActivityIndicator size="small" color="#ea580c" />
            <Text style={styles.loadingText}>수식 렌더링 중...</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inlineContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineText: {
    textAlign: 'center',
  },
  fullViewContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  webView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  loadingText: {
    fontSize: 12,
    color: '#ea580c',
    marginLeft: 8,
    fontWeight: '500',
  },
});
