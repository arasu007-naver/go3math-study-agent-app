// @ts-nocheck
/* eslint-disable react/display-name, no-var, react/jsx-key -- 기존 코드를 그대로 옮긴 파일 */
// 기존 qoolla-student-app `src/components/math-web-view/index.tsx`를 그대로 옮김(note-canvas 전이용, import 경로만 맞춤).
// src/components/MathJaxView.tsx
import React, { useRef, useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import * as _ from 'lodash'
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import Go3MathLoader from '../../ui/loading-view';
// HTML 템플릿 파일을 직접 임포트합니다.
// React Native bundler가 이를 문자열로 변환합니다.
// @ts-ignore
import {memoMathJaxHtml} from '../../math/templates/equ-memo-template';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const ActivityIndicatorElement = () => {
    return (
        <Go3MathLoader style={{ width: '100%', heiht: '100%' }} />
    );
};
const injectedJavaScriptOnLoad = `
    (function() {
      // DOMContentLoaded 이벤트는 onLoadEnd보다 먼저 발생할 수 있으므로,
      // 페이지가 완전히 로드된 후에 실행되도록 setTimeout을 사용하거나
      // body.onload 이벤트에 연결하는 것이 더 안전할 수 있습니다.
      // 여기서는 onLoadEnd에 injectJavaScript를 사용하므로 바로 실행됩니다.
      
      const container = document.getElementById('statement-container');
      
      if (container) {
        // offsetWidth와 offsetHeight를 가져옵니다.
        const width = container.offsetWidth;
        const height = container.offsetHeight;

        // 크기 정보를 JSON 문자열로 변환하여 React Native로 보냅니다.
        // window.ReactNativeWebView.postMessage는 React Native로 메시지를 보내는 유일한 방법입니다.
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'container_dimensions',
          data: { width, height }
        }));
      } else {
        // 요소가 없을 경우 에러 메시지를 보냅니다.
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: "Element with ID 'statement-container' not found."
        }));
      }
    })();
    true; // injectedJavaScript must return a value
  `;

const MathJaxView = ({ memoMessage}) => {
    const isFocused = useIsFocused();
    const webViewRef = useRef<WebView>(null);
    const [webViewLoaded, setWebViewLoaded] = useState(false);
    const [mathJaxReady, setMathJaxReady] = useState(false);
    const [contentHeight, setContentHeight] = useState(screenHeight/2-96); // 동적 높이 조절용 초기값
    const [pageLoadProgress, setPageLoadProgress] = useState(0);
    const [memos, setMemos] = useState([])
    // WebView에서 메시지를 수신하는 핸들러
    const onMessage = (event: any) => {
        console.log('🟡🟡🟡🟡🟡 message from webview: ', event)
    };


    // MathJax 수식이 변경되거나 MathJax가 준비되면 다시 주입
    useEffect(() => {
        if (isFocused) {
            // MathJax가 준비된 후에만 수식 주입
            console.log('toast focused')
            if(memoMessage){

              const content = JSON.parse(memoMessage );
              const ms = _.filter(content.memos, (itm, index)=>content.selections.includes(index))
              setMemos(ms);
            }
        }
    }, [isFocused]);


    return (
        <View style={[styles.webViewContainer, { height: contentHeight }]}>
            <WebView
                originWhitelist={['*']}
                source={{ html: memoMathJaxHtml(memos) }}
                style={{ flex: 1,  width: screenWidth * (2 / 3) - 36, backgroundColor: 'gray'}}
                onLoadStart={() => setPageLoadProgress(0)}
                startInLoadingState={true}
                nestedScrollEnabled={true}
                javaScriptEnabled={true}
                onMessage={onMessage}
                renderLoading={ActivityIndicatorElement}
                onLoadProgress={({ nativeEvent }) => { console.log(nativeEvent.progress); setPageLoadProgress(nativeEvent.progress) }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    webViewContainer: {
        width: screenWidth * (2 / 3) - 48, // 화면 너비에서 여백을 제외한 크기
        backgroundColor: 'transparent',
        overflow: 'hidden',
        minHeight: 100, // 최소 높이
    },
    webView: {
        flex: 1,
        opacity: 1, // 로딩 오버레이가 위에 있을 때도 보이기 위해
        padding: 9,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1, // WebView 위에 오도록
    },
});

export default MathJaxView;