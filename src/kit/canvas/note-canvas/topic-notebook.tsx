// @ts-nocheck
/* eslint-disable react/display-name, no-var, react/jsx-key -- 기존 코드를 그대로 옮긴 파일 */
// 기존 qoolla-student-app `src/components/note-canvas/topic-notebook.tsx`를 그대로 옮김(import 경로만 이 프로젝트에 맞춤).
// AppCtx·storage·utils는 ./legacy 호환 계층, 템플릿은 ../templates를 쓴다.
// https://github.com/Intellicode/eslint-plugin-react-native/issues/271

import { useContext, FC, forwardRef, useEffect, useState, useRef, useImperativeHandle, useMemo } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    View, Image, Dimensions,
    TouchableOpacity,
    FlatList,
    Text
} from "react-native";
import { IconButton } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import QoollaWebView from '../../ui/web-view';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { Modal as PaperModal, Portal } from 'react-native-paper';
import ReactNativeBlobUtil from 'react-native-blob-util'
import GoButton from '../../ui/go-button';
import topicCanvasTemplate from '../templates/topic-canvas-template';
import { AppCtx } from './legacy';
import { CACHE_URL, DEFAULT_IMAGE_URL } from '../../../config/api.constants'
import { requestStorageUrl } from '../../../api/rest';
import { storage } from './legacy';
import MathJaxView from './math-web-view'
import Go3MathLoader from '../../ui/loading-view';

import { memoMathJaxHtml } from '../../math/templates/equ-memo-template'
const { width, height } = Dimensions.get('window');

const getBase64StringFromDataURL = (dataURL) =>
    dataURL.replace('data:', '').replace(/^.+,/, '');

