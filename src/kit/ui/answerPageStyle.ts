/**
 * 해답 페이지(WebView)에 넣는 스타일 — 개념 설명(MathJaxWrapper의 concept-statement-card)과 같은 상자로 보이게 한다:
 * 같은 바깥 여백(시작 위치), 연주황 테두리, 둥근 모서리, 옅은 회색 바탕. 글자 크기는 해답 페이지 것을 그대로 둔다.
 * 해답 페이지가 body에 직접 준 폭·여백(가운데 정렬)을 덮어써야 해서 !important를 쓴다.
 * WebView의 injectedJavaScript로 넘긴다(마지막 true는 Android WebView가 요구하는 반환값).
 */
export const ANSWER_PAGE_STYLE_JS = `(function () {
  var s = document.createElement('style');
  s.textContent =
    'html{background-color:#ffffff}' +
    'body{margin:14px 12px 32px 12px !important;padding:14px !important;border:1.5px solid #fed7aa;border-radius:12px;background-color:#f9fafb;box-sizing:border-box;width:auto !important;max-width:none !important}';
  document.head.appendChild(s);
})();
true;`;

/** 개념 설명(내용)의 글자 크기(px). 해답 말풍선도 이 크기에 맞춘다 */
export const STATEMENT_FONT_SIZE = 15;

/**
 * Stage 문제 목록의 해답 말풍선용 — 해답 페이지 글자 크기를 개념 '내용' 말풍선과 같게 맞춘다.
 * 페이지가 body에 직접 준 크기(24px)를 덮어쓴다. 수식(MathJax)은 글자 크기를 따라 같이 줄어든다.
 */
export const ANSWER_BUBBLE_FONT_JS = `(function () {
  document.body.style.fontSize = '${STATEMENT_FONT_SIZE}px';
})();
true;`;
