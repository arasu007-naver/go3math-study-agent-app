/** 문제 이미지(풀이 배경) 높이 상한 — 캔버스 좌표 기준 px */
export const NOTEBOOK_BG_MAX_HEIGHT = 1440;

/**
 * 캔버스 템플릿(WebView 안)에 그대로 넣는 배경 스케일 함수 소스.
 * 기본은 기존대로 너비 기준(캔버스 폭의 절반). 그렇게 맞춘 높이가 상한을 넘는 세로로 긴 이미지는
 * 높이가 NOTEBOOK_BG_MAX_HEIGHT가 되도록 높이 기준으로 줄인다.
 * Hermes 릴리스 빌드는 Function.toString()이 소스를 주지 않으므로 함수를 문자열로 둔다.
 */
export const NOTEBOOK_BG_SCALE_JS = `
function notebookBackgroundScale(canvasWidth, imgWidth, imgHeight) {
    var scale = canvasWidth / (2 * imgWidth);
    if (imgHeight * scale > ${NOTEBOOK_BG_MAX_HEIGHT}) {
        scale = ${NOTEBOOK_BG_MAX_HEIGHT} / imgHeight;
    }
    return scale;
}
// 문제 배경 위치: 기존 qoolla-student-app 캔버스(live-class/topic)와 같은 top = left = 10 × (캔버스 높이 / 1920)
function notebookBackgroundOffset(canvasHeight) {
    return 10 * canvasHeight / 1920;
}
`;
