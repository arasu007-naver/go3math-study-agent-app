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