const strokeWidths = [3, 4, 6, 9, 15, 24];
const strokeColors = ['orange', 'blue', 'black', 'red', 'green']
const ActivityIndicatorElement = () => {
    return (
        <Go3MathLoader style={{ width: '100%', heiht: '100%' }} />
    );
};
// const EXAMPLE_BACKGROUND = 'https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer/43727da2-1111-4dbd-832d-a9118324bd9e/96C4A230-0DE6-41C2-ABC0-6A90B3B9B85C.jpg';
// const FEEDBACK_SCRIPT_EXAMPLE = 'https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer/math-files/images/script/FEEDBACK/3370/1698546970766.json';
const TopicNotebookCanvasPanel: FC = forwardRef((props, ref) => {
    const { loaded, saveWorkout, saveMentorRequestShot } = props;
    const webViewRef = useRef(null);
    const webMemoViewRef = useRef(null)
    const webPopupViewRef = useRef(null)
    const { state, dispatch } = useContext(AppCtx);
    const isFocused = useIsFocused();
    const unitHolder = useRef({
        sourceType: 'UNIT',
        sourceId: 0,
        unitModelId: 0
    });

    const [canvasStrokeWidth, setCanvasStrokeWidth] = useState();
    const [canvasStrokeColor, setCanvasStrokeColor] = useState();
    const [pageLoadProgress, setPageLoadProgress] = useState(0);
    const [subCount, setSubCount] = useState(0);
    const [leaderId, setLeaderId] = useState();

    const [visiblePencilProps, setVisiblePencilProps] = useState(false);
    const [visiblePopup, setVisiblePopup] = useState(false);
    const [visibleMemoPopup, setVisibleMemoPopup] = useState(false);
    const hidePencilPropsModal = () => hideModal();

    const [lastPick, setLastPick] = useState()

    const dialogWidth = width * 2 / 3;
    const dialogHeight = height / 2;


    const [isToastVisible, setIsToastVisible] = useState(false);
    const [popupMsg, setPopupMsg] = useState()
    const [popupUrl, setPopupUrl] = useState()
    const [mathMemos, setMathMemos] = useState();

    const showToast = (msg) => {
        setPopupMsg(msg)
        setIsToastVisible(true);
    };

    const hideToast = () => {
        setPopupUrl()
        setIsToastVisible(false);
    };

    const [isMemoVisible, setIsMemoVisible] = useState(false);
    const [memopMsg, setMemoMsg] = useState()
    const showMemo = (msg) => {
        setMemoMsg(msg.content)
        setIsMemoVisible(true);
    };

    const memoHtmlContent = useMemo(() => {
        return memoMathJaxHtml(mathMemos)
    }, [mathMemos])

    const hideMemo = () => {
        setIsMemoVisible(false);
    };
    const runFirst = `
    //   setTimeout(function() { 
    //       window.alert("Click me!");
    //       ReactNativeWebView.postMessage(JSON.stringify({ explanation: 'injected javascript', contentMeta: 'INJECTED_JAVASCRIPT' }));
    //     }, 1000);
      return true;
    `;

    const hideModal = () => {
        setVisiblePencilProps(false);
        setVisiblePopup(false)
        setVisibleMemoPopup(false);
        setIsToastVisible(false)
    }

    useImperativeHandle(ref, () => ({
        changeNotebookBackgroundImage(imageUrl, sourceType, sourceId, unitModelId) {

            // console.log("changeNotebookBackgroundImage: " + imageUrl);
            // const keys = storage.getAllKeys();
            // console.log('mmkv storeage keys: ', keys)
            sendBoardAction({
                actionType: "NOTEBOOK", obj: { imageUrl: imageUrl }
            });
        },
        sendCut(msg) {
            hideMemo();
            hideToast();

            if (msg) {
                if (msg.actionType === 'POPUP') {
                    // skip POPUP
                    return;
                }
                if (msg.actionType === 'MEMO') {
                    console.log('✴️✴️✴️ memo message: ', msg)
                    // console.log('content: ', JSON.parse(msg.content));
                    const memo = JSON.parse(msg.content)
                    setMathMemos(memo.memos)
                    setTimeout(() => {
                        setVisibleMemoPopup(true)
                    }, 36);
                    // showMemo(msg)
                    return;
                }
                sendBoardAction(msg);
            }
            // if (msg.actionType === 'BACKGROUND') {
            //     console.log('msg: ', msg, ' canvas width: ', (width - 6), ' height: ', (height - 72))
            // }
        },
        saveSnapshotForMentoring() {

            // console.log("✴️✴️✴️ saveSnapshotForMentoring: ");
            sendBoardAction({
                actionType: "SNAPSHOT"
            })
        },
        addFeedback(obj) {
            // console.log('😡😡😡 addFeedback: ', obj)
            sendBoardAction({
                actionType: "FEEDBACK", obj: obj
            })
        },
        sendFeedback(feedback) {
            // console.log('😡😡😡 sendFeedback: ', feedback)
            sendBoardAction({
                actionType: "FEEDBACK_BKG", obj: feedback
            })
        },
        sendFeedbackGuides(guides) {
            // console.log('😡😡😡 sendFeedbackGuides: ', guides)
            sendBoardAction({
                actionType: "FEEDBACK_GUIDES", background: guides
            })
        }

    }));

    const sendBoardAction = async (command) => {
        // console.log('😡😡😡😡😡😡 sendBoardAction: ', command)
        if (webViewRef.current) {
            webViewRef.current.postMessage(JSON.stringify(command));
        }
    }

    const canvasLoaded = async () => {
        console.log('web view loaded: ', webViewRef.current);
        const sketchColor = storage.getString('canvasStrokeColor');
        setCanvasStrokeColor(sketchColor || 'orange')
        const pencilWidth = storage.getNumber('canvasStrokeWidth');
        setCanvasStrokeWidth(pencilWidth || 4);
        const command = { actionType: 'TOGGLE_MODE', content: JSON.stringify({ pencilColor: canvasStrokeColor, pencilWidth: canvasStrokeWidth }) };
        console.log('📶 toggle pencil', command)
        sendBoardAction(command);
        if (loaded) loaded()
    }

    const uploadWorkoutToStorage = async (dataUrl) => {
        var sourceType = unitHolder.current.sourceType;
        var sourceId = unitHolder.current.sourceId;
        try {
            const fileName = new Date().getTime();
            const space = await requestStorageUrl(fileName + ".png", state.appToken + "", 'math-files/' + sourceType + '/' + sourceId);
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
                saveWorkout(imageUrl);
            }

        } catch (err) {
            console.log(err);
            return null;
        }
    }

    const uploadSnapshotToStorage = async (dataUrl, lastObj) => {
        var sourceType = unitHolder.current.sourceType;
        var sourceId = unitHolder.current.sourceId;
        try {
            const fileName = new Date().getTime();
            const space = await requestStorageUrl(fileName + ".png", state.appToken + "", 'math-files/' + sourceType + '/' + sourceId);
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
            if (saveMentorRequestShot) {
                saveMentorRequestShot(imageUrl, lastObj);
            }

        } catch (err) {
            console.log(err);
            return null;
        }
    }

    const handleCanvasMessage = async (message) => {
        switch (message.contentMeta) {
            case 'SAVE':
                uploadWorkoutToStorage(message.content);
                break;
            case 'TOGGLE_MODE':
                // console.log('TOGGLE_MODE', isDrawingMode);
                // setIsDrawingMode(!isDrawingMode);
                break;
            case 'CLEANCUTS':
                // console.log('CLEANCUTS');
                // initSheets();
                break;
            case 'SNAPSHOT':
                uploadSnapshotToStorage(message.content, message.lastObj);
                break;
            case 'SUB_CNT':
                setSubCount(message.count)
                setLeaderId(message.leaderId)
                break;
        }
    }
    const drawPencilColorOptions = () => {
        return strokeColors.map((color, index) => {
            return <GoButton onPress={() => { setCanvasStrokeColor(color) }} title={color}
                variant={canvasStrokeColor == color ? 'filled' : 'outline'}
                color={color}
                textColor={canvasStrokeColor == color ? 'white' : 'black'}
                rippleColor={color}
            />
        })
    }

    const drawPencilWidthOptions = () => {
        return strokeWidths.map((strokeWidth, index) => {
            return <GoButton onPress={() => { setCanvasStrokeWidth(strokeWidth) }} title={String(strokeWidth)}
                variant={canvasStrokeWidth == strokeWidth ? 'filled' : 'outline'}
                color={canvasStrokeWidth == strokeWidth ? canvasStrokeColor : 'orange'}
                textColor={canvasStrokeWidth == strokeWidth ? 'white' : canvasStrokeColor}
                rippleColor={canvasStrokeColor}
            />
        })
    }

    useEffect(() => {
        // console.log('@@@@@@ unitWorkoutRef.current', unitWorkoutRef.current);
        if (typeof canvasStrokeWidth === 'number') {
            storage.set('canvasStrokeWidth', canvasStrokeWidth);
            // console.log('canvasStrokeWidth', canvasStrokeWidth);
            const command = { actionType: 'TOGGLE_MODE', content: JSON.stringify({ pencilColor: canvasStrokeColor, pencilWidth: canvasStrokeWidth }) };
            sendBoardAction(command);
        }
    }, [canvasStrokeWidth]);

    useEffect(() => {
        // console.log('@@@@@@ unitWorkoutRef.current', unitWorkoutRef.current);
        if (popupMsg) {
            const popup = JSON.parse(popupMsg.content);
            if(popup){
                console.log('⭐️⭐️⭐️⭐️⭐️' + `${CACHE_URL}/popup/${popup.contentType}/${popup.diagramId}`)
                setPopupUrl(`${CACHE_URL}/popup/${popup.contentType}/${popup.diagramId}`)
            }
            // switch (popup.contentType) {

            //     case 'DIAGRAM':
            //         console.log('⭐️⭐️⭐️⭐️⭐️' + CACHE_URL + '/diagram/' + popup.diagramId)
            //         setPopupUrl(CACHE_URL + '/sub/diagram/' + popup.diagramId)
            //         break;
            //     case 'STATEMENT':
            //         console.log('⭐️⭐️⭐️⭐️⭐️' + CACHE_URL + '/statement/' + popup.diagramId)
            //         setPopupUrl(`${CACHE_URL}/popup/STATEMENT/${popup.diagramId}`)
            //         break;
            // }
        }

    }, [popupMsg]);

    useEffect(() => {
        // console.log('@@@@@@ unitWorkoutRef.current', unitWorkoutRef.current);
        if (typeof canvasStrokeColor === 'string') {
            storage.set('canvasStrokeColor', canvasStrokeColor);
            // console.log('canvasStrokeColor', canvasStrokeColor);
            const command = { actionType: 'TOGGLE_MODE', content: JSON.stringify({ pencilColor: canvasStrokeColor, pencilWidth: canvasStrokeWidth }) };
            sendBoardAction(command);
        }

    }, [canvasStrokeColor]);

    useEffect(() => {
        // console.log('@@@@@@ isFocused');
        // const keys = storage.getAllKeys();
        // console.log('mmkv storeage keys: ', keys)

        if (isFocused) {

            // console.log('@@@@@@ isFocused sketchColor: ', sketchColor, ' pencilWidth: ', pencilWidth);
        }
        else {
            setPopupUrl();
        }

    }, [isFocused]);


    return (
        <View style={{ flex: 1, width: '100%', height: '100%', padding: 0 }}>
            <View style={{ flex: 1, width: '100%', height: '100%', padding: 0 }}>
                <Portal>
                    <PaperModal visible={visiblePencilProps} onDismiss={hidePencilPropsModal} style={{ position: 'absolute', top: 36, left: 18, maxHeight: 180, maxWidth: 640, padding: 12, justifyContent: 'flex-start', alignItems: 'flex-start', backgroundColor: 'white', borderWidth: 2, borderColor: 'orange', borderRadius: 12 }}>
                        <View style={{ flexDirection: 'row' }}>
                            {drawPencilWidthOptions()}
                        </View>
                        <View style={{ flexDirection: 'row' }}>
                            {drawPencilColorOptions()}
                        </View>
                    </PaperModal>
                    <PaperModal visible={isToastVisible} onDismiss={hideModal} style={{ position: 'absolute', top: 36, left: 18, maxWidth: 640, maxHeight: 720, padding: 12, justifyContent: 'flex-start', alignItems: 'flex-start', backgroundColor: 'white', borderWidth: 2, borderColor: 'orange', borderRadius: 12 }}>
                        <View style={{ flex: 1 }}>
                            {popupUrl && (
                                <QoollaWebView
                                    ref={webPopupViewRef}
                                    originWhitelist={['*']}
                                    style={{ width: Math.floor(width / 2), height: 720 }}
                                    source={{ uri: popupUrl }}
                                />
                            )}
                        </View>
                    </PaperModal>
                    <PaperModal visible={visibleMemoPopup} onDismiss={hideModal} style={{ position: 'absolute', top: 36, left: 18, maxWidth: 640, maxHeight: 480, padding: 12, justifyContent: 'flex-start', alignItems: 'flex-start', backgroundColor: 'white', borderWidth: 2, borderColor: 'orange', borderRadius: 12 }}>
                        <View style={{ flex: 1 }}>
                            <WebView
                                ref={webMemoViewRef}
                                originWhitelist={['*']}
                                style={{ width: Math.floor(width / 2), height: 480 }}
                                source={{ html: memoHtmlContent }}
                                javaScriptEnabled={true}
                            />
                        </View>
                    </PaperModal>
                </Portal>
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false} // 스크롤바 숨기기 (선택 사항)
                    contentContainerStyle={styles.buttonContainerStyle}
                    style={styles.horizontalScrollView}
                >
                    <GoButton onPress={() => {
                        setVisiblePencilProps(true);
                    }} title={canvasStrokeColor + ' : ' + canvasStrokeWidth}
                        color={canvasStrokeColor}
                        textColor={canvasStrokeColor}
                        rippleColor={canvasStrokeColor}
                        style={{ marginRight: 12 }}
                    />
                    <GoButton title={'보드 지우기'}
                        onPress={() => {
                            sendBoardAction({
                                actionType: "RESET"
                            })
                        }} />
                    <GoButton title={'내 필기 지우기'}
                        onPress={() => {
                            sendBoardAction({
                                actionType: "ERASE_WRITTEN"
                            })
                        }} />
                    <GoButton title={'풀이 올리기'} onPress={() => {
                        sendBoardAction({
                            actionType: "SAVE"
                        })
                    }} />

                </ScrollView>
                <View style={{ flex: 1, width: width, padding: 3, borderWidth: 2, borderColor: 'orange', borderRadius: 6 }} >
                    <WebView
                        ref={webViewRef}
                        originWhitelist={['*']}
                        style={{ width: width - 6, height: height - 96, padding: 0 }}
                        source={{ html: topicCanvasTemplate(width - 6, height - 96) }}
                        javaScriptEnabled={true}
                        onLoadEnd={canvasLoaded}
                        onMessage={(event) => {
                            const message = JSON.parse(event.nativeEvent.data);
                            // console.log('😡😡😡 message from web view: ', message)
                            handleCanvasMessage(message);
                        }}
                    />
                </View>
                {subCount > 0 && <IconButton
                    icon="pencil-plus-outline" // MaterialCommunityIcons의 "menu" 아이콘
                    size={30}
                    iconColor="white"
                    onPress={() => {
                        sendBoardAction({
                            actionType: "SHOW_SUBSTANTIALS",
                            leaderId: leaderId
                        })
                    }}
                    style={styles.fixedDrawerButton} // 스타일 적용
                />}

            </View>
        </View>
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
        backgroundColor: 'orange',
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
        width: width - 32
    },
    sheetsContainerStyle: {
        flex: 1,
        minHeight: '100%',
        minWidth: '100%'
    },
    emptyListStyle: {
        padding: 10,
        fontSize: 18,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100%',
        minWidth: '100%'
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalOverlay: {
        position: 'absolute', // Covers the entire screen
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white'// 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
    },
    dialogContainer: {
        // position: 'absolute', // Absolute positioning relative to the viewport
        top: 20, // 20px from the top edge
        left: 20, // 20px from the left edge
        backgroundColor: 'white',
        // Dimensions (width and height) are applied dynamically in the component
    },
    dialogContent: {
        backgroundColor: 'white',
        padding: 20,
        flex: 1, // Allows content to fill the dialogContainer
        justifyContent: 'space-between', // Pushes the button to the bottom
    },
    dialogTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        backgroundColor: 'white'
    },
    dialogBody: {
        marginBottom: 15,
        flex: 1, // Allows text to take available space
        backgroundColor: 'white'
    },
    horizontalScrollView: {
        maxHeight: 48,
        height: 48,
        padding: 3
    },
    fixedDrawerButton: {
        position: 'absolute',
        bottom: 20, // 하단에서 20px
        right: 20,   // 왼쪽에서 20px
        backgroundColor: 'orange', // 버튼 배경색
        borderRadius: 30, // 원형 버튼 (width/height의 절반)
        width: 60,
        height: 60,
        justifyContent: 'center', // 아이콘 중앙 정렬
        alignItems: 'center',    // 아이콘 중앙 정렬
        elevation: 8, // 안드로이드 그림자
        shadowColor: '#000', // iOS 그림자
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        // IconButton 자체는 안쪽 패딩이 있어서 View로 감싸지 않고 바로 스타일 적용해도 됨.
    },
});

export default TopicNotebookCanvasPanel;
