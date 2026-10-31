export const mathEquMemoViewTemplate = (memos: string[]) => {
    const memosWrapper = memos.map((memo: string, index: number)=> '<div class="memo-container>'+memo+'</div>')
    return `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>MathJax WebView</title>
    <script src="https://cdnjs.cloudflare.com/polyfill/v3/polyfill.min.js?features=es6"></script>
    <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/startup.js"></script>
    <script type="text/x-mathjax-config">
        MathJax = {
            loader: {
                    load: ['input/asciimath', 'input/tex', 'output/chtml']
            },
            tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']], // 인라인 수식 구분자
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']], // 블록 수식 구분자
                processEscapes: true,
                packages: {'[+]': ['ams']} // AMS 패키지 로드 (선택 사항)
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
    <style>
        body { margin: 0; padding: 10px; font-family: sans-serif; -webkit-touch-callout: none; -webkit-user-select: none; font-size: 48px; font-weight: bold;}
        .math-content {
            font-size: 18px; /* 기본 텍스트 크기 */
            line-height: 1.5;
            color: #333;
            /* MathJax 렌더링에 맞게 스타일 조정 */
        }
        .memo-container {
            border: 6px solid orangered;
            border-radius: 12px;
            background-color: #fff;
            margin-bottom: 10px;
            max-width: 720px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        }
    </style>
</head>
<body>
    
<div> \`|x|>2\`일 때, <br/>
      \`f(x)={3}/{2}x\`</div>
    <script>
    // MathJax 설정
    
    if (navigator.appVersion.includes('Android')) {
        document.addEventListener("message", function (data) {
            console.log('webview feedback template: ', data)
            alert('message received')
        });
    }
    else {
        addEventListener("message", function (data) {
            let action = JSON.parse(data.data);
        });
    }
    </script>
</body>
</html>
`}

export const memoTemplate = (memos: string[]) =>{
    const result = mathEquMemoViewTemplate(memos);
    console.log('🟡🟡🟡 mathjax template: ', result)
    return result
}