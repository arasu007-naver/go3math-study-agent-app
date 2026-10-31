/**
 * 캔버스 템플릿 공통 베이스
 *
 * 모든 캔버스 템플릿(topic, live-class, whiteboard)이 공유하는
 * HTML 구조, CSS, FabricJS 로딩, 초기화 변수를 제공합니다.
 *
 * 사용 예:
 *   import { buildCanvasTemplate, getCanvasInitVars } from './canvas-template-base';
 *
 *   export default (width, height) => buildCanvasTemplate({
 *       width, height,
 *       extraInitVars: `canvas.isDrawingMode = true;`,
 *       scriptBody: `...고유 로직...`,
 *   });
 */

const FABRIC_JS_CDN = 'https://cdn.jsdelivr.net/npm/fabric@4.3.0/dist/fabric.min.js';

type CanvasTemplateOptions = {
    width: number;
    height: number;
    /** 캔버스 초기화 이후 추가할 변수/설정 (선택) */
    extraInitVars?: string;
    /** 메인 스크립트 본문 */
    scriptBody: string;
};

/**
 * 공통 캔버스 초기화 변수들을 생성합니다.
 */
export function getCanvasInitVars(width: number, height: number): string {
    return `
        var canvas = new fabric.Canvas('canvas');
        var classScale = ${height}/1920;
        const canvasWidth = ${width};
        const canvasHeight = ${height};
        var classBoardScript = [];
        var classBoardCuts = [];
        var lastSupplementaryYPos = 0;
        var lastScriptCutIdx = 0;
        var objList = [];
        var boardScale = ${width}/1280;
        var stroke = 6*boardScale;
        var boardRightWidth = ${width}*420/1280;
        var boardRightPadding = 12*boardScale;
        var boardTriangleHeight = Math.floor(boardRightWidth/2*Math.sqrt(3));
        var horizontalSpace = 24*boardScale;
        var animations;
        var fadeOuts;
        var actSubs;
        var groupMembers = [];
        var syncMembers = [];
        var prepMembers = [];
        var backgroundSubs = [];
        var lastObj = {};
    `;
}

/**
 * 완성된 HTML 캔버스 템플릿 문자열을 빌드합니다.
 */
export function buildCanvasTemplate(options: CanvasTemplateOptions): string {
    const { width, height, extraInitVars = '', scriptBody } = options;

    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="${FABRIC_JS_CDN}"></script>
    <style>
        html, body { margin: 0; }
        .board { width: 100%; height: 100%; }
    </style>
</head>
<body>
    <canvas id='canvas' width='${width}' height='${height}'></canvas>
    <script>
        ${getCanvasInitVars(width, height)}
        ${extraInitVars}
        ${scriptBody}
    </script>
</body>
</html>
`;
}

export { FABRIC_JS_CDN };
