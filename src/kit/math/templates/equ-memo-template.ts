export const memoMathJaxHtml = (mathExpressions=[]) => {
    // MathJax 설정 (Tex-CHTML 출력)
    // inlineMath: [['$', '$']]를 추가하여 $...$를 인라인 수식으로 인식하게 함
    const equations  = mathExpressions.map((equ, index) => '<div class="equ-container">'+equ+'</div>');
    const result = equations.join(' ');
    // console.log('equation result: result:', result);
    const config = ` {
            loader: {
                load: ['input/asciimath', 'input/tex', 'output/chtml']
            },
            tex: {
                inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                processEscapes: true
            },
            asciimath: {
                delimiters: [
                    ["\`", "\`"]
                ]
            }
        }`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MathJax Preview</title>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/startup.js"></script>
        <script>
          // MathJax 설정
          MathJax = ${config};

          // MathJax가 로드된 후 렌더링을 트리거할 수 있습니다.
          // 여기서는 페이지 로드 시 자동으로 렌더링되므로, 별도 호출은 필요 없을 수 있습니다.
          // 동적으로 내용이 변경되면 MathJax.typeset() 또는 MathJax.typesetPromise()를 호출해야 합니다.
        </script>
        <style>
          body {
            font-family: sans-serif;
            margin: 0;
            display: flex;
            justify-content: flex-start;
            align-items: flex-start;
            min-height: 100vh; /* 뷰포트 높이만큼 최소 높이 설정 */
            overflow: auto; /* 내용이 넘칠 경우 스크롤 */
            background-color: transparent; /* 웹뷰 배경 투명하게 */
          }
          #math-container {
            padding: 10px;
            /* 긴 수식 줄바꿈을 위한 CSS */
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .equ-container {
            border-style: solid;
            border-width: 8px;
            border-color: orange;
            border-radius: 9px;
            padding: 6px;
            font-size: 36px;
            font-weight: bold;
            color: orangered;
          }
        </style>
      </head>
      <body>
        <div id="math-container">
          ${result}
        </div>
      </body>
      </html>
    `;
  };