export default function topicCanvasTemplate(width: number, height: number) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.jsdelivr.net/npm/fabric@4.3.0/dist/fabric.min.js"></script>
    <style>
        html,
        body {
            margin: 0;
        }
        .board {
            width: 100%;
            height: 100%;
        }
    </style>
</head>
<body>
    <canvas id='canvas' width='${width}' height='${height}'></canvas>
    <script>
        // --- New: Attach event listener after DOM is loaded ---
        var drawCommand = [];
        var canvas = new fabric.Canvas('canvas');
        var classScale = ${height}/1920;
        const canvasWidth = ${width};
        const canvasHeight = ${height};
        var classBoardScript = [];
        var classBoardCuts = [];
        var lastSupplementaryYPos = 0;
        var lastScriptCutIdx = 0;
        var objList = [];
        var boardScale = ${width} / 1280;
        var stroke = 6 * boardScale;
        var boardRightWidth = ${width} * 420 / 1280;
        var boardRightPadding = 12 * boardScale;
        var boardTriangleHeight = Math.floor(boardRightWidth / 2 * Math.sqrt(3));
        var horizontalSpace = 24 * boardScale;
        var animations;
        var fadeOuts;
        var actSubs;
        var groupMembers = [];
        var syncMembers = [];
        var prepMembers = [];
        var backgroundSubs=[];
        var lastObj ={};

        const outputDiv = document.getElementById('output');

        fabric.BorderedImage = fabric.util.createClass(fabric.Rect, {
            type: 'BorderedImage',
            initialize: function (src, options) {
                options || (options = {});
                this.callSuper('initialize', options);
                const that = this;
                window.fabric.Image.fromURL(
                    src,
                    function (oImg) {
                        var patternSourceCanvas = new window.fabric.StaticCanvas(null, {
                            width: oImg.width, height: oImg.height
                        });
                        // patternSourceCanvas에 이미지를 그릴 때, padding 만큼 이동시켜서 그립니다.
                        patternSourceCanvas.add(oImg);
                        patternSourceCanvas.renderAll();
                        patternSourceCanvas.setBackgroundColor(
                            '#FFFFFF',
                            patternSourceCanvas.renderAll.bind(patternSourceCanvas)
                        );
                        const pattern = new window.fabric.Pattern({
                            source: patternSourceCanvas.getElement(),
                            repeat: 'no-repeat',
                            patternTransform: [
                                1*that.scaleX, // scaleX
                                0,
                                0,
                                1*that.scaleY, // scaleY
                                0,
                                0
                            ]
                        });
                        that.width = oImg.width + 32;
                        that.height = oImg.height + 32;
                        
                        that.fill = pattern;
                        that.rx = 20;   // 둥근 모서리 가로 반지름
                        that.ry = 20;   // 둥근 모서리 세로 반지름
                        that.strokeWidth = 12;
                        // that.stroke = "#0000FF";
                        that.stroke = "#FFA500";
                        ReactNativeWebView.postMessage(JSON.stringify({ explanation: 'BorderedImage', contentMeta: 'RECT_INFO', imgWidth: oImg.width, canvasScale: canvasScale, rectScaleX: that.scaleX, rectScaleY: that.scaleY, rectWidth: that.width, rectHeight: that.height }));
                        that.fire('on:image-filled')
                    })
            },

            toObject: function (options) {
                return fabric.util.object.extend(this.callSuper('toObject'), {
                    name: this.get('name')
                });
            },
            _render: function (ctx) {
                this.callSuper('_render', ctx);
            }
        });

        if (navigator.appVersion.includes('Android')) {
            document.addEventListener("message", function (data) {
                console.log('webview feedback template: ', data)
                let action = JSON.parse(data.data);

                dispatchCanvasAction(action)
            });
        }
        else {
            addEventListener("message", function (data) {
                let action = JSON.parse(data.data);
                dispatchCanvasAction(action)
            });
        }

        canvas.selection = false;

        canvas.on("object:added", (e) => {
            const mObj = e.target.toJSON();
            lastObj= mObj;
            // ReactNativeWebView.postMessage(JSON.stringify({contentMeta: 'LAST_PICK', lastPick: mObj}));
        });

        canvas.on("object:modified", (e) => {

        });

        // canvas.on("object:removed", (e) => {
        //     const mObj = e.target.toJSON(["id"]);
        //     console.log('object:removed', mObj);
        //     // console.log({ timestamp: new Date().getTime(), content: JSON.stringify(mObj), actionType: 'MODIFY' });
        // });

        canvas.on("path:created", (e) => {

        });

        function dispatchCanvasAction(action) {
            console.log('dispatchCanvasAction: ', action)
            if(action.content) action['obj'] = JSON.parse(action.content)
            switch (action.actionType) {
                case 'SCALE':
                    break;
                case 'CLEAN_SHEET':
                    console.log('CLEAN action: ' + JSON.stringify(action));
                    cleanCanvas();
                    break;
                case 'REMOVE':
                    console.log('REMOVE action: ' + JSON.stringify(action))
                    removeCurrentObject()
                    break;
                case 'BACKGROUND':
                    clearScript();
                    changeBackgroundImageOn(action.obj, action.imageWidth);
                    break;
                case 'NOTEBOOK':
                    changeNotebookBackgroundImage(action.obj.imageUrl || action.obj.image);
                    break;
                case 'ADD_DEPRECATED':
                    console.log('ADD action: ' + JSON.stringify(action))
                    const adds = canvas.getObjects().filter((p) => p.id == action.obj.id);
                    adds.forEach((obj) => {
                        canvas.remove(obj);
                    });
                    hideSyncMembersOfId(action.obj.id);
                    setTimeout(()=>{
                        addObjToCanvas(action.obj);
                    }, 10)
                    break;
                case 'MODIFY': case 'ADD':
                    console.log('MODIFY action: ' + JSON.stringify(action))
                    const modifies = canvas.getObjects().filter((p) => p.id == action.obj.id);
                    modifies.forEach((obj) => {
                        canvas.remove(obj);
                    });
                    hideSyncMembersOfId(action.obj.id);
                    setTimeout(()=>{
                        modifyObjOfCanvas(action.obj);
                    }, 10)
                    break;
                case 'TOGGLE_MODE':
                    toggleCanvasMode(action.obj.pencilColor, action.obj.pencilWidth);
                    break;
                case 'RESET':
                    console.log('Toggle FreeDrawing Mode: ', canvas.isDrawingMode);
                    console.log('RESET action: ' + JSON.stringify(action));
                    resetCanvas();
                    break;
                case 'CLEAN_BOARD':
                    resetCanvas();
                    break;
                case 'CLEAR_CANVAS':case 'CLEAN':
                    clearCanvas();
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
                case 'SHOW_SUBSTANTIALS':
                    showSubstantials(action.leaderId);
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
                // case 'CLEAN':
                //     clearScript();
                //     break;
                case 'ERASE_WRITTEN':
                    clearHandWritten();
                    break;
                case 'MEMO':
                    break;
                case 'POPUP':
                    break;
                case "ACT_SUBS": case "SCENE_SUBS":
                    setActSubs(action.obj)
                    break;
                case 'BACKGROUND_SUBS':
                    setBackgroundSubs(action.obj)
                    break;
                case 'ANIMATIONS':
                    setAnimations(action.obj)
                    break;
                case 'FADEOUTS':
                    setFadeOuts(action.obj)
                    break;
                case 'APPENDIX':
                    setAppendix(action.obj)
                    break;
                case 'GROUPS':
                    setGroupMembers(action.obj)
                    break;
                case 'PREPS':
                    setPrepMembers(action.obj)
                    break;
                case 'SYNCS':
                    setSyncMembers(action.obj)
                    break;
                case 'BACKWARD':
                    removeCut(action.obj)
                    break;
                case 'PROLOGUE':
                    hideProloguesOfId(action.obj.id);
                    setTimeout(()=>{
                        ReactNativeWebView.postMessage(JSON.stringify({ explanation: 'Config', contentMeta: 'GROUPS' }));
                        showPrologues(action.obj.id);
                    }, 10)
                    break;
                case 'EPILOGUE':
                    hideEpiloguesOfId(action.obj.id);
                    setTimeout(()=>{
                        showEpilogues(action.obj.id);
                    }, 10)
                    break;
                case 'DEFAULT':
                    hideDefaultOfId(action.obj.id);
                    setTimeout(()=>{
                        showDefault(action.obj);
                    }, 10)
                    break;
                case 'FEEDBACK':
                    addFeedbackObjToCanvas(action.obj)
                    break;
                case 'FEEDBACK_BKG':
                    changeBackgroundImageAsFeedback(action.obj.background, action.obj.imageWidth, action.obj.imageHeight)
                    break;
                case 'SYNCH': case 'SYNC_CANVAS_OBJECTS': case 'SYNC_OBJECTS':
                    if (action.objects && Array.isArray(action.objects)) {
                        syncCanvasObjects(action.objects);
                    }
                    break;
            }
        }

        setFadeOuts = (fOuts) => {
            console.log('setFadeOuts: ', fOuts);
            fadeOuts = fOuts;
        }

        setAppendix = (apndix) => {
            console.log('setAppendix: ', apndix);
            appendix = apndix;
        }

        setAnimations = (anims) => {
            console.log('setAnimations: ', anims);
            animations = anims;
        }
        setGroupMembers = (members) => {
            groupMembers = members;
            ReactNativeWebView.postMessage(JSON.stringify({ explanation: 'Config', contentMeta: 'GROUPS' }));
        }
        setPrepMembers = (members) => {
            prepMembers = members;
            ReactNativeWebView.postMessage(JSON.stringify({ explanation: 'Config', contentMeta: 'PREPS' }));
        }
        setSyncMembers = (members)=> {
            syncMembers = members;
            ReactNativeWebView.postMessage(JSON.stringify({ explanation: 'Config', contentMeta: 'SYNCS' }));
        }

        setActSubs = (aSubs) => {
            console.log('setActSubs: ', aSubs);
            actSubs = aSubs;
        }

        setBackgroundSubs = (backSubs) => {
            console.log('setBackgroundSubs: ', backSubs);
            backgroundSubs = backSubs;
        }

        function removeCut(obj){
            const minions = canvas.getObjects().filter((p) => p.id == obj.id);
            minions.forEach((obj) => {
                if (typeof obj.id === 'string' && obj.id.startsWith('comment')) {
                    canvas.remove(obj);
                }
            });
            hideSyncMembersOfId(obj.id);
            hideProloguesOfId(obj.id);
            hideEpiloguesOfId(obj.id);
            canvas.renderAll();
        }

        function showSubstantials(leaderId){
            const members = groupMembers.filter((s) => s.id.startsWith('group:' + leaderId));
            let grps = []
            for(var i=0; i<members.length; i++){
                grps.push(members[i].obj)
            }

            fabric.util.enlivenObjects(grps, function (objects) {
                objects.forEach(function (o) {
                    o.opacity = 0;
                    
                    o.left = o.left * canvasScale;
                    o.top = o.top * canvasScale;
                    enlivenPaatternedRect(o);
                })
            })
        }

        function showSyncMembers(leaderId){
            const members = syncMembers.filter((s) => s.id.startsWith('sync:' + leaderId));
            let grps = []
            for(var i=0; i<members.length; i++){
                grps.push(members[i].obj)
            }

            fabric.util.enlivenObjects(grps, function (objects) {
                objects.forEach(function (o) {
                    o.opacity = 0;
                    
                    o.left = o.left * canvasScale;
                    o.top = o.top * canvasScale;
                    enlivenSubs(o);
                })
            })
        }

        function enlivenPaatternedRect(tObj) {
                tObj.scaleX = tObj.scaleX * canvasScale;
                tObj.scaleY = tObj.scaleY * canvasScale;
                tObj.animate('opacity', 1, {
                    duration: 1200,
                    easing: window.fabric.util.ease.easeInSine,
                    onChange: canvas.renderAll.bind(canvas)
                })
                tObj.bringToFront()
                canvas.add(tObj);
                canvas.renderAll();
        }
        
        function enlivenSubs(o) {
            if (o.sourceUrl) {

                var borderedImage = new fabric.BorderedImage(o.sourceUrl, {
                    opacity:0,
                    top: o.top,
                    left: o.left,
                    scaleX: 1,
                    scaleY: 1
                });
                borderedImage.set({
                    scaleX: o.scaleX * canvasScale,
                    scaleY: o.scaleY * canvasScale
                });
                
                borderedImage.animate('opacity', 1, {
                    duration: 1200,
                    easing: window.fabric.util.ease.easeInSine,
                    onChange: canvas.renderAll.bind(canvas)
                })
                borderedImage.moveTo(canvas.getObjects().length-2)
                canvas.add(borderedImage)
                borderedImage.on('on:image-filled', function (e) {
                    console.log('😡😡😡😡😡😡 on:image-filled: ', e)
                    canvas.renderAll.bind(canvas)
                })

            } else {
                o.scaleX = o.scaleX * canvasScale;
                o.scaleY = o.scaleY * canvasScale;
                o.animate('opacity', 1, {
                    duration: 1200,
                    easing: window.fabric.util.ease.easeInSine,
                    onChange: canvas.renderAll.bind(canvas)
                })
                o.moveTo(canvas.getObjects().length-2);
                canvas.add(o);
                canvas.renderAll();
            }
        }

        function modifyObjOfCanvas(obj) {
            console.log("$$$$$$$$$$$ modifyObjOfCloneCanvas: ", obj);
            hideAppendix();
            obj.selection = false;


            showSyncMembers(obj.id)
            fabric.util.enlivenObjects([obj], function (objects) {
                objects.forEach(function (o) {
                    //     	canvas.moveTo(o, 200);
                    // console.log('@@@@@ modifyObjOfCanvas: ', o.id, ' animations: ', animations[o.id]);
                    o.opacity = 0;
                    // showAppendix(o);
                    // showMembers(o);
                    o.left = o.left * canvasScale;
                    o.top = o.top * canvasScale;
                    enlivenPaatternedRect(o)

                    if (animations && animations[o.id] != null && animations[o.id].type === 'SLIDING') {
                        const bkColor = animations[o.id].color || 'white';
                        const slidingRect = new fabric.Rect({
                            left: o.left * o.scaleX * canvasScale,
                            top: o.top * o.scaleY * canvasScale,
                            fill: bkColor,
                            width: o.width * o.scaleX * canvasScale,
                            height: o.height * o.scaleY * canvasScale,
                            id: o.id + new Date().getTime(),
                        });
                        slidingRect.animate('width', 0, {
                            duration: 3000,
                            onChange: canvas.renderAll.bind(canvas)
                        });
                        slidingRect.animate('left', o.left + 5 + o.width + 10, {
                            duration: 3000,
                            onChange: canvas.renderAll.bind(canvas)
                        });
                        canvas.add(slidingRect);
                    } else if (animations && animations[o.id] != null && animations[o.id].type === 'SCALE') {
                        console.log('@@@@ modifyObj Scale Animation: ', animations[o.id]);
                        exeAnimation(o, animations[o.id].scale);
                    } else if (fadeOuts && fadeOuts[(o.id + '')]) {
                        canvas.getObjects().forEach(p => {
                            if (fadeOuts[(o.id + '')].includes(p.id)) {

                                let g = syncMembers.filter((s) => s.id.startsWith('group:' + p.id));
                                let member = []
                                for (var i = 0; i < g.length; i++) {
                                    member.push(g[i].id);
                                }
                                canvas.getObjects().forEach(m => {
                                    if(member && member.includes(m.id)){
                                        m.animate('opacity', 0, {
                                            duration: 960,
                                            onChange: canvas.renderAll.bind(canvas),
                                            onComplete: function () {
                                                // 애니메이션 완료 후 객체 제거
                                                canvas.remove(m);
                                            },
                                        })
                                    }
                                })
                                p.animate('opacity', 0, {
                                    duration: 960,
                                    onChange: canvas.renderAll.bind(canvas),
                                    onComplete: function () {
                                        // 애니메이션 완료 후 객체 제거
                                        canvas.remove(p);
                                    },
                                })
                            }

                        })

                    } 
                });
            });
            return;
        };

        function syncCanvasObjects(receivedObjects) {
            if (!canvas || !window.fabric || !Array.isArray(receivedObjects)) {
                return;
            }
            var currentObjects = canvas.getObjects();
            var existingIdSet = new Set();
            currentObjects.forEach(function (obj) {
                if (obj.id != null) {
                    existingIdSet.add(String(obj.id));
                }
            });

            var missingObjects = [];
            for (var i = 0; i < receivedObjects.length; i++) {
                var rawObj = receivedObjects[i];
                if (!rawObj) continue;
                var parsedObj = rawObj;
                if (typeof parsedObj === 'string') {
                    try {
                        parsedObj = JSON.parse(parsedObj);
                    } catch (e) {
                        continue;
                    }
                }
                if (parsedObj && typeof parsedObj === 'object') {
                    delete parsedObj.canvas;
                }
                var objId = parsedObj.id != null ? String(parsedObj.id) : null;
                if (objId && existingIdSet.has(objId)) {
                    continue;
                }
                missingObjects.push(parsedObj);
            }

            if (missingObjects.length > 0) {
                window.fabric.util.enlivenObjects(missingObjects, function (enlivenedObjects) {
                    enlivenedObjects.forEach(function (o) {
                        if (!o) return;
                        delete o.canvas;
                        if (o.id != null) {
                            var alreadyThere = canvas.getObjects().some(function (exist) {
                                return String(exist.id) === String(o.id);
                            });
                            if (alreadyThere) {
                                return;
                            }
                        }
                        o.selectable = false;
                        o.evented = false;
                        o.left = o.left * classScale;
                        o.top = o.top * classScale;
                        o.scaleX = o.scaleX * classScale;
                        o.scaleY = o.scaleY * classScale;
                        canvas.add(o);
                    });
                    canvas.renderAll();
                });
            }
        }

        function addFeedbackObjToCanvas(obj) {
            // obj.sourceUrl (Fabric.js 객체 JSON에는 포함되지 않으므로, 외부에서 전달되어야 함)
            const sourceUrl = obj.sourceUrl; // 이미지를 패턴으로 사용할 경우 이미지 URL

            // 기존에 동일한 ID를 가진 객체가 있다면 모두 제거합니다.
            const minions = canvas.getObjects().filter((p) => p.id === obj.id);
            minions.forEach((existingObj) => { // 괄호 오류 수정: (obj) -> (existingObj)
                canvas.remove(existingObj);
            });

            checkSubs('FEEDBACK');
            // 직렬화된 Fabric 객체를 다시 Fabric 객체로 변환합니다.
            fabric.util.enlivenObjects([obj], function (objects) {
                objects.forEach(function (o) {
                    // 초기 투명도 설정 (애니메이션을 위해)
                    o.opacity = 0;

                    // 스케일 적용 (캔버스 스케일에 맞춤)
                    // Fabric 객체의 left/top/scaleX/scaleY는 이미 원본 스케일을 포함할 수 있으므로
                    // canvasScale을 곱하는 로직은 obj가 JSON으로 저장될 때의 스케일과
                    // 현재 캔버스의 뷰포트 스케일 간의 관계를 정확히 이해하고 적용해야 합니다.
                    // 여기서는 전달된 obj의 속성들이 이미 올바른 스케일로 계산되어 있다고 가정하고
                    // canvasScale을 한 번 더 곱하는 기존 로직을 유지합니다.
                    o.top = o.top * canvasScale;
                    o.left = o.left * canvasScale;
                    o.scaleX = o.scaleX * canvasScale;
                    o.scaleY = o.scaleY * canvasScale;
                    o.selectable = false; // 선택 불가능하게 설정

                    // obj.type이 'rect'인 경우 이미지 패턴 적용
                    if (o.type === 'rect') {
                        fabric.Image.fromURL(
                            sourceUrl,
                            function (oImg) {
                                // 이미지 패턴 소스 캔버스 생성
                                // 패턴 캔버스의 크기는 이미지의 원본 크기 또는 패턴이 채울 사각형의 크기에 맞춤
                                // 여기서는 이미지 원본 크기로 설정합니다.
                                var patternSourceCanvas = new fabric.StaticCanvas(null, {
                                    width: oImg.width, // 이미지 원본 너비
                                    height: oImg.height // 이미지 원본 높이
                                });

                                // 이미지를 패턴 소스 캔버스에 추가 (필요시 스케일 조정)
                                // oImg는 이미지를 원본 크기로 캔버스에 추가합니다.
                                // 만약 oImg를 patternSourceCanvas에 꽉 채우고 싶다면 oImg.scaleToWidth/Height 사용
                                patternSourceCanvas.add(oImg);
                                patternSourceCanvas.renderAll(); // 패턴 캔버스 렌더링

                                // 패턴 캔버스 배경색 설정 (패딩 효과 등 필요시)
                                // 배경색 설정은 이미지가 투명할 경우 유용합니다.
                                patternSourceCanvas.setBackgroundColor(
                                    '#FFFFFF', // 흰색 배경 예시
                                    patternSourceCanvas.renderAll.bind(patternSourceCanvas)
                                );

                                // 생성된 patternSourceCanvas를 소스로 하는 패턴 생성
                                const pattern = new fabric.Pattern({
                                    source: patternSourceCanvas.getElement(), // StaticCanvas의 실제 HTML Canvas 엘리먼트를 소스로 사용
                                    repeat: 'no-repeat', // 이미지가 반복되지 않도록 설정
                                    // patternTransform을 사용하여 패턴의 위치나 스케일을 더 세밀하게 제어할 수 있습니다.
                                    // 예: 패턴이 rect를 덮도록 스케일링
                                    patternTransform: [
                                        o.scaleX *canvasScale, // scaleX
                                        0,
                                        0,
                                        o.scaleX *canvasScale, // scaleY
                                        0,
                                        0
                                    ]
                                });

                                o.fill = pattern; // 사각형의 fill 속성을 생성된 패턴으로 설정

                                // 사각형을 캔버스에 추가하고 투명도 애니메이션 시작
                                // opacity가 0으로 설정된 객체를 추가하고, 애니메이션으로 1로 만듭니다.
                                
                                o.animate('opacity', 1, { // 투명도 0 -> 1 애니메이션
                                    duration: 480,
                                    easing: fabric.util.ease.easeInSine,
                                    onChange: canvas.renderAll.bind(canvas) // 애니메이션 프레임마다 캔버스 렌더링
                                });
                                // 최종 렌더링은 onChange에서 처리되므로 별도의 canvas.renderAll()은 필요 없을 수 있습니다.
                                canvas.add(o); // 객체를 캔버스에 추가
                                canvas.renderAll(); // 주석 처리 또는 제거 가능
                            }.bind(o), // fromURL의 콜백 컨텍스트를 o (rect 객체)로 바인딩
                            { crossOrigin: "anonymous" } // 외부 이미지 사용 시 필수
                        );
                    } else {
                        // 'rect' 타입이 아닌 다른 객체 (Line, Circle 등)의 경우
                        // 투명도 0으로 객체를 추가하고, 애니메이션으로 1로 만듭니다.
                        window.ReactNativeWebView.postMessage(JSON.stringify({contentMeta:'FEEDBAC_OBJ', method: '🟡🟡🟡 addFeedbackObjToCanvas', top: o.top, left: o.left, width: o.width, height: o.height, canvasScale: canvasScale}));
                        setTimeout(() => { // 짧은 지연 후 애니메이션 시작
                            o.animate('opacity', 1, {
                                duration: 480,
                                easing: fabric.util.ease.easeInSine,
                                onChange: canvas.renderAll.bind(canvas)
                            });
                            canvas.add(o); // 객체를 캔버스에 추가
                            canvas.renderAll(); // 주석 처리 또는 제거 가능
                        }, 120); // 짧은 지연 (왜 120ms 지연을 주는지 확인 필요)
                    }
                });
            });
        }

        function exeAnimation (picked, scaled) {
            console.log('executeAnimation: ', picked, ' scale: ', scaled);
            const top = picked.top;
            const left = picked.left;
            const endX = left + picked.width * scaled;
            const orgXscale = picked.scaleX;
            const orgYscale = picked.scaleY;
            console.log()
            picked.animate(
                "scaleX", scaled * orgXscale, {
                onChange: canvas.renderAll.bind(canvas),
                easing: window.fabric.util.ease.easeInCubic,
                duration: 1200,
            });
            picked.animate(
                "scaleY", scaled * orgYscale, {
                onChange: canvas.renderAll.bind(canvas),
                easing: window.fabric.util.ease.easeInCubic,
                duration: 1200,
            });
            setTimeout(() => {
                picked.animate(
                    "scaleX", orgXscale, {
                    onChange: canvas.renderAll.bind(canvas),
                    easing: window.fabric.util.ease.easeInCubic,
                    duration: 1200,
                });
                picked.animate(
                    "scaleY", orgYscale, {
                    onChange: canvas.renderAll.bind(canvas),
                    easing: window.fabric.util.ease.easeInCubic,
                    duration: 1200,
                });
            }, 3200)
        }

        function checkSubs (id) {
            const members = groupMembers.filter((s) => s.id.startsWith('group:' + id));
            ReactNativeWebView.postMessage(JSON.stringify({ contentMeta: 'SUB_CNT', count: members.length, leaderId: id }));
        }

        function addObjToCanvas(obj) {
            console.log('add Object to canvas: ', obj)
            hideAppendix();

            
            showSyncMembers(obj.id);
            fabric.util.enlivenObjects([obj], function (objects) {

                objects.forEach(function (o) {
                    o.opacity = 0;
                    // showAppendix(o);
                    // showMembers(o);
                    o.top = o.top * canvasScale;
                    o.left = o.left * canvasScale;
                    if (animations && animations[o.id] != null && animations[o.id].type === 'SLIDING') {
                        const slidingRect = new fabric.Rect({
                            left: o.left * o.scaleX * canvasScale,
                            top: o.top * o.scaleY * canvasScale,
                            fill: "white",
                            width: o.width * o.scaleX * canvasScale,
                            height: o.height * o.scaleY * canvasScale,
                            id: o.id
                        });
                        slidingRect.animate('width', 0, {
                            duration: 3000,
                            onChange: canvas.renderAll.bind(canvas)
                        });
                        slidingRect.animate('left', o.left * canvasScale + 5 + o.width * canvasScale + 10, {
                            duration: 3000,
                            onChange: canvas.renderAll.bind(canvas)
                        });
                        canvas.add(slidingRect);
                    } else if (animations && animations[o.id] != null && animations[o.id].type === 'SCALE') {
                        exeAnimation(o, animations[o.id].scale);
                    } else if (fadeOuts && fadeOuts[(o.id + '')]) {
                        canvas.getObjects().forEach(p => {
                            if (fadeOuts[(o.id + '')].includes(p.id)) {
                                // console.log('target obj id: ', p.id + '')
                                // console.log('groupMembers: ', groupMembers[p.id + ''])
                                let g = syncMembers.filter((s) => s.id.startsWith('group:' + p.id));
                                let member = []
                                for (var i = 0; i < g.length; i++) {
                                    member.push(g[i].id);
                                }
                                canvas.getObjects().forEach(m => {
                                    if(member && member.includes(m.id)){
                                        m.animate('opacity', 0, {
                                            duration: 960,
                                            onChange: canvas.renderAll.bind(canvas),
                                            onComplete: function () {
                                                // 애니메이션 완료 후 객체 제거
                                                canvas.remove(m);
                                            },
                                        })
                                    }
                                })
                                p.animate('opacity', 0, {
                                    duration: 960,
                                    onChange: canvas.renderAll.bind(canvas),
                                    onComplete: function () {
                                        // 애니메이션 완료 후 객체 제거
                                        canvas.remove(p);
                                    },
                                })
                            }
                        })

                    }
                });
            });
        };

        function hideAppendix() {
            let appendix = canvas.getObjects().filter(obj => obj.id && typeof obj.id === 'string' && obj.id.startsWith('appendix:'));
            if (appendix) {
                appendix.forEach(function (value, index, ar) {
                    canvas.remove(value);
                });
            }
        }

        function hideMembers() {
            let members = canvas.getObjects().filter(obj => obj.id && typeof obj.id === 'string' && obj.id.startsWith('group:'));
            if (members) {
                members.forEach(function (value, index, ar) {
                    canvas.remove(value);
                });
            }
        }

        function clearStage(cut) {
            const actIdx = JSON.parse(cut);

        }

        function addPathsToCanvas(objs) {
            fabric.util.enlivenObjects(objs, function (objects) {
                objects.forEach(function (o) {
                    o.top = o.top * canvasScale;
                    o.left = o.left * canvasScale;
                    o.scaleX = o.scaleX * canvasScale;
                    o.scaleY = o.scaleY * canvasScale;
                    canvas.add(o);
                    canvas.renderAll();
                });
            });
        };

        function removeObjectWithId(obj) {
            const minions = canvas.getObjects().filter((p) => p.id == obj);
            if (minions.length == 0) {
                return;
            }
            canvas.remove(minions[0]);
        };

        function clearScript() {
            let minions = canvas.getObjects().filter((p) => p.id);
            let removed = minions.filter(o =>!backgroundSubs.includes(o.id))
            removed.forEach((obj) => {
                canvas.remove(obj);
            });
        }

        function clearHandWritten () {
            let minions = canvas.getObjects().filter((p) => p.id==null);
            minions.forEach((obj) => {
                canvas.remove(obj);
            });
        }

        setScale = (scale) => {
            canvasScale = scale;
        }

        changeBackgroundImageOn = (obj, imageWidth) => {
            
            let scle = 3/4*canvasWidth / obj.canvasWidth;
            setScale(scle);
            changeBackgroundImage(obj.imageUrl || obj.image, imageWidth);
            checkSubs('BACKGROUND');
        }

        function changeBackgroundImage(imageUrl, imageWidth) {
            console.log('changeBackgroundImage: ', imageUrl);
            canvas.isDrawingMode = true;
            let backgroundDefaultScale = 810/1280;// 810/imageWidth;
            if (imageUrl != null) {0
                // canvas.clear();
                fabric.Image.fromURL(
                    imageUrl,
                    function (oImg) {

                        // if (oImg.height * backgroundDefaultScale > 1900) {
                        //     backgroundDefaultScale = 1440/oImg.height;
                        //     // canvasScale = 1440 / oImg.height*3/4;
                        //     // let verticalScale = 1440 / oImg.height;
                        //     // setScale(verticalScale);
                        // }
                        canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
                            top: 10 * canvasScale,
                            left: 10 * canvasScale,
                            scaleX: backgroundDefaultScale*canvasScale,
                            scaleY: backgroundDefaultScale*canvasScale,
                            backgroundImageOpacity: 1,
                        });
                    },
                    { crossOrigin: "anonymous" }
                );
            }
            ReactNativeWebView.postMessage(JSON.stringify({ contentMeta: 'CLEANCUTS' }));
        };

        function changeBackgroundImageAsFeedback(imageUrl, imageWidth, imageHeight) {
            console.log('changeBackgroundImage: ', imageUrl);
            canvas.isDrawingMode = true;
            canvasScale = canvasWidth/imageWidth
            if(imageHeight*canvasScale>(canvasHeight-120)) canvasScale = (canvasHeight-120)/imageHeight
            if (imageUrl != null) {
                canvas.clear();
                fabric.Image.fromURL(
                    imageUrl,
                    function (oImg) {
                        console.log('@@@@@@@@@@@ changeFeedbackBackgroundImage: ', oImg);
                        canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
                            backgroundImageOpacity: 1,
                            scaleX: canvasScale,
                            scaleY: canvasScale
                        });
                        window.ReactNativeWebView.postMessage(JSON.stringify({contentMeta:'FEEDBACK_BKG', method: '🟡🟡🟡 changeFeedbackBackgroundImage', image: imageUrl, canvasWidth: canvasWidth, canvasHeight: canvasHeight, objWidth:oImg.width, objHeight: oImg.height}));
                    },
                    { crossOrigin: "anonymous" }
                );
            }
        };

        function changeGuideBackgroundImage(imageUrl) {
            console.log('changeGuideBackgroundImage: ', imageUrl);
            canvas.isDrawingMode = true;
            if (imageUrl != null) {
                canvas.clear();
                fabric.Image.fromURL(
                    imageUrl,
                    function (oImg) {
                        console.log('@@@@@@@@@@@ changeGuideBackgroundImage: ', oImg);
                        canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
                            scaleX: boardScale * canvasScale,
                            scaleY: boardScale * canvasScale,
                            backgroundImageOpacity: 1,
                        });
                    },
                    { crossOrigin: "anonymous" }
                );
            }
            ReactNativeWebView.postMessage(JSON.stringify({ contentMeta: 'CLEANCUTS' }));
        };

        function changeNotebookBackgroundImage(imageUrl) {
            console.log('changeNotebookBackgroundImage: ', imageUrl);
            canvas.isDrawingMode = true;
            if (imageUrl != null) {
                canvas.clear();
                fabric.Image.fromURL(
                    imageUrl,
                    function (oImg) {
                        console.log('@@@@@@@@@@@ changeNotebookBackgroundImage: ', oImg);
                        canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
                            scaleX: oImg.scaleX * canvasScale,
                            scaleY: oImg.scaleX * canvasScale,
                            backgroundImageOpacity: 1,
                        });
                    },
                    { crossOrigin: "anonymous" }
                );
            }
            ReactNativeWebView.postMessage(JSON.stringify({ contentMeta: 'CLEANCUTS' }));
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
            if (minions.length < 1) return;
            var dataURL = canvas.toDataURL({
                format: "png",
                multiplier: 1 / boardScale,
            });
            // ReactNativeWebView.postMessage(JSON.stringify({ content: dataURL, contentMeta: 'CUT' }));
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
            window.ReactNativeWebView.postMessage(JSON.stringify({content: dataUrl, contentMeta:'SAVE' }));
        }

        async function uploadSnapshot() {
            let dataUrl;
            dataUrl = canvas.toDataURL({
              format: "png",
              multiplier: 1280/${width},
            });
            window.ReactNativeWebView.postMessage(JSON.stringify({content: dataUrl, contentMeta:'SNAPSHOT', lastObj: lastObj }));
        }

        function resetCanvas(){
            let dataUrl;
            dataUrl = canvas.toDataURL({
              format: "png",
              multiplier: 1920/classScale,
            });
            window.ReactNativeWebView.postMessage(JSON.stringify({content: dataUrl, contentMeta:'SNAPSHOT' }));
            setTimeout(async () => {
                const minions = canvas.getObjects();
                minions.forEach((obj) => {
                canvas.remove(obj);
                });
                classBoardScript = [];
                lastSupplementaryYPos = 0;
            }, 12)
        };

        clearCanvas = () => {
            let dataUrl;
            dataUrl = canvas.toDataURL({
              format: "png",
              multiplier: 1280/${width},
            });
            window.ReactNativeWebView.postMessage(JSON.stringify({content: dataUrl, contentMeta:'SAVE', lastObj: {} }));
            setTimeout(async () => {
                let minions = canvas.getObjects();
                // 2. filter와 includes를 사용하여 삭제 대상(ID가 리스트에 없는 것)을 골라냅니다.
                
                const targetsToRemove = minions.filter(obj => !backgroundSubs.includes(obj.id));
                
                targetsToRemove.forEach((o, index)=>{
                    canvas.remove(o)
                })
                canvas.renderAll();
            }, 12)
        }

        function toggleCanvasMode(color, brushWidth) {
            canvas.isDrawingMode = true;
            if (canvas.isDrawingMode) {
                console.log('toggleCanvasMode: color: ', color, ' pencilWidth: ', brushWidth)
                canvas.freeDrawingBrush.color = color;
                canvas.freeDrawingBrush.width = brushWidth;
            }
            ReactNativeWebView.postMessage(JSON.stringify({ contentMeta: 'TOGGLE_MODE' }));
        }

        function addLine() {
            var points = [canvas.width - boardRightWidth - boardRightPadding, lastSupplementaryYPos + 2 * boardScale, canvas.width - boardRightPadding, lastSupplementaryYPos + 2 * boardScale];
            var line = new fabric.Line(points, {
                fill: "red",
                stroke: "red",
                strokeWidth: stroke,
            });
            canvas.add(line);
        };

        function addCircle() {
            canvas.isDrawingMode = false;
            var circle = new fabric.Circle({
                left: canvas.width - boardRightWidth - boardRightPadding,
                top: (lastSupplementaryYPos + 2) * boardScale,
                radius: boardRightWidth / 2,
                fill: "transparent",
                stroke: "orange",
                strokeWidth: stroke
            });
            canvas.add(circle);
        };

        function addTriangle() {
            canvas.isDrawingMode = false;
            var triangle = new fabric.Triangle({
                left: canvas.width - boardRightWidth - boardRightPadding,
                top: lastSupplementaryYPos + 2 * boardScale,
                fill: "transparent",
                width: boardRightWidth,
                height: boardRightWidth,
                stroke: "orange",
                strokeWidth: stroke
            });
            canvas.add(triangle);
        };

        function addRectangle() {
            canvas.isDrawingMode = false;

            var rectangle = new fabric.Rect({
                left: canvas.width - boardRightWidth - boardRightPadding,
                top: lastSupplementaryYPos + 2 * boardScale,
                fill: "transparent",
                width: boardRightWidth,
                height: boardRightWidth,
                id: id,
                stroke: "orange",
                strokeWidth: stroke
            });

            canvas.add(rectangle);
        };

        function addArrow() {
            canvas.isDrawingMode = false;
            const arrowUrl =
                "https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer/public/red-arrow.png";
            fabric.Image.fromURL(
                arrowUrl,
                function (oImg) {
                    oImg.scale = boardScale;
                    oImg.left = canvas.width / 2 - 72 * boardScale;
                    oImg.top = canvas.height / 2 - 72 * boardScale;
                    canvas.add(oImg);
                }.bind(this),
                { crossOrigin: "anonymous" }
            );
        };
        
        function addWhitePaper() {
            canvas.isDrawingMode = false;
            const arrowUrl =
                "https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer/public/ruled-paper.jpeg";
            fabric.Image.fromURL(
                arrowUrl,
                function (oImg) {
                    oImg.scale = boardScale;
                    oImg.left = 180;
                    oImg.top = 180;
                    canvas.add(oImg);
                }.bind(this),
                { crossOrigin: "anonymous" }
            );
        };
        
        function addImageStuff(imageUrl) {
            canvas.isDrawingMode = false;
            fabric.Image.fromURL(
                imageUrl,
                function (oImg) {
                    oImg.left = 180;
                    oImg.top = 180;
                    canvas.add(oImg);
                }.bind(this),
                { crossOrigin: "anonymous" }
            );
        };

        function hideDefaultOfId(objId) {
            const minions = canvas.getObjects().filter((p) => typeof p.id === 'string' && p.id==objId);
            minions.forEach((obj) => {
                canvas.remove(obj);
            });
        }

        function hideSyncMembersOfId(objId) {
            const minions = canvas.getObjects().filter((p) => typeof p.id === 'string' && p.id.startsWith('sync:' + objId + ':'));
            minions.forEach((obj) => {
                canvas.remove(obj);
            });
        }

        function hideProloguesOfId(objId) {
            const minions = canvas.getObjects().filter((p) => typeof p.id === 'string' && p.id.startsWith('preps:' + objId + ':'));
            minions.forEach((obj) => {
                canvas.remove(obj);
            });
        }

        function hideEpiloguesOfId(objId) {
            const minions = canvas.getObjects().filter((p) => typeof p.id === 'string' && p.id.startsWith('group:' + objId + ':'));
            minions.forEach((obj) => {
                canvas.remove(obj);
            });
        }

        showDefault = (dObj) => {
            try {
                window.fabric.util.enlivenObjects([dObj], function (objects) {
                    objects.forEach(function (o) {
                        o.left = o.left*canvasScale;
                        o.top = o.top * canvasScale;
                        o.scaleX = o.scaleX * canvasScale;
                        o.scaleY = o.scaleY * canvasScale;
                        setTimeout(() => {
                            o.moveTo(canvas.getObjects().length - 2);
                            o.animate('opacity', 1, {
                                duration: 480,
                                easing: fabric.util.ease.easeInSine,
                                onChange: canvas.renderAll.bind(canvas)
                            })
                            canvas.add(o);
                            canvas.renderAll();
                        }, 96)
                    });
                });
            } catch (e) {
                console.log(e);
            }
        }

        async function showPrologues(leadId) {

            try {
                if (leadId == null) return;
                ReactNativeWebView.postMessage(JSON.stringify({ contentMeta: 'showPrologues', data: leadId }));
                // const fadeOuts = that.fadeOuts;
                // const groupMembers = that.state.groupMembers;
                // const syncMembers = that.state.syncMembers;
                // const prepMembers = that.state.prepMembers;
                if (fadeOuts && fadeOuts[(leadId + '')]) {
                    canvas.getObjects().forEach(p => {
                        if (fadeOuts[(leadId + '')].includes(p.id)) {
                            // console.log('target obj id: ', p.id + '')
                            // console.log('groupMembers: ', groupMembers[p.id + ''])
                            let synchs = _.map(_.filter(syncMembers, (obj) => obj.id.startsWith('sync:' + p.id + ':')), 'obj.id');
                            canvas.getObjects().forEach(s => {
                                if (synchs && synchs.includes(s.id)) {
                                    s.animate('opacity', 0, {
                                        duration: 960,
                                        onChange: canvas.renderAll.bind(canvas),
                                        onComplete: function () {
                                            // 애니메이션 완료 후 객체 제거
                                            canvas.remove(s);
                                        },
                                    })
                                }
                            });
                            let members = _.map(_.filter(groupMembers, (obj) => obj.id.startsWith('group:' + p.id + ':')), 'obj.id');
                            canvas.getObjects().forEach(s => {
                                if (members && members.includes(s.id)) {
                                    s.animate('opacity', 0, {
                                        duration: 960,
                                        onChange: canvas.renderAll.bind(canvas),
                                        onComplete: function () {
                                            // 애니메이션 완료 후 객체 제거
                                            canvas.remove(s);
                                        },
                                    })
                                }
                            });
                            let pMembers = _.map(_.filter(prepMembers, (obj) => obj.id.startsWith('preps:' + p.id + ':')), 'obj.id');
                            canvas.getObjects().forEach(s => {
                                if (pMembers && pMembers.includes(s.id)) {
                                    s.animate('opacity', 0, {
                                        duration: 960,
                                        onChange: canvas.renderAll.bind(canvas),
                                        onComplete: function () {
                                            // 애니메이션 완료 후 객체 제거
                                            canvas.remove(s);
                                        },
                                    })
                                }
                            });
                            p.animate('opacity', 0, {
                                duration: 960,
                                onChange: canvas.renderAll.bind(canvas),
                                onComplete: function () {
                                    // 애니메이션 완료 후 객체 제거
                                    canvas.remove(p);
                                },
                            })
                        }
                    })
                }

                let members = prepMembers.filter((s) => s.id.startsWith('preps:' + leadId));//_.map(_.filter(prepMembers, (obj) => obj.id.startsWith('preps:' + leadId + ':')), 'obj');
                console.log('😘😘😘 show members : ', members)
                const preps = []
                for (var i = 0; i < members.length; i++) {
                    preps.push(members[i].obj)
                }

                window.fabric.util.enlivenObjects(preps, function (objects) {
                    objects.forEach(function (o) {
                        const left = o.left;
                        o.left = canvasWidth;

                        o.moveTo(canvas.getObjects().length - 2);
                        // that.layObjToTop(leadId)

                        o.top = o.top * canvasScale
                        o.scaleX = o.scaleX * canvasScale;
                        o.scaleY = o.scaleY * canvasScale;
                        canvas.add(o);
                        o.animate('left', left * canvasScale, {
                            onChange: canvas.renderAll.bind(canvas), // 애니메이션 프레임마다 캔버스 갱신
                            onComplete: () => {
                                console.log('애니메이션 완료!');
                            },
                            duration: 1000, // 1초 동안 실행
                            easing: fabric.util.ease.easeOutBounce // 부드러운 가속 효과
                        });
                        canvas.renderAll();
                    });
                });
            } catch (e) {
                console.log(e);
            }
        }

        showSyncMembers = (leadId) => {

            try {
                if (leadId == null) return;

                let members = syncMembers.filter((s) => s.id.startsWith('sync:' + leadId));
                const synchs = []
                for (var i = 0; i < members.length; i++) {
                    synchs.push(members[i].obj)
                }
                console.log('😘😘😘 show members : ', synchs)

                window.fabric.util.enlivenObjects(synchs, function (objects) {
                    objects.forEach(function (o) {
                        o.left = o.left*canvasScale;
                        o.top = o.top * canvasScale;
                        o.scaleX = o.scaleX * canvasScale;
                        o.scaleY = o.scaleY * canvasScale;
                        setTimeout(() => {
                            o.moveTo(canvas.getObjects().length - 2);
                            o.animate('opacity', 1, {
                                duration: 480,
                                easing: fabric.util.ease.easeInSine,
                                onChange: canvas.renderAll.bind(canvas)
                            })
                            canvas.add(o);
                            canvas.renderAll();
                        }, 96)
                    });
                });
            } catch (e) {
                console.log(e);
            }
        }

        function showEpilogues(leadId) {
            try {
                if (leadId == null) return;

                let members = groupMembers.filter((s) => s.id.startsWith('group:' + leadId));//_.map(_.filter(epilogues, (obj) => obj.id.startsWith('group:' + leadId + ':')), 'obj');
                const epilogues = []
                for (var i = 0; i < members.length; i++) {
                    epilogues.push(members[i].obj)
                }
                console.log('😘😘😘 show members : ', epilogues)
                let baseObj = canvas.getObjects().filter(obj => obj.id === leadId);
                const startLeft = baseObj[0].left  + baseObj[0].width * baseObj[0].scaleX;
                const startTop = baseObj[0].top  + baseObj[0].height * baseObj[0].scaleY;
                window.fabric.util.enlivenObjects(epilogues, function (objects) {
                    objects.forEach(function (o) {
                        const l = o.left * canvasScale;
                        const t = o.top * canvasScale;
                        const scaleX = o.scaleX * canvasScale;
                        const scaleY = o.scaleY * canvasScale;
                        o.left = startLeft;
                        o.top = startTop;
                        o.scaleX = 0;
                        o.scaleY = 0;
                        setTimeout(() => {
                            o.moveTo(canvas.getObjects().length - 2);
                            canvas.add(o);
                            o.animate('left', l, {
                                onChange: canvas.renderAll.bind(canvas), // 애니메이션 프레임마다 캔버스 갱신
                                onComplete: () => {
                                    console.log('애니메이션 완료!');
                                },
                                duration: 1200, // 1초 동안 실행
                                easing: window.fabric.util.ease.easeOutBounce,
                            });
                            o.animate('top', t, {
                                onChange: canvas.renderAll.bind(canvas), // 애니메이션 프레임마다 캔버스 갱신
                                onComplete: () => {
                                    console.log('애니메이션 완료!');
                                },
                                duration: 1200, // 1초 동안 실행
                                easing: window.fabric.util.ease.easeOutBounce,
                            });
                            o.animate('scaleX', scaleX, {
                                onChange: canvas.renderAll.bind(canvas), // 애니메이션 프레임마다 캔버스 갱신
                                onComplete: () => {
                                    console.log('애니메이션 완료!');
                                },
                                duration: 1200, // 1초 동안 실행
                                easing: window.fabric.util.ease.easeOutBounce,
                            });
                            o.animate('scaleY', scaleY, {
                                onChange: canvas.renderAll.bind(canvas), // 애니메이션 프레임마다 캔버스 갱신
                                onComplete: () => {
                                    console.log('애니메이션 완료!');
                                },
                                duration: 1200, // 1초 동안 실행
                                easing: window.fabric.util.ease.easeOutBounce,
                            });
                            canvas.renderAll();
                        }, 96)
                    });
                });
            } catch (e) {
                console.log(e);
            }
        }

    </script>
</body>
</html>
`}