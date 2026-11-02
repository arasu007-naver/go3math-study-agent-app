import { NOTEBOOK_BG_SCALE_JS } from './notebook-background-scale';

export default function liveClassCanvasTemplate(width: number, height: number, pencilColor: string, pencilWidth: number) {
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
        var canvas = new fabric.Canvas('canvas');
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = '${pencilColor}';
        canvas.freeDrawingBrush.width = ${pencilWidth};
        canvas.freeDrawingBrush.mode = 'pencil';
        const canvasWidth = ${width};
        const canvasHeight = ${height};
        var classBoardScript = [];
        var classScale = ${height}/1920;
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
        var backgroundSubs=[];
        var lastObj ={};

        if (navigator.appVersion.includes('Android')) {
            document.addEventListener("message", function (data) {
                console.log('webview feedback template: ', data)
                let action = JSON.parse(data.data);
                
                dispatchCanvasAction(action)
                ReactNativeWebView.postMessage(JSON.stringify({pong: data}));
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
            
        });

        canvas.on("object:modified", (e) => {

        });

        // canvas.on("object:removed", (e) => {
        //     const mObj = e.target.toJSON(["id"]);
        //     console.log('object:removed', mObj);
        //     // console.log({ timestamp: new Date().getTime(), content: JSON.stringify(mObj), actionType: 'MODIFY' });
        //     // classBoardScript.push({ timestamp: new Date().getTime(), content: JSON.stringify(mObj), actionType: 'MODIFY' });
        // });

        canvas.on("path:created", (e) => {
        
        });

        function dispatchCanvasAction(action) {
            switch (action.actionType) {
                case 'CLEAN_260210':
                    console.log('CLEAN action: ' +  JSON.stringify(action));
                    cleanCanvas();
                    break;
                case 'REMOVE':
                    console.log('REMOVE action: ' +  JSON.stringify(action))
                    removeCurrentObject()
                    break;
                case 'REMOVE_OBJ':
                    console.log('REMOVE_OBJ action: ' +  JSON.stringify(action))
                    removeObjectWithId(action.obj.id)
                    break;
                case 'BACKGROUND':
                    classBoardScript = [];
                    changeBackgroundImage(action.obj.imageUrl||action.obj.image);
                    break; 
                case 'NOTEBOOK':
                    classBoardScript = [];
                    changeNotebookBackgroundImage(action.obj.imageUrl);
                    break;
                // case 'FEEDBACK':
                //     classBoardScript = [];
                //     changeFeedbackBackgroundImage(action.obj.imageUrl);
                //     break;
                case 'INIT_BACKGROUND':
                    classBoardScript = [];
                    changeFeedbackBackgroundImage(action.obj.imageUrl);
                    break;
                case 'ADD':case 'MODIFY':
                    try{
                        if(action.obj==null) action['obj'] = JSON.parse(action.content);
                        ReactNativeWebView.postMessage(JSON.stringify({ actionType: action.actionType, contentMeta: 'ADD'}));
                        const adds = canvas.getObjects().filter((p) => p.id == action.obj?.id);
                        adds.forEach((obj) => {
                            canvas.remove(obj);
                        });
                        hideSyncMembersOfId(action.obj.id);
                        setTimeout(()=>{
                            addObjToCanvas(action.obj);
                        }, 10)
                    }catch(err){
                        ReactNativeWebView.postMessage(JSON.stringify({ err: err, actionType: action.actionType, contentMeta: 'ADD'}));
                    }
                    break;
                case 'MODIFY_DEPRECATED':
                    ReactNativeWebView.postMessage(JSON.stringify({ MODIFY: action, contentMeta: 'MODIFY'}));
                    const modifies = canvas.getObjects().filter((p) => p.id == action.obj.id);
                    modifies.forEach((obj) => {
                        canvas.remove(obj);
                    });
                    hideSyncMembersOfId(action.obj.id);
                    // setTimeout(()=>{
                    //     modifyObjOfCanvas(action.obj);
                    // }, 10)
                    break;
                case 'TOGGLE_MODE':
                    toggleCanvasMode(action.pencilColor, action.pencilWidth);
                    break;
                case 'CLEAN_BOARD':
                    resetCanvas();
                    break;
                case 'CLEAN_MY_MEMO':
                    clearFreedrawings();
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
                case 'ADD_IMAGE':
                    insertImageResource(action.obj.imageUrl, action.obj.imgWidth, action.obj.imgHeight)
                    break;
                case 'SAVE':
                    uploadUnitWorkout();
                    break;
                case 'SNAPSHOT':
                    uploadSnapshot();
                    break;
                case 'FLY':
                    importObjectFromClipboard(action.obj);
                    break;
                case 'STAND_OUT':
                    magnifyObj(action.objId);
                    break;
                case 'CLEAN_ADHOCS':
                    removeFlyingObjs();
                    break;
                case "ACT_SUBS": case "SCENE_SUBS":
                    if(action.obj==null) action['obj'] = JSON.parse(action.content);
                    setActSubs(action.obj)
                    break;
                case 'BACKGROUND_SUBS':
                    if(action.obj==null) action['obj'] = JSON.parse(action.content);
                    if(action.obj) setBackgroundSubs(action.obj);
                    break;
                case 'ANIMATIONS':
                    setAnimations(action.obj)
                    break;
                case 'FADEOUTS':
                    if(action.obj==null) action['obj'] = JSON.parse(action.content);
                    setFadeOuts(action.obj)
                    break;
                case 'APPENDIX':
                    setAppendix(action.obj)
                    break;
                case 'SYNCS':
                    ReactNativeWebView.postMessage(JSON.stringify({ explanation: action, contentMeta: 'SYNCS' }));
                    setSyncMembers(action.content)
                    break;
                case 'GROUPS':
                    ReactNativeWebView.postMessage(JSON.stringify({ explanation: action.obj, contentMeta: 'GROUPS' }));
                    setGroupMembers(action.obj)
                    break;
                case 'PREPS':
                    ReactNativeWebView.postMessage(JSON.stringify({ explanation: action.obj, contentMeta: 'PREPS' }));
                    setPrepMembers(action.obj)
                    break;
                case 'ON_ANIMATION':
                    onAnimationCommand(action.obj);
                    break;
                case 'PROLOGUE':
                    removeObjectWithId(action.obj.id);
                    setTimeout(()=>{
                        addObjToCanvas(action.obj);
                    }, 10)
                    break;
                case 'FOLLOW':
                    removeObjectWithId(action.obj.id);
                    setTimeout(()=>{
                        addObjToCanvas(action.obj);
                    }, 10)
                    break;
                case 'EPILOGUE':
                    removeObjectWithId(action.obj.id);
                    setTimeout(()=>{
                        addObjToCanvas(action.obj);
                    }, 10)
                    break;
                case 'SYNCH': case 'SYNC_CANVAS_OBJECTS': case 'SYNC_OBJECTS':
                    if (action.objects && Array.isArray(action.objects)) {
                        syncCanvasObjects(action.objects);
                    }
                    break;
            }
        }

        onAnimationCommand = (ani) => {
            removeObjectWithId(ani.id);
            switch (ani.animationType) {
            case 'move':
                exeObjMovingAnimation(ani)
                break;
            }
        }

        exeObjMovingAnimation = (ani) => {
            window.fabric.util.enlivenObjects([ani.obj], function (objects) {
            objects.forEach(async function (o, index) {
                o.scaleX = o.scaleX * classScale;
                o.scaleY = o.scaleY * classScale;
                canvas.add(o);
                fabric.util.animate({
                    startValue: 0,
                    endValue: 1,
                    duration: 1200,
                    easing: fabric.util.ease.easeInOutQuart,
                    onChange: function (value) {
                        o.set({
                            left: ( ani.start.x  + (ani.end.x  - ani.start.x) * value) * classScale,
                            top: (ani.start.y + (ani.end.y - ani.start.y) * value) * classScale
                        });
                        canvas.renderAll();
                    },
                    onComplete: function () {
                        
                    }
                });
            })
            })
        }

        setFadeOuts = (fOuts) => {
            fadeOuts = fOuts;
        }

        setAppendix = (apndix) => {
            appendix = apndix;
        }

        setAnimations = (anims) => {
            animations = anims;
        }
        setGroupMembers = (members) => {
            groupMembers = members;
            ReactNativeWebView.postMessage(JSON.stringify({ explanation: members, contentMeta: 'GROUPS' }));
        }
        setPrepMembers = (members) => {
            prepMembers = members;
            ReactNativeWebView.postMessage(JSON.stringify({ explanation: members, contentMeta: 'PREPS' }));
        }
        setSyncMembers = (members)=> {
            syncMembers = members;
            ReactNativeWebView.postMessage(JSON.stringify({ explanation: members, contentMeta: 'SYNCS' }));
        }

        setActSubs = (aSubs) => {
            actSubs = aSubs;
        }

        setBackgroundSubs = (backSubs) => {
            backgroundSubs = backSubs;
        }

        async function showPrologues(leadId) {

            try {
                if (leadId == null) return;

                let members = prepMembers.filter((s) => s.id.startsWith('preps:' + leadId));//_.map(_.filter(prepMembers, (obj) => obj.id.startsWith('preps:' + leadId + ':')), 'obj');
                ReactNativeWebView.postMessage(JSON.stringify({ contentMeta: 'showPrologues', data: leadId }));
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

                        o.top = o.top * classScale
                        o.scaleX = o.scaleX * classScale;
                        o.scaleY = o.scaleY * classScale;
                        canvas.add(o);
                        o.animate('left', left * classScale, {
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

        function removeFlyingObjs() {
            const minions = canvas.getObjects().filter((p) => typeof p.id === 'string' && p.id.startsWith('fly:'));
            minions.forEach((obj) => {
                canvas.remove(obj);
            });
        }

        /**
         * 🌟 핵심 수정: magnifyObj 함수 (문법 및 참조 오류 수정)
         */
        function magnifyObj(objId) {
            // this.classcanvas -> canvas로 수정
            const target = canvas.getObjects().find(obj => obj.id === objId);
            
            if (target) {
                // 현재 스케일값 저장
                const orgScaleX = target.scaleX;
                const orgScaleY = target.scaleY;

                // 1.5배 확대 애니메이션
                target.animate({
                    scaleX: orgScaleX * 1.5,
                    scaleY: orgScaleY * 1.5
                }, {
                    duration: 1200,
                    onChange: canvas.requestRenderAll.bind(canvas),
                    easing: fabric.util.ease.easeOutBack, 
                    onComplete: () => {
                        console.log('Animation step 1 complete for:', target.id);
                        // 다시 원래 크기로 복귀 (강조 효과)
                        target.animate({
                            scaleX: orgScaleX,
                            scaleY: orgScaleY
                        }, {
                            duration: 600,
                            onChange: canvas.requestRenderAll.bind(canvas),
                            easing: fabric.util.ease.easeOutBack
                        });
                    }
                });
            } else {
                console.warn("ID가 '" + objId + "'인 객체를 찾을 수 없습니다.");
            }
        }

        function hideAppendix() {
            let appendix = canvas.getObjects().filter(obj => obj.id && typeof obj.id === 'string' && obj.id.startsWith('appendix:'));
            if (appendix) {
                appendix.forEach(function (value, index, ar) {
                    canvas.remove(value);
                });
            }
        }

        function removeObjectWithId(objId) {
            const minions = canvas.getObjects().filter((p) => p.id == objId);
            if (minions.length == 0) {
                return;
            }
            canvas.remove(minions[0]);
        };

        function enlivenPaatternedRect(tObj) {
                
                tObj.scaleX = tObj.scaleX * classScale;
                tObj.scaleY = tObj.scaleY * classScale;
                tObj.animate('opacity', 1, {
                    duration: 1200,
                    easing: window.fabric.util.ease.easeInSine,
                    onChange: canvas.renderAll.bind(canvas)
                })
                tObj.bringToFront()
                canvas.add(tObj);
                canvas.discardActiveObject().renderAll();
                // canvas.renderAll();
        }

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
                    // 이미 캔버스에 존재하는 객체는 건너뜀(skip)
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

        function addObjToCanvas(obj) {
            console.log('add Object to canvas: ', obj)
            hideAppendix();
            
            
            fabric.util.enlivenObjects([obj], function (objects) {
                objects.forEach(function (o) {
                    o.opacity = 0;
                    // showAppendix(o);
                    // showMembers(o);
                    o.top = o.top * classScale;
                    o.left = o.left * classScale;
                    enlivenPaatternedRect(o);
                    
                    setTimeout(()=>{
                        showSyncMembers(o.id);
                    }, 360)
                        
                });
            });
        };

        showSyncMembers = (leadId) => {
            try {
                if (leadId == null) return;

                let members = syncMembers.filter((s) => s.id.startsWith('sync:' + leadId));
                ReactNativeWebView.postMessage(JSON.stringify({ contentMeta: 'showSyncMembers', data: leadId, members: members, syncMembers: syncMembers }));
                const synchs = []
                for (var i = 0; i < members.length; i++) {
                    synchs.push(members[i].obj)
                }
                console.log('😘😘😘 show members : ', synchs)

                window.fabric.util.enlivenObjects(synchs, function (objects) {
                    objects.forEach(function (o) {
                        o.left = o.left*classScale;
                        o.top = o.top * classScale;
                        o.scaleX = o.scaleX * classScale;
                        o.scaleY = o.scaleY * classScale;
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
                        const l = o.left * classScale;
                        const t = o.top * classScale;
                        const scaleX = o.scaleX * classScale;
                        const scaleY = o.scaleY * classScale;
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

        function changeBackgroundImage(imageUrl) {
            console.log('changeBackgroundImage: ', imageUrl);
            // window.ReactNativeWebView.postMessage(JSON.stringify({contentMeta:'CLEANCUTS', method: 'changeBackgroundImage', image: imageUrl, classScale: classScale}));
            canvas.isDrawingMode = true;
            if (imageUrl != null) {
                canvas.clear();
                fabric.Image.fromURL(
                    imageUrl,
                    function (oImg) {
                        console.log('@@@@@@@@@@@ changeBackgroundImage: ', oImg);
                        let instanceScale = 810/1280*classScale;
                        window.ReactNativeWebView.postMessage(JSON.stringify({contentMeta:'CLEANCUTS', method: 'changeBackgroundImage', image: imageUrl, instanceScale: instanceScale}));
                        canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
                            top: 10*classScale,
                            left:10*classScale,
                            scaleX: instanceScale,
                            scaleY: instanceScale,
                            backgroundImageOpacity: 1,
                        });
                    },
                    { crossOrigin: "anonymous" }
                );
            }
            lastSupplementaryYPos = 0;
            
        };
        
        function changeFeedbackBackgroundImage(imageUrl) {
            console.log('changeFeedbackBackgroundImage: ', imageUrl);
            canvas.isDrawingMode = true;
            if (imageUrl != null) {
                let instanceScale = 810/1280*classScale;
                canvas.clear();
                fabric.Image.fromURL(
                    imageUrl,
                    function (oImg) {
                        canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
                            backgroundImageOpacity: 1,
                            top: 10*classScale,
                            left:10*classScale,
                            scaleX: instanceScale,
                            scaleY: instanceScale
                        });
                        window.ReactNativeWebView.postMessage(JSON.stringify({contentMeta:'BACKGROUND', method: '🟡🟡🟡 changeFeedbackBackgroundImage', image: imageUrl, canvasWidth: canvasWidth, objWidth:oImg.width}));
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
                        canvas.setBackgroundImage(oImg, canvas.renderAll.bind(canvas), {
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

        async function importObjectFromClipboard(obj){
            try {
            window.ReactNativeWebView.postMessage(JSON.stringify({response: '🟡🟡🟡 🟡🟡🟡 🟡🟡🟡 🟡🟡🟡 🟡🟡🟡 ', contentMeta:'FLY_OBJECT', canvasHeight: canvasHeight, obj: obj, classScale: classScale}));
            // if (obj['support'] != 'qoolla') {
            //     console.log('that is not qoolla drawing object')
            //     return;
            // }
            
            window.fabric.util.enlivenObjects([obj], function (objects) {
                objects.forEach(function (o) {
                o.selectable = false;
                o.top = o.top * classScale;
                o.left = o.left * classScale;
                o.scaleX = o.scaleX * classScale;
                o.scaleY = o.scaleY * classScale;
                setTimeout(()=>{
                    canvas.add(o);
                    canvas.discardActiveObject().renderAll();
                    // canvas.renderAll();
                    canvas.isDrawingMode = true;
                }, 10)
                
                });
            });
            } catch (err) {
            console.log('클립보드 읽기 실패:', err);
            // 사용자에게 오류를 알리거나 다른 처리를 할 수 있습니다.
            }
        }

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
              multiplier: 1280/canvasWidth,
            });
            setTimeout(async () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({content: dataUrl, contentMeta:'SAVE' }));
            }, 120)
        }

        async function uploadSnapshot() {
            let dataUrl;
            dataUrl = canvas.toDataURL({
              format: "png",
              multiplier: 1920/classScale,
            });
            setTimeout(async () => {
              window.ReactNativeWebView.postMessage(JSON.stringify({content: dataUrl, contentMeta:'SNAPSHOT' }));
            }, 12)
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

        function clearFreedrawings(){
            
            if (!canvas) return;
            const minions = canvas.getObjects();
            const targetsToRemove = minions.filter(obj => !obj.id);
            targetsToRemove.forEach(o => {
                canvas.remove(o);
            });
            canvas.renderAll();
            window.ReactNativeWebView.postMessage(JSON.stringify({content: dataUrl, contentMeta:'CLEAN_MY_MEMO' }));
        }

        clearCanvas = () => {
            let dataUrl;
            dataUrl = canvas.toDataURL({
              format: "png",
              multiplier: 1280/canvasWidth,
            });
            
            setTimeout(async () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({content: dataUrl, contentMeta:'SAVE' }));
                let minions = canvas.getObjects();
                // 2. filter와 includes를 사용하여 삭제 대상(ID가 리스트에 없는 것)을 골라냅니다.
                
                const targetsToRemove = minions.filter(obj => !backgroundSubs.includes(obj.id));
                
                targetsToRemove.forEach((o, index)=>{
                    canvas.remove(o)
                })
                canvas.renderAll();
            }, 60)
        }

        function toggleCanvasMode(color, brushWidth) {
            canvas.isDrawingMode =true;
            if (canvas.isDrawingMode) {
                console.log('toggleCanvasMode: color: ', color, ' pencilWidth: ', brushWidth)
                canvas.freeDrawingBrush.color = color;
                canvas.freeDrawingBrush.width = brushWidth;
            }
            window.ReactNativeWebView.postMessage(JSON.stringify({ contentMeta:'TOGGLE_MODE', color: color, brushWidth: brushWidth }));
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