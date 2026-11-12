// @ts-nocheck
/* eslint-disable react/display-name, no-var, react/jsx-key -- 기존 코드를 그대로 옮긴 파일 */
// 기존 qoolla-student-app `src/components/note-canvas/hotline-class-canvas.tsx`를 그대로 옮김(import 경로만 이 프로젝트에 맞춤).
// AppCtx·storage·utils는 ./legacy 호환 계층, 템플릿은 ../templates를 쓴다.
// https://github.com/Intellicode/eslint-plugin-react-native/issues/271

import { useContext, FC, forwardRef, useEffect, useState, useRef, useMemo, useImperativeHandle } from "react";
import {
    StatusBar,
    StyleSheet,
    View, Image, Dimensions,
    TouchableOpacity,
    FlatList,
    Text,
    ActivityIndicator,
} from "react-native";
import { WebView } from 'react-native-webview';
import QoollaWebView from '../../ui/web-view';
import uuid from 'react-native-uuid';
import * as _ from 'lodash'
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Sheet } from '../../../ui/Sheet';
import { IconButton } from '../../../ui/IconButton';
import { INK_LABELS } from './canvas-utils';
import PencilPropsModal from './pencil-props-modal';
import { colors, type } from '../../../ui/theme';
import { CanvasChrome, canvasTool } from '../CanvasChrome';
import { canvasStyles } from './canvasStyles';
import ReactNativeBlobUtil from 'react-native-blob-util'
import GoButton from '../../ui/go-button';
import HotlineClassCanvasTemplate from '../templates/live-class-canvas-template';
import { AppCtx } from './legacy';
import { requestStorageUrl } from '../../../api/rest';
import FullScreenWrapper from './screen-wrapper'
import { storage } from './legacy';
import { getBase64StringFromDataURL, sleep, findLargestSmallerThan } from './legacy'
import { DEFAULT_IMAGE_URL, CACHE_URL } from '../../../config/api.constants';
import {
    scriptMaker,
    makeTemporaryScript,
    safeJsonParse,
    handleLiveClassMessage,
    playToPoint,
    runAt,
    getLeaderIdForCut,
} from './script-maker';
import type {
    RawCut,
    GuideTarget,
    ScriptPlayerCallbacks,
    LiveClassMessageContext,
} from './script-maker';
import MathJaxWrapper from '../../math/MathJaxWrapper'
const { width, height } = Dimensions.get('window');
const strokeWidths = [3, 4, 6, 9, 15, 24];
const strokeColors = ['orange', 'blue', 'black', 'red', 'green']

