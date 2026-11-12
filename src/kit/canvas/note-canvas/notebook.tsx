// @ts-nocheck
/* eslint-disable react/display-name, no-var, react/jsx-key -- 기존 코드를 그대로 옮긴 파일 */
// 기존 qoolla-student-app `src/components/note-canvas/notebook.tsx`를 그대로 옮김(import 경로만 이 프로젝트에 맞춤).
// AppCtx·storage·utils는 ./legacy 호환 계층, 템플릿은 ../templates를 쓴다.
// https://github.com/Intellicode/eslint-plugin-react-native/issues/271

import { useContext, FC, forwardRef, useEffect, useState, useRef, useImperativeHandle } from "react";
import {
    View, Dimensions,
} from "react-native";
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import PencilPropsModal from './pencil-props-modal';
import { CanvasChrome, canvasTool } from '../CanvasChrome';
import { canvasStyles } from './canvasStyles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { canvasContextSize, canvasScreenSize } from '../canvasSize';
import { layout } from '../../../ui/theme';
import GoButton from '../../ui/go-button';
import classCanvasTemplate from '../templates/whiteboard-canvas-template';
import { AppCtx } from './legacy';
import FullScreenWrapper from './screen-wrapper'
import { storage } from './legacy';
import {
    strokeWidths,
    strokeColors,
    INK_LABELS,
    sendBoardAction as sendAction,
    uploadWorkoutToStorage,
    uploadSnapshotToStorage,
} from './canvas-utils';

const { width, height } = Dimensions.get('window');

const NotebookCanvasPanel: FC = forwardRef((props, ref) => {
    const { loaded, saveWorkout, saveMentorRequestShot, screenActions } = props;
    const webViewRef = useRef(null);
    const { state } = useContext(AppCtx);
    // 캔버스 화면 크기 = 전체 폭 - 6 × (전체 높이 - 상단 바 - 툴바 - 하단 바), context는 1280×1920 기준(canvasSize.ts)
    const insets = useSafeAreaInsets();
    const screenSize = canvasScreenSize({ width, height }, insets);
    const contextSize = canvasContextSize(screenSize);
    const isFocused = useIsFocused();
    const unitHolder = useRef({
        sourceType: 'UNIT',
        sourceId: 0,
        unitModelId: 0
    });
    const [visiblePencilProps, setVisiblePencilProps] = useState(false);
    const hidePencilPropsModal = () => setVisiblePencilProps(false);

    const [canvasStrokeWidth, setCanvasStrokeWidth] = useState<number | undefined>();
    const [canvasStrokeColor, setCanvasStrokeColor] = useState<string | undefined>();

    const sendBoardActionLocal = (command: any) => sendAction(webViewRef, command);

    const loadStoredPencilProps = () => {
        const sketchColor = storage.getString('canvasStrokeColor');
        setCanvasStrokeColor(sketchColor || 'orange');
        const pencilWidth = storage.getNumber('canvasStrokeWidth');
        setCanvasStrokeWidth(pencilWidth || 4);
        sendBoardActionLocal({ actionType: 'TOGGLE_MODE', pencilColor: sketchColor, pencilWidth: pencilWidth });
    };

    useImperativeHandle(ref, () => ({
        addImage(imageUrl: string, imgWidth: number, imgHeight: number) {
            sendBoardActionLocal({
                actionType: "ADD_IMAGE", obj: { imageUrl, imgWidth, imgHeight }
            });
        },
        changeNotebookBackgroundImage(imageUrl: string) {
            sendBoardActionLocal({ actionType: "NOTEBOOK", obj: { imageUrl } });
            loadStoredPencilProps();
        },
        changeFeedbackBackgroundImage(imageUrl: string) {
            sendBoardActionLocal({ actionType: "FEEDBACK", obj: { imageUrl } });
            loadStoredPencilProps();
        },
        saveSnapshotForMentoring() {
            sendBoardActionLocal({ actionType: "SNAPSHOT" });
        }
    }));

    const uploadCtx = {
        webViewRef,
        unitHolder,
        appToken: state.appToken + "",
        saveWorkout,
        saveMentorRequestShot,
    };

    const handleMessage = async (message: any) => {
        switch (message.contentMeta) {
            case 'SAVE':
                uploadWorkoutToStorage(message.content, uploadCtx);
                break;
            case 'SNAPSHOT':
                uploadSnapshotToStorage(message.content, uploadCtx);
                break;
        }
    };

    const drawPencilColorOptions = () => {
        return strokeColors.map((color, index) => (
            <GoButton onPress={() => setCanvasStrokeColor(color)} title={INK_LABELS[color]} key={'pencil-color-' + index}
                variant={canvasStrokeColor === color ? 'filled' : 'outline'}
                color={color}
                textColor={canvasStrokeColor === color ? 'white' : 'black'}
                rippleColor={color}
            />
        )).concat(
            // 지우개: 펜 색을 흰색으로 바꿔 덧칠해 지운다.
            <GoButton onPress={() => setCanvasStrokeColor('white')} title="지우개" key="pencil-color-eraser"
                variant={canvasStrokeColor === 'white' ? 'filled' : 'outline'}
                color="gray"
                textColor={canvasStrokeColor === 'white' ? 'white' : 'black'}
                rippleColor="gray"
            />
        );
    };

    const drawPencilWidthOptions = () => {
        // 지우개(흰색)일 때 굵기 버튼이 흰 바탕에 묻히지 않게 회색으로 그린다.
        const chipColor = canvasStrokeColor === 'white' ? 'gray' : canvasStrokeColor;
        return strokeWidths.map((sw, index) => (
            <GoButton onPress={() => setCanvasStrokeWidth(sw)} title={String(sw)} key={'pencil-width-' + index}
                variant={canvasStrokeWidth === sw ? 'filled' : 'outline'}
                color={canvasStrokeWidth === sw ? chipColor : 'orange'}
                textColor={canvasStrokeWidth === sw ? 'white' : chipColor}
                rippleColor={chipColor}
            />
        ));
    };

    useEffect(() => {
        if (typeof canvasStrokeWidth === 'number') {
            storage.set('canvasStrokeWidth', canvasStrokeWidth);
            sendBoardActionLocal({ actionType: 'TOGGLE_MODE', pencilColor: canvasStrokeColor, pencilWidth: canvasStrokeWidth });
        }
    }, [canvasStrokeWidth]);

    useEffect(() => {
        if (typeof canvasStrokeColor === 'string') {
            storage.set('canvasStrokeColor', canvasStrokeColor);
            sendBoardActionLocal({ actionType: 'TOGGLE_MODE', pencilColor: canvasStrokeColor, pencilWidth: canvasStrokeWidth });
        }
    }, [canvasStrokeColor]);

    useEffect(() => {
        if (isFocused) {
            loadStoredPencilProps();
        }
    }, [isFocused]);

    return (
        <View style={{ flex: 1, width: '100%', height: '100%', padding: 0 }}>
            <View style={{ flex: 1, width: '100%', height: '100%', padding: 0 }}>
                <View style={[canvasStyles.frame, { width: screenSize.width, height: screenSize.height, flex: 0, padding: 0, marginHorizontal: layout.canvasMargin }]}>
                    <WebView
                        ref={webViewRef}
                        originWhitelist={['*']}
                        style={{ width: screenSize.width, height: screenSize.height }}
                        source={{ html: classCanvasTemplate(contextSize.width, contextSize.height, screenSize.width, screenSize.height) }}
                        javaScriptEnabled={true}
                        onLoadEnd={() => loaded()}
                        onMessage={(event) => {
                            const message = JSON.parse(event.nativeEvent.data);
                            handleMessage(message);
                        }}
                    />
                </View>
                {/* 기존 상단 버튼 줄(펜 속성·보드 지우기·내 풀이 저장)을 하단 가운데 떠 있는 툴바로 옮겼다(design-spec P2-1). 부르는 함수는 같다. */}
                <CanvasChrome
                    actions={screenActions}
                    tools={[canvasTool('color', 'Options'), canvasTool('clearBoard', '전체 지우기'), canvasTool('save', '저장')]}
                    strokeColor={canvasStrokeColor}
                    onSelectTool={(id) => {
                        if (id === 'color') setVisiblePencilProps(true);
                        else if (id === 'clearBoard') sendBoardActionLocal({ actionType: "CLEAN_BOARD" });
                        else if (id === 'save') sendBoardActionLocal({ actionType: "SAVE" });
                    }}>
                    <PencilPropsModal
                        visible={visiblePencilProps}
                        onDismiss={hidePencilPropsModal}
                        renderWidthOptions={drawPencilWidthOptions}
                        renderColorOptions={drawPencilColorOptions}
                    />
                </CanvasChrome>
            </View>
        </View>
    );
});

export default NotebookCanvasPanel;
