/**
 * 캔버스 템플릿(WebView 안)에 그대로 넣는 지우개 커서 소스. `canvas`(fabric.Canvas)가 만들어진 뒤에 넣는다.
 * 지우개(흰 펜)는 흰 바탕에 보이지 않으므로 터치 지점에 지우는 영역을 주황 2px 점선 원으로 보여 준다.
 * 원 크기는 펜 굵기를 화면(CSS) 배율로 맞춘다. Hermes 릴리스 빌드는 Function.toString()이 소스를 주지 않으므로 문자열로 둔다.
 */
export const ERASER_CURSOR_JS = `
        var eraserCursor = document.createElement('div');
        eraserCursor.style.cssText = 'position:absolute;pointer-events:none;border:2px dashed orange;border-radius:50%;box-sizing:border-box;display:none;z-index:10;';
        canvas.wrapperEl.appendChild(eraserCursor);
        function hideEraserCursor() {
            eraserCursor.style.display = 'none';
        }
        function showEraserCursor(opt) {
            if (!canvas.isDrawingMode || canvas.freeDrawingBrush.color !== 'white') return hideEraserCursor();
            var ev = (opt.e.touches && opt.e.touches[0]) || (opt.e.changedTouches && opt.e.changedTouches[0]) || opt.e;
            var rect = canvas.upperCanvasEl.getBoundingClientRect();
            var d = canvas.freeDrawingBrush.width * rect.width / canvas.getWidth();
            eraserCursor.style.width = d + 'px';
            eraserCursor.style.height = d + 'px';
            eraserCursor.style.left = (ev.clientX - rect.left - d / 2) + 'px';
            eraserCursor.style.top = (ev.clientY - rect.top - d / 2) + 'px';
            eraserCursor.style.display = 'block';
        }
        canvas.on('mouse:down', showEraserCursor);
        canvas.on('mouse:move', showEraserCursor);
        canvas.on('mouse:up', hideEraserCursor);
`;