const HotlineClassCanvasPanel = forwardRef(({ changeUnit, saveWorkout, loaded, topicUnits, onQuizReceived, screenActions }: any, ref) => {
    const webViewRef = useRef<any>(null);
    const webCanvasRef = useRef<any>(null);
    const { state, dispatch } = useContext(AppCtx);
    const isFocused = useIsFocused();


    const [actionIndex, setActionIndex] = useState(0);

    const [menuScript, setMenuScript] = useState<any>()
    const [currentScript, setCurrentScript] = useState<any>()
    const [currentIdx, setCurrentIdx] = useState(-1);
    const [prevCutIdx, setPrevCutIdx] = useState(0);
    const [lastGuide, setLastGuide] = useState<any>({ studyIdx: 0, step: 'refresh' })
    const [visiblePencilProps, setVisiblePencilProps] = useState(false);
    const [visiblePopup, setVisiblePopup] = useState(false);
    const [visibleMemoPopup, setVisibleMemoPopup] = useState(false);
    const [targetGuide, setTargetGuide] = useState<any>();
    const [canvasDimensions, setCanvasDimensions] = useState({ width: width, height: height - 96 })
    const [releaseScriptUrl, setReleaseScriptUrl] = useState<string | undefined>()


    const [canvasStrokeWidth, setCanvasStrokeWidth] = useState(6);
    const [canvasStrokeColor, setCanvasStrokeColor] = useState('orange');

    const [studySequences, setStudySequences] = useState<any[]>([]);
    const [prologues, setPrologues] = useState<any>()
    const [epilogues, setEpilogues] = useState<any>()
    const [synchs, setSynchs] = useState<any[]>([])
    const [appendices, setAppendices] = useState<any>()
    const [refreshIndices, setRefreshIndices] = useState<number[]>([])

    const [currentScriptId, setCurrentScriptId] = useState(0);

    const [popupUrl, setPopupUrl] = useState<string>();
    const [memoMessage, setMemoMessage] = useState<any>();

    const currentScriptString = useMemo(() => {
        return JSON.stringify(currentScript)
    }, [currentScript])

    useImperativeHandle(ref, () => ({
        async onReceiveGuide(guide: any) {
            hideModal();
            if (guide.action === 'snapshot') {
                sendBoardAction({ actionType: 'SAVE' })
                return;
            }

            if (guide.scriptId == null) {
                if (currentScript?.sourceType != guide.sourceType || currentScript?.sourceId != guide.sourceId) {
                    storage.set('syncPoint', JSON.stringify(guide))
                    setLastGuide({ studyIdx: 0, step: 'refresh' })
                    setTargetGuide(guide);
                    setCurrentScript({ sourceType: guide.sourceType, sourceId: guide.sourceId })
                    setReleaseScriptUrl(undefined)
                    setCurrentScriptId(0);
                    return;
                }
            } else if (Number(guide.scriptId) > 0) {
                if (currentScriptId != Number(guide.scriptId)) {
                    setLastGuide({ studyIdx: 0, step: 'refresh' })
                    setTargetGuide(guide);
                    setCurrentScriptId(Number(guide.scriptId))
                    setReleaseScriptUrl(undefined)
                    storage.set('syncPoint', JSON.stringify(guide))
                    return;
                }
            }

            const ctx: LiveClassMessageContext = {
                platform: 'mobile',
                currentScript,
                canvas: {
                    magnifyObj: (targetId) => {
                        sendBoardAction({ actionType: 'STAND_OUT', objId: targetId });
                    },
                    magnifyArea: (area) => {
                        sendBoardAction({ actionType: 'STAND_OUT', obj: area });
                    },
                    removeObjectWithId: (id) => {
                        sendBoardAction({ actionType: 'REMOVE_OBJ', obj: { id } });
                    },
                    onAnimationCommand: (anim) => {
                        sendBoardAction({ actionType: 'ON_ANIMATION', obj: anim });
                    },
                    clearCanvas: () => {
                        sendBoardAction({ actionType: 'CLEAR_CANVAS' });
                    },
                    withoutFurtherAdo: () => {
                        sendBoardAction({ actionType: 'CLEAN_ADHOCS' });
                    },
                    removeFlyingObjs: () => {
                        sendBoardAction({ actionType: 'CLEAN_ADHOCS' });
                    },
                    importObjectFromClipboard: (obj) => {
                        sendBoardAction({ actionType: 'FLY', obj });
                    },
                    syncCanvasObjects: (objects) => {
                        sendBoardAction({ actionType: 'SYNCH', objects });
                    },
                    takeSnapShotOfCanvas: () => {
                        sendBoardAction({ actionType: 'SAVE' });
                    },
                },
                closeBoardMemo: hideModal,
                closeModalHandler: hideModal,
                setCutSequence: (step) => {
                    setLastGuide((prev: any) => ({ ...prev, step }));
                },
                setLastGuide: (g) => setLastGuide(g as any),
                setCurrentScript: (s) => setCurrentScript(s),
                setPopupUrl: (url) => setPopupUrl(url),
                setShowPopupModal: (show) => setVisiblePopup(show),
                setPrepMembers: (m) => setPrologues(m),
                setSyncMembers: (m) => setSynchs(m as any),
                setGroupMembers: (m) => setEpilogues(m),
                downloadScript: () => {
                    setStudySequences([]);
                    reloadScript();
                    synchToCurrent();
                },
                playToPoint: async (tgt) => {
                    await playToPointInternal(tgt, lastGuide);
                },
                takeSnapShotOfCanvas: () => {
                    sendBoardAction({ actionType: 'SAVE' });
                },
                sleepFn: sleep,
            };

            if (guide.action === 'quiz') {
                if (onQuizReceived) {
                    onQuizReceived({ quizId: guide.quizId, content: guide.quiz });
                }
                return;
            }

            if (guide.action === 'follow') {
                synchToCurrent();
                return;
            }

            if (guide.action === 'lastStep') {
                await playLastStep();
                return;
            }

            if (guide.action === 'canvas-synch') {
                sendBoardAction({ actionType: 'SYNCH', objects: guide.objects });
                return;
            }

            if (guide.action === 'synch') {
                if (guide.objects && Array.isArray(guide.objects)) {
                    sendBoardAction({ actionType: 'SYNCH', objects: guide.objects });
                }
                if (guide.studyIdx != null) {
                    setCurrentIdx(guide.studyIdx);
                }
                if (guide.step || guide.mode) {
                    setLastGuide((prev: any) => ({ ...prev, ...guide, step: guide.step || guide.mode }));
                } else {
                    setLastGuide(guide);
                }
                return;
            }

            await handleLiveClassMessage(guide, ctx, { platform: 'mobile' });
        },

        getCurrentScript() {
            return { scriptId: currentScript?.id, sourceType: currentScript?.sourceType, sourceId: currentScript?.sourceId }
        }

    }));

    const sendBoardAction = async (command: any) => {
        if (webCanvasRef.current && command) {
            webCanvasRef.current.postMessage(JSON.stringify(command));
        }
    }

    const refreshMenuscript = async () => {
        let scriptList = storage.getString('live-scripts');

        if (scriptList) {
            let scriptsArray = JSON.parse(scriptList);
            if (scriptsArray && scriptsArray.length > 0) {
                let targetScript = currentScript;
                let targetScriptId = currentScriptId;
                if (Number(targetScriptId) > 0) {
                    let tScript = _.filter(scriptsArray, (src: any) => (Number(src.id) == Number(targetScriptId)));
                    if (tScript.length > 0) {
                        setCurrentScript(tScript[0])
                        setReleaseScriptUrl(tScript[0].releaseScriptUrl);
                        return;
                    }
                }

                let dScript = _.filter(scriptsArray, (src: any) => (src.id == targetScript.id) && (src.sourceType == targetScript.sourceType) && (src.sourceId == targetScript.sourceId));
                if (dScript.length > 0) {
                    setReleaseScriptUrl('default');
                }

            }
        }
    }

    const getEpilogues = (leadId: string | number) => {
        let members = _.map(_.filter(epilogues, (obj: any) => obj.id.startsWith('group:' + leadId + ':')), 'obj');
        return members;
    }

    const getSynchs = (leadId: string | number) => {
        let members = _.map(_.filter(synchs, (obj: any) => obj.id.startsWith('sync:' + leadId + ':')), 'obj');
        return members;
    }

    const getPrologues = (leadId: string | number) => {
        let members = _.map(_.filter(prologues, (obj: any) => obj.id.startsWith('preps:' + leadId + ':')), 'obj');
        return members;
    }

    const getPlayerCallbacks = (): ScriptPlayerCallbacks<RawCut> => ({
        runCut: async (cut) => {
            hideModal();
            const obj = cut.obj ?? safeJsonParse(cut.content, {});
            if (cut.actionType === 'POPUP') {
                // skip POPUP
            } else if (cut.actionType === 'MEMO') {
                // const msg = safeJsonParse(obj.content, {});
                // console.log('😍😍😍😍 obj: ', obj)
                setMemoMessage(obj);
                setTimeout(() => {
                    setVisibleMemoPopup(true);
                }, 36);
            } else {
                sendBoardAction(cut);
            }

            const leaderId = getLeaderIdForCut(cut);
            if (leaderId) {
                const mainFollows = getSynchs(leaderId);
                for (let i = 0; i < mainFollows.length; i++) {
                    sendBoardAction({ actionType: 'FOLLOW', obj: mainFollows[i] });
                    await sleep(120);
                }
            }
        },
        runPrologue: async (cut, leaderId) => {
            if (leaderId) {
                const prefices = getPrologues(leaderId);
                for (let i = 0; i < prefices.length; i++) {
                    sendBoardAction({ actionType: 'PROLOGUE', obj: prefices[i] });
                    await sleep(120);
                }
            }
        },
        runEpilogue: async (cut, leaderId) => {
            if (leaderId) {
                const postfices = getEpilogues(leaderId);
                for (let i = 0; i < postfices.length; i++) {
                    sendBoardAction({ actionType: 'EPILOGUE', obj: postfices[i] });
                    await sleep(120);
                }
            }
        },
        hasPrologue: (leaderId) => {
            if (!leaderId || !prologues) return false;
            return getPrologues(leaderId).length > 0;
        },
        hasEpilogue: (leaderId) => {
            if (!leaderId || !epilogues) return false;
            return getEpilogues(leaderId).length > 0;
        },
        onStateChange: (state) => {
            setLastGuide(state.lastGuide ?? { studyIdx: state.currentIdx, step: state.cutSequence });
            setCurrentIdx(state.currentIdx);
        },
        syncCanvasObjects: async (objects) => {
            sendBoardAction({ actionType: 'SYNCH', objects });
        },
        sleepFn: sleep,
    });

    const playToPointInternal = async (targetPt: GuideTarget, fromPt?: GuideTarget | null) => {
        hideModal();
        if (!studySequences || studySequences.length === 0) return;
        if (fromPt == null && menuScript?.backgroundCut) {
            sendBoardAction(menuScript.backgroundCut);
        }
        const callbacks = getPlayerCallbacks();
        await playToPoint(studySequences, targetPt, fromPt, callbacks);
        if (targetPt.objects && Array.isArray(targetPt.objects)) {
            sendBoardAction({ actionType: 'SYNCH', objects: targetPt.objects });
        }
    };

    const synchToCurrent = () => {
        let startIdx = 0;
        if (lastGuide) {
            startIdx = findLargestSmallerThan(refreshIndices, lastGuide.studyIdx);
        }
        const startPoint: GuideTarget = { studyIdx: startIdx, step: 'refresh' };
        setTimeout(() => {
            playToPointInternal(lastGuide, startPoint);
        }, 120);
    };

    const playLastStep = async () => {
        if (lastGuide && studySequences.length > 0) {
            const callbacks = getPlayerCallbacks();
            await runAt(studySequences, lastGuide.studyIdx, (lastGuide.step as any) ?? 'main', callbacks);
        }
    };

    const initClassroomStuffs = (mScript) => {
        if (mScript.actSubs) {
            const activeSubsStuff = { actionType: 'ACT_SUBS', content: JSON.stringify(mScript.actSubs) }   // size.height
            sendBoardAction(activeSubsStuff)
        }

        if (mScript.backgroundSubs) {
            const backgroundSubsStuff = { actionType: 'BACKGROUND_SUBS', content: JSON.stringify(mScript.backgroundSubs), obj: mScript.backgroundSubs }   // size.height    
            sendBoardAction(backgroundSubsStuff)
        }

        if (mScript.animations) {
            const animationsStuff = { actionType: 'ANIMATIONS', content: JSON.stringify(mScript.animations), obj: mScript.animations }   // size.height    
            sendBoardAction(animationsStuff)
        }

        if (mScript.fadeOuts) {
            const fadeoutsStuff = { actionType: 'FADEOUTS', content: JSON.stringify(mScript.fadeOuts), obj: mScript.fadeOuts }   // size.height    
            sendBoardAction(fadeoutsStuff)
        }

        if (mScript.appendix) {
            // const appendicesStuff = { actionType: 'APPENDIX', content: JSON.stringify(mScript.appendix) }   // size.height    
            // sendBoardAction(appendicesStuff)
            setAppendices(mScript.appendix)
        }

        if (mScript.groups) {
            // const groupsStuff = { actionType: 'GROUPS', content: JSON.stringify(mScript.groups) }   // size.height    
            // sendBoardAction(groupsStuff)
            setEpilogues(mScript.groups)
        }

        if (mScript.syncMembers) {
            // const syncStuff = { actionType: 'SYNCS', content: mScript.syncMembers }   // size.height    
            // sendBoardAction(syncStuff)
            setSynchs(mScript.syncMembers)
        }

        if (mScript.prepMembers) {
            // const prologuesStuff = { actionType: 'PREPS', content: JSON.stringify(mScript.prepMembers) }   // size.height    
            // sendBoardAction(prologuesStuff)
            setPrologues(mScript.prepMembers)
        }

        if (mScript.refreshPoints) {
            setRefreshIndices(mScript.refreshPoints);
        }

        if (mScript.backgroundCut) {
            sendBoardAction(mScript.backgroundCut)
        }
    }

    const hideModal = () => {
        setVisiblePencilProps(false);
        setVisiblePopup(false)
        setVisibleMemoPopup(false);
    }

    const loadPencilState = () => {
        // sendBoardAction({
        //     actionType: "INIT_BACKGROUND", obj: { imageUrl: DEFAULT_IMAGE_URL }
        // });
        const sketchColor = storage.getString('canvasStrokeColor');
        setCanvasStrokeColor(sketchColor || 'orange')
        const pencilWidth = storage.getNumber('canvasStrokeWidth');
        setCanvasStrokeWidth(pencilWidth || 6);
        const command = { actionType: 'TOGGLE_MODE', pencilColor: canvasStrokeColor, pencilWidth: canvasStrokeWidth, content: JSON.stringify({ pencilColor: canvasStrokeColor, pencilWidth: canvasStrokeWidth }) };
        // console.log('📶📶📶📶📶📶📶📶📶📶📶📶📶📶📶📶📶📶 toggle TOGGLE_MODE', command)
        sendBoardAction(command);

    }

    const initBackground = async () => {
        loadPencilState();
        if (menuScript) {
            sendBoardAction(menuScript.backgroundCut)
            const syncPoint = storage.getString('syncPoint')
            if (syncPoint) {
                const tPt = JSON.parse(syncPoint);
                playToPointInternal(tPt)
                storage.remove('syncPoint')
            }
        }
        if (loaded) loaded();
    }

    const uploadWorkoutToStorage = async (dataUrl) => {

        try {
            const fileName = uuid.v4();
            const space = await requestStorageUrl(fileName + ".png", state.appToken + "", 'math-files/' + currentScript.sourceType + '/' + currentScript.sourceId);
            var signedUrl = space.data.url;
            // console.log('uploadFeedbackCutToStorage: ', signedUrl);
            const fileContent = getBase64StringFromDataURL(dataUrl);

            await ReactNativeBlobUtil.fetch(
                'PUT',
                signedUrl,
                {
                    'x-ms-blob-type': 'BlockBlob',
                    'content-type': 'application/octet-stream',
                    'x-ms-blob-content-type': "image/png",
                },
                fileContent,
            );

            const imageUrl = signedUrl.split("?")[0];
            if (saveWorkout) {
                saveWorkout(imageUrl, currentScript.sourceType, currentScript.sourceId);
            }

        } catch (err) {
            console.log(err);
            return null;
        }
    }

    const initClassBoard = async (releaseScriptUrl) => {

        const cuts = await scriptMaker(releaseScriptUrl);
        initClassroomStuffs(cuts);
        setMenuScript(cuts)
        setStudySequences(cuts.contents)

    }

    const initDefaultClassBoard = async (sourceType, sourceId) => {

        const cuts = makeTemporaryScript(sourceType, sourceId);
        initClassroomStuffs(cuts);
        setMenuScript(cuts)
        setStudySequences(cuts.contents)
        // sendBoardAction(cuts.backgroundCut)

    }

    const reloadScript = async () => {

        const cuts = await scriptMaker(`${currentScript.releaseScriptUrl}?ts=${uuid.v4()}`);
        initClassroomStuffs(cuts);
        setMenuScript(cuts)
        setStudySequences(cuts.contents)

    }

    const handleMessage = async (message) => {
        switch (message.contentMeta) {
            case 'SAVE': case 'SNAPSHOT':
                uploadWorkoutToStorage(message.content);
                break;
            case 'TOGGLE_MODE':
                // console.log('😅😅😅😅😅:😅😅😅😅😅:😅😅😅😅😅:😅😅😅😅😅:😅😅😅😅😅 TOGGLE_MODE', message);
                // setIsDrawingMode(!isDrawingMode);
                break;
            case 'CLEANCUTS':
                // console.log('CLEANCUTS');
                // initSheets();
                break;
            case 'BACKGROUND':
                break;
            case 'SYNCS':
                // console.log('😅😅😅😅😅:😅😅😅😅😅:😅😅😅😅😅:😅😅😅😅😅:😅😅😅😅😅: message from webview: ', message)
                break;
            case 'showSyncMembers':
                // console.log('😅😅😅😅😅:😅😅😅😅😅:😅😅😅😅😅:😅😅😅😅😅:😅😅😅😅😅: message from webview: ', message)
                break;
        }
    }

    const drawPencilColorOptions = () => {
        return strokeColors.map((color, index) => {
            return <GoButton onPress={() => {
                setCanvasStrokeColor(color);
                storage.set('canvasStrokeColor', color);
            }} title={INK_LABELS[color]} key={'pencil-color-' + index}
                variant={canvasStrokeColor == color ? 'filled' : 'outline'}
                color={color}
                textColor={canvasStrokeColor == color ? 'white' : 'black'}
                rippleColor={color}
            />
        })
    }

    const drawPencilWidthOptions = () => {
        return strokeWidths.map((strokeWidth, index) => {
            return <GoButton onPress={() => {
                setCanvasStrokeWidth(strokeWidth);
                storage.set('canvasStrokeWidth', strokeWidth);
            }}
                title={String(strokeWidth)}
                key={'pencil-width-' + index}
                variant={canvasStrokeWidth == strokeWidth ? 'filled' : 'outline'}
                color={canvasStrokeWidth == strokeWidth ? canvasStrokeColor : 'orange'}
                textColor={canvasStrokeWidth == strokeWidth ? 'white' : canvasStrokeColor}
                rippleColor={canvasStrokeColor}
            />
        })
    }

    const onLayout = (event) => {
        const { width, height } = event.nativeEvent.layout;
        setCanvasDimensions({ width: width, height: height - 12 })

        // console.log('TopicLiveClassCanvasPanel 🟡🟡 🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡 canvas container onLayout Width:', width, 'Height:', height);
    };

    const canvasHTMLTemplate = useMemo(() => {
        const sketchColor = storage.getString('canvasStrokeColor') || 'orange';
        const pencilWidth = storage.getNumber('canvasStrokeWidth') || 6;
        return HotlineClassCanvasTemplate(canvasDimensions.width, canvasDimensions.height, sketchColor, pencilWidth)
    }, [canvasDimensions])

    const webViewSource = useMemo(() => {
        return { html: canvasHTMLTemplate };
    }, [canvasHTMLTemplate]);

    useEffect(() => {
        // console.log('@@@@@@ unitWorkoutRef.current', unitWorkoutRef.current);
        if (menuScript) {
            initClassroomStuffs(menuScript)
            sendBoardAction(menuScript.backgroundCut)
            const syncPoint = storage.getString('syncPoint')
            if (syncPoint) {
                const tPt = JSON.parse(syncPoint);
                playToPointInternal(tPt)
                storage.remove('syncPoint')
            }
        }

    }, [menuScript]);

    useEffect(() => {
        // console.log('@@@@@@ unitWorkoutRef.current', unitWorkoutRef.current);
        if (releaseScriptUrl) {
            if (releaseScriptUrl === 'default') {
                // console.log('currentScript 🟡🟡 🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡 currentScript:', currentScript);
                initDefaultClassBoard(currentScript.sourceType, currentScript.sourceId);

            } else {
                initClassBoard(releaseScriptUrl);
            }
            if (changeUnit) {
                changeUnit(currentScript)
            }
        }
    }, [releaseScriptUrl]);


    useEffect(() => {
        refreshMenuscript();
    }, [topicUnits, currentScriptString, currentScriptId]);


    useEffect(() => {
        // console.log('@@@@@@ unitWorkoutRef.current', unitWorkoutRef.current);
        if (canvasStrokeWidth > 0) {
            storage.set('canvasStrokeWidth', canvasStrokeWidth);
            // console.log('canvasStrokeColor', canvasStrokeColor);
            const command = { actionType: 'TOGGLE_MODE', pencilColor: canvasStrokeColor, pencilWidth: canvasStrokeWidth };
            sendBoardAction(command);
        }
    }, [canvasStrokeWidth]);

    useEffect(() => {
        // console.log('@@@@@@ unitWorkoutRef.current', unitWorkoutRef.current);
        if (typeof canvasStrokeColor === 'string') {
            storage.set('canvasStrokeColor', canvasStrokeColor);
            // console.log('canvasStrokeColor', canvasStrokeColor);
            const command = { actionType: 'TOGGLE_MODE', pencilColor: canvasStrokeColor, pencilWidth: canvasStrokeWidth };
            sendBoardAction(command);
        }
    }, [canvasStrokeColor]);

    useEffect(() => {
        // console.log('@@@@@@ isFocused');
        // const keys = storage.getAllKeys();
        // console.log('mmkv storeage keys: ', keys)

        if (isFocused) {
            const sketchColor = storage.getString('canvasStrokeColor');
            setCanvasStrokeColor(sketchColor || 'orange')
            const pencilWidth = storage.getNumber('canvasStrokeWidth');
            setCanvasStrokeWidth(pencilWidth || 6);
            const command = { actionType: 'TOGGLE_MODE', pencilColor: canvasStrokeColor, pencilWidth: canvasStrokeWidth };
            sendBoardAction(command);
            // console.log('@@@@@@ isFocused sketchColor: ', sketchColor, ' pencilWidth: ', pencilWidth);
        } else {
            setCurrentScript();
            setCurrentScriptId(0)
            setMenuScript()
        }

    }, [isFocused]);

    return (
        <FullScreenWrapper>
            <View style={{ flex: 1, width: '100%', height: '100%', padding: 0 }}>
                <Sheet visible={visiblePopup} onDismiss={hideModal} style={[canvasStyles.popup, { maxHeight: 960 }]}>
                        <View>
                            {popupUrl && (
                                <QoollaWebView
                                    ref={webViewRef}
                                    originWhitelist={['*']}
                                    style={{ width: Math.floor(width / 2), height: 720 }}
                                    source={{ uri: popupUrl }}
                                />
                            )}
                        </View>
                </Sheet>
                {studySequences.length > 0 ?
                    <View style={[canvasStyles.frame, { width: width }]} onLayout={onLayout}>
                        <WebView
                            ref={webCanvasRef}
                            originWhitelist={['*']}
                            style={{ width: width - 6, height: height - 96 }}
                            source={webViewSource}
                            javaScriptEnabled={true}
                            onLoadEnd={initBackground}
                            onMessage={(event) => {
                                const message = JSON.parse(event.nativeEvent.data);
                                // console.log('🟡🟡 🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡.  message: ', message.contentMeta);
                                handleMessage(message);
                            }}
                            onError={(syntheticEvent) => {
                                const { nativeEvent } = syntheticEvent;
                                console.log('🟡🟡 🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡🟡WebView error: ', nativeEvent);
                            }}
                        />
                        {visibleMemoPopup && memoMessage && (
                            <View style={canvasStyles.memoToast}>
                                <IconButton size="sm" icon="close" accessibilityLabel="메모 닫기" onPress={() => setVisibleMemoPopup(false)} style={canvasStyles.memoToastClose} />
                                <MathJaxWrapper statement={memoMessage.content} fontSize={48} color="#ea580c" fullView={true} autoSize={true} maxWidth={640} />
                            </View>
                        )}
                    </View> : <View style={[canvasStyles.loading, { width: width }]} >
                        <ActivityIndicator size={'large'} color={colors.accent} />
                    </View>}
                {/* 기존 상단 버튼 줄을 하단 가운데 떠 있는 툴바로 옮겼다(design-spec P2-1). 부르는 함수·액션은 같다. */}
                <CanvasChrome
                    actions={screenActions}
                    tools={[canvasTool('color', 'Options'), canvasTool('clearBoard', '전체 지우기'), canvasTool('clearMemo', '내 필기 지우기'), canvasTool('save', '저장')]}
                    strokeColor={canvasStrokeColor}
                    onSelectTool={(id) => {
                        if (id === 'color') setVisiblePencilProps(true);
                        else if (id === 'clearBoard') sendBoardAction({ actionType: "CLEAN_BOARD" });
                        else if (id === 'clearMemo') sendBoardAction({ actionType: "CLEAN_MY_MEMO" });
                        else if (id === 'save') sendBoardAction({ actionType: "SAVE" });
                    }}>
                    <PencilPropsModal
                        visible={visiblePencilProps}
                        onDismiss={hideModal}
                        renderWidthOptions={drawPencilWidthOptions}
                        renderColorOptions={drawPencilColorOptions}
                    />
                </CanvasChrome>
            </View>
        </FullScreenWrapper>
    );
});

const styles = StyleSheet.create({
    screenContainer: {
        flex: 1,
        backgroundColor: "white",
        margin: 0,
        padding: 0
    },
    headerContainer: {
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        flexDirection: 'column',
        backgroundColor: colors.accent
    },
    mainComponentStyle: {
        flex: 1,
        margin: 0,
        padding: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardButtonContainerStyle: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 6,
    },
    bookmarkButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.accent,
        position: 'absolute',
        bottom: 10,
        right: 10,
        padding: 0,
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonContainerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        height: 48,
        marginTop: 6,
        marginLeft: 6
    },
    sheetsContainerStyle: {
        flex: 1,
        minHeight: '100%',
        minWidth: '100%'
    },
    emptyListStyle: {
        padding: 10,
        ...type.heading,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
        minWidth: '100%'
    },
    horizontalScrollView: {
        maxHeight: 48,
        height: 42,
        padding: 3
    }
});

export default HotlineClassCanvasPanel;
