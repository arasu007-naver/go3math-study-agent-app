export const mathEquViewTemplate = () => {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>MathJax WebView</title>
    <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/startup.js"></script>
    
    <style>
        body { margin: 0; padding: 10px; font-family: sans-serif; -webkit-touch-callout: none; -webkit-user-select: none; font-size: 48px; font-weight: bold;}
        .math-content {
            font-size: 18px; /* 기본 텍스트 크기 */
            line-height: 1.5;
            color: #333;
            /* MathJax 렌더링에 맞게 스타일 조정 */
        }
        .memo-container {
            border: 3px solid orangered;
            border-radius: 9px;
            ackground-color: #fff;
            margin-bottom: 10px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
    </style>
</head>
<body>
    <div id="math-container" class="math-content">
     \`|x|>2\`일 때, <br/>
      \`f(x)={3}/{2}x\`
    </div>
    <script type="text/x-mathjax-config">
        // MathJax 설정
        MathJax = {
            loader: {
                load: ['input/asciimath', 'input/tex', 'output/chtml']
            },
            tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true
            },
            asciimath: {
                delimiters: [['\`', '\`']]
            },
            startup: {
                // MathJax가 준비되면 호출될 함수
                ready: function() {
                    // MathJax가 로드되고 초기 설정이 완료되었음을 React Native로 알림
                    if (ReactNativeWebView) {
                        ReactNativeWebView.postMessage('MathJax_Ready');
                    } else {
                        // 웹 환경에서 테스트할 경우
                        console.log('MathJax Ready in Web Environment');
                    }
                }
            }
        };
    </script>
</body>

</html>
`}

export const memoTemplate = (memo: string) =>{
    return `<div>
    ${memo}
    </div>
`}