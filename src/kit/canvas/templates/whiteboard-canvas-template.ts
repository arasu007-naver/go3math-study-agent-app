import { NOTEBOOK_BG_SCALE_JS } from './notebook-background-scale';

/**
 * 풀이 화이트보드 HTML. width/height는 canvas context(좌표계) 크기, cssWidth/cssHeight는 화면에 보이는 크기.
 * 둘이 다르면 fabric canvas를 CSS로만 줄여 보여 준다(좌표·저장 이미지는 context 기준). 포인터 좌표는 fabric이 CSS 배율을 되돌려 계산한다.
 */
export default function classCanvasTemplate(width: number, height: number, cssWidth: number = width, cssHeight: number = height) {
    const cssScaled = cssWidth !== width || cssHeight !== height;
    return `
<!DOCTYPE html>
<html>
<head> 
<meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Adding the FabricJS library -->
    <script src="https://cdn.jsdelivr.net/npm/fabric@4.3.0/dist/fabric.min.js"></script>
    </script> 
    <style>
            html, body {
                margin: 0;
            }
            .board {
                width: 100%; 
                height: 100%;
            }
    </style>
    
</head> 
<body>
<canvas id='canvas' width='${width}' height='${height}' ></canvas>
    
<script>
        const firstCommand = {"actionType": "NOTEBOOK", "obj": {"imageUrl": "https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer/math-files/images/units/4220.png"}}
        // context가 화면보다 크면 레티나 배율을 끈다(1280×1920 이상 backing store가 기기 배율로 다시 커지지 않게)
        var canvas = new fabric.Canvas('canvas', { enableRetinaScaling: ${cssScaled ? 'false' : 'true'} });
        ${cssScaled ? `canvas.setDimensions({ width: '${cssWidth}px', height: '${cssHeight}px' }, { cssOnly: true });` : ''}
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
        if (navigator.appVersion.includes('Android')) {
            document.addEventListener("message", function (data) {
                console.log('webview feedback template: ', data)
                let action = JSON.parse(data.data);
                
                dispatchCanvasAction(action)
                ReactNativeWebView.postMessage(JSON.stringify({pong: action}));
            });
        }
        else {
            window.addEventListener("message", function (data) {
                ReactNativeWebView.postMessage(JSON.stringify({pong: data}));
                let action = JSON.parse(data.data);
                dispatchCanvasAction(action)
            });
        }
        canvas.selection = false;


        function getHighestId (){
            // var highestId = 0;
            if (objList.length == 0) return 0;
            const highestId = objList[objList.length - 1].id;
            return highestId;
        };

        canvas.on("object:added", (e) => {
            const aObj = e.target.toJSON(["id"]);
            aObj.selectable = false;
            if (aObj.type === 'path') return;
            delete aObj.canvas;
            console.log({ timestamp: new Date().getTime(), content: JSON.stringify(aObj), actionType: 'ADD' });
            canvas.setActiveObject(e.target);
        });

        canvas.on("object:modified", (e) => {
            const mObj = e.target.toJSON(["id"]);
            mObj.selectable = false;
            delete mObj.canvas;
            console.log({ timestamp: new Date().getTime(), content: JSON.stringify(mObj), actionType: 'MODIFY' });
        });

        // canvas.on("object:removed", (e) => {
        //     const mObj = e.target.toJSON(["id"]);
        //     console.log('object:removed', mObj);
        //     // console.log({ timestamp: new Date().getTime(), content: JSON.stringify(mObj), actionType: 'MODIFY' });
        //     // classBoardScript.push({ timestamp: new Date().getTime(), content: JSON.stringify(mObj), actionType: 'MODIFY' });
        // });

        canvas.on("path:created", (e) => {
            // e.target.set({id:"path_"+new Date().getTime()});
            e.path.id = 'path:' + new Date().getTime();
            const pObj = e.path.toJSON(["id"]);
            pObj.selectable = false;
            delete pObj.canvas;
            console.log({ timestamp: new Date().getTime(), content: JSON.stringify(pObj), actionType: 'ADD' });
            //canvas.setActiveObject(e.path);
        });

        function dispatchCanvasAction(action) {
            switch (action.actionType) {
                case 'CLEAN':
                    console.log('CLEAN action: ' +  JSON.stringify(action));
                    cleanCanvas();
                    break;
                case 'REMOVE':
                    console.log('REMOVE action: ' +  JSON.stringify(action))
                    removeCurrentObject()
                    break;
                case 'BACKGROUND':
                    classBoardScript = [];
                    changeBackgroundImage(action.obj.imageUrl);
                    break; 
                case 'NOTEBOOK':
                    classBoardScript = [];
                    changeNotebookBackgroundImage(action.obj.imageUrl);
                    break;
                case 'FEEDBACK':
                    classBoardScript = [];
                    changeFeedbackBackgroundImage(action.obj.imageUrl);
                    break;
                case 'ADD':
                    console.log('ADD action: ' +  JSON.stringify(action))
                    addObjToCanvas(action.obj);
                    break;
                case 'MODIFY':
                    console.log('MODIFY action: ' +  JSON.stringify(action))
                    modifyObjOfCanvas(action.obj);
                    break;
                case 'TOGGLE_MODE':
                    toggleCanvasMode(action.pencilColor, action.pencilWidth);
                    break;
                case 'CLEAN_BOARD':
                    resetCanvas();
                    break;
                case 'ADD_LINE':
                    addLine();
                    break;
                case 'ADD_CIRCLE':
                    addCircle();
                    break;
                case 'ADD_TRIANGLE':
                    addTriangle();
                    break;
                case 'ADD_RECTANGLE':
                    addRectangle();
                    break;
                case 'ADD_ARROW':
                    addArrow();
                    break;
                case 'WHITE_PAPER':
                    addWhitePaper();
                    break;
                case 'ADD_IMAGE':
                    insertImageResource(action.obj.imageUrl, action.obj.imgWidth, action.obj.imgHeight)
                    break;
                case 'SAVE':
                    uploadUnitWorkout();
                    break;
                case 'SNAPSHOT':
                    uploadSnapshot();
                    break;
            }
        }
            

        function changeBackgroundImage(imageUrl) {
            console.log('changeBackgroundImage: ', imageUrl);
            canvas.isDrawingMode = true;
            const classboardBackgroundScale = 810/1280;
            if (imageUrl != null) {
                canvas.clear();
                fabric.Image.fromURL(
                    imageUrl,
                    function (oImg) {
                        console.log('@@@@@@@@@@@ changeBackgroundImage: ', oImg);
                        canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
                            scaleX: boardScale*classboardBackgroundScale,
                            scaleY: boardScale*classboardBackgroundScale,
                            backgroundImageOpacity: 1,
                        });
                    },
                    { crossOrigin: "anonymous" }
                );
            }
            lastSupplementaryYPos = 0;
            window.ReactNativeWebView.postMessage(JSON.stringify({contentMeta:'CLEANCUTS', method: 'changeBackgroundImage', image: imageUrl}));
        };
        
        function changeFeedbackBackgroundImage(imageUrl) {
            console.log('changeFeedbackBackgroundImage: ', imageUrl);
            canvas.isDrawingMode = true;
            if (imageUrl != null) {
                canvas.clear();
                fabric.Image.fromURL(
                    imageUrl,
                    function (oImg) {
                        console.log('@@@@@@@@@@@ changeFeedbackBackgroundImage: ', oImg);
                        const fullScale = canvasHeight/oImg.height;
                        canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
                            backgroundImageOpacity: 1,
                            scaleX: fullScale,
                            scaleY: fullScale
                        });
                        // window.ReactNativeWebView.postMessage(JSON.stringify({contentMeta:'FEEDBACK', method: '🟡🟡🟡 changeFeedbackBackgroundImage', image: imageUrl, canvasWidth: canvasWidth, objWidth:oImg.width}));
                    },
                    { crossOrigin: "anonymous" }
                );
            }
            
        };

        ${NOTEBOOK_BG_SCALE_JS}
        function changeNotebookBackgroundImage(imageUrl) {
            console.log('changeNotebookBackgroundImage: ', imageUrl);
            canvas.isDrawingMode = true;
            const classboardBackgroundScale = 810/1280;
            if (imageUrl != null) {
                canvas.clear();
                fabric.Image.fromURL(
                    imageUrl,
                    function (oImg) {
                        console.log('@@@@@@@@@@@ changeNotebookBackgroundImage: ', oImg);
                        // 너비 기준(폭의 절반), 그 높이가 1440을 넘으면 높이 1440 기준
                        var notebookScale = notebookBackgroundScale(canvasWidth, oImg.width, oImg.height);
                        var notebookOffset = notebookBackgroundOffset(canvasHeight);
                        canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
                            top: notebookOffset,
                            left: notebookOffset,
                            scaleX: notebookScale,
                            scaleY: notebookScale,
                            backgroundImageOpacity: 1,
                        });
                    },
                    { crossOrigin: "anonymous" }
                );
            }
            lastSupplementaryYPos = 0;
            window.ReactNativeWebView.postMessage(JSON.stringify({contentMeta:'NOTE_BACKGROUND', method: 'changeBackgroundImage', image: imageUrl}));
        };

        function removeCurrentObject() {
            canvas.isDrawingMode = false;
            var activeObject = canvas.getActiveObject();
            if (activeObject) {
                const activeObjId = activeObject.id;
                canvas.remove(activeObject);
                return;
            }
        };
        
        async function cleanCanvas() {
                
              const minions = canvas.getObjects();
              if(minions.length<1) return;
              var dataURL = canvas.toDataURL({
                  format: "png",
                  multiplier: 1/boardScale,
                });
                window.ReactNativeWebView.postMessage(JSON.stringify({content: dataURL, contentMeta:'CUT'}));
              minions.forEach((obj) => {
                canvas.remove(obj);
              });
              
        }

        async function uploadUnitWorkout() {
            let dataUrl;
            dataUrl = canvas.toDataURL({
              format: "png",
              multiplier: 1280/${width},
            });
            setTimeout(async () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({content: dataUrl, contentMeta:'SAVE' }));
            }, 120)
        }

        async function uploadSnapshot() {
            let dataUrl;
            dataUrl = canvas.toDataURL({
              format: "png",
              multiplier: 1280/${width},
            });
            setTimeout(async () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({content: dataUrl, contentMeta:'SNAPSHOT' }));
            }, 12)
        }

        function resetCanvas(){
            const minions = canvas.getObjects();
            minions.forEach((obj) => {
              canvas.remove(obj);
            });
            classBoardScript = [];
            lastSupplementaryYPos = 0;
        };

        function toggleCanvasMode(color, brushWidth) {
            canvas.isDrawingMode =true;
            if (canvas.isDrawingMode) {
                console.log('toggleCanvasMode: color: ', color, ' pencilWidth: ', brushWidth)
                canvas.freeDrawingBrush.color = color;
                canvas.freeDrawingBrush.width = brushWidth;
            }
            window.ReactNativeWebView.postMessage(JSON.stringify({ contentMeta:'TOGGLE_MODE'}));
        }

        function addLine(){
            const id = getHighestId() + 1;
            var points = [canvas.width-boardRightWidth-boardRightPadding, lastSupplementaryYPos+2*boardScale, canvas.width-boardRightPadding, lastSupplementaryYPos+2*boardScale]; 
            var line = new fabric.Line(points, {
              id: id,
              fill: "red",
              stroke: "red",
              strokeWidth: stroke,
            });
            objList.push({id: id});
            canvas.add(line);
        };

        function insertImageResource(src, width, height=32) {
            try {
                const iScale = canvas.width / width*420/1280;
              fabric.Image.fromURL(
                src,
                function (oImg) {
                  const id = getHighestId() + 1;
                  oImg.id = id;
                  oImg.top = lastSupplementaryYPos+2*boardScale;
                  oImg.left = canvas.width-boardRightWidth-boardRightPadding,
                  oImg.scaleX = iScale;
                  oImg.scaleY = iScale;
                  objList.push({id: id});
                  canvas.add(oImg);
                }.bind(this),
                { crossOrigin: "anonymous" }
              );
            } catch (e) {
              console.log(e);
            }
          }

        function addCircle() {
            canvas.isDrawingMode = false;
            const id = getHighestId() + 1;
        
            var circle = new window.fabric.Circle({
              id: id,
              left: canvas.width-boardRightWidth-boardRightPadding,
              top: (lastSupplementaryYPos + 2)*boardScale,
              radius: boardRightWidth/2,
              fill: "transparent",
              stroke: "orange",
              strokeWidth: stroke
            });
            objList.push({id: id});
            canvas.add(circle);
        };
        
        function addTriangle(){
            canvas.isDrawingMode = false;
            const id = getHighestId() + 1;
            var triangle = new window.fabric.Triangle({
              id: id,
              left: canvas.width-boardRightWidth-boardRightPadding,
              top: lastSupplementaryYPos + 2*boardScale,
              fill: "transparent",
              width: boardRightWidth,
              height: boardRightWidth,
              stroke: "orange",
              strokeWidth: stroke
            });
            objList.push({id: id});
            canvas.add(triangle);
        };

        function addRectangle(){
            canvas.isDrawingMode = false;
            const id = getHighestId() + 1;
        
            var rectangle = new window.fabric.Rect({
                left: canvas.width-boardRightWidth-boardRightPadding,
                top: lastSupplementaryYPos +2*boardScale,
              fill: "transparent",
              width: boardRightWidth,
              height: boardRightWidth,
              id: id,
              stroke: "orange",
              strokeWidth: stroke
            });
        
            objList.push({id: id});
            canvas.add(rectangle);
        };

        function addArrow(){
            canvas.isDrawingMode = false;
            const arrowUrl =
              "https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer/public/red-arrow.png";
            fabric.Image.fromURL(
              arrowUrl,
              function (oImg) {
                const id = this.getHighestId() + 1;
                oImg.id = id;
                oImg.scale = boardScale;
                oImg.left = canvas.width/2 - 72*boardScale;
                oImg.top = canvas.height/2 - 72*boardScale;
                objList.push(oImg);
                canvas.add(oImg);
              }.bind(this),
              { crossOrigin: "anonymous" }
            );
          };
        function addWhitePaper(){
            canvas.isDrawingMode = false;
            const arrowUrl =
              "https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer/public/ruled-paper.jpeg";
            fabric.Image.fromURL(
              arrowUrl,
              function (oImg) {
                const id = this.getHighestId() + 1;
                oImg.id = id;
                oImg.scale = boardScale;
                oImg.left = 180;
                oImg.top = 180;
                objList.push(oImg);
                canvas.add(oImg);
              }.bind(this),
              { crossOrigin: "anonymous" }
            );
          };
          function addImageStuff(imageUrl){
            canvas.isDrawingMode = false;
            fabric.Image.fromURL(
              imageUrl,
              function (oImg) {
                const id = this.getHighestId() + 1;
                oImg.id = id;
                oImg.left = 180;
                oImg.top = 180;
                objList.push(oImg);
                canvas.add(oImg);
              }.bind(this),
              { crossOrigin: "anonymous" }
            );
          };
        //   setTimeout(()=>{
        //     dispatchCanvasAction(firstCommand)
        //   }, 960)
          
    </script>
</body>
</html>
`};