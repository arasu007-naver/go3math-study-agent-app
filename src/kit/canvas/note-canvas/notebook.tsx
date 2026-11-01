// @ts-nocheck
/* eslint-disable react/display-name, no-var, react/jsx-key -- 기존 코드를 그대로 옮긴 파일 */
// 기존 qoolla-student-app `src/components/note-canvas/notebook.tsx`를 그대로 옮김(import 경로만 이 프로젝트에 맞춤).
// AppCtx·storage·utils는 ./legacy 호환 계층, 템플릿은 ../templates를 쓴다.
// https://github.com/Intellicode/eslint-plugin-react-native/issues/271

import { useContext, FC, forwardRef, useEffect, useState, useRef, useImperativeHandle } from "react";
import {
    ScrollView,
    StyleSheet,
    View, Dimensions,
} from "react-native";
import { WebView } from 'react-native-webview';
import { useIsFocused } from '@react-navigation/native';
import { Modal, Portal } from 'react-native-paper';
import PencilPropsModal from './pencil-props-modal';
import { colors, radius, shadow } from '../../../ui/theme';
import GoButton from '../../ui/go-button';
import classCanvasTemplate from '../templates/whiteboard-canvas-template';
import { AppCtx } from './legacy';
import FullScreenWrapper from './screen-wrapper'
import { storage } from './legacy';
import {
    strokeWidths,
    strokeColors,
    sendBoardAction as sendAction,
    uploadWorkoutToStorage,
    uploadSnapshotToStorage,
} from './canvas-utils';

const { width, height } = Dimensions.get('window');

const NotebookCanvasPanel: FC = forwardRef((props, ref) => {
    const { loaded, saveWorkout, saveMentorRequestShot } = props;
    const webViewRef = useRef(null);
    const { state } = useContext(AppCtx);
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
            <GoButton onPress={() => setCanvasStrokeColor(color)} title={color} key={'pencil-color-' + index}
                variant={canvasStrokeColor === color ? 'filled' : 'outline'}
                color={color}
                textColor={canvasStrokeColor === color ? 'white' : 'black'}
                rippleColor={color}
            />
        ));
    };

    const drawPencilWidthOptions = () => {
        return strokeWidths.map((sw, index) => (
            <GoButton onPress={() => setCanvasStrokeWidth(sw)} title={String(sw)} key={'pencil-width-' + index}
                variant={canvasStrokeWidth === sw ? 'filled' : 'outline'}
                color={canvasStrokeWidth === sw ? canvasStrokeColor : 'orange'}
                textColor={canvasStrokeWidth === sw ? 'white' : canvasStrokeColor}
                rippleColor={canvasStrokeColor}
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
                <Portal>
                    <PencilPropsModal
                        visible={visiblePencilProps}
                        onDismiss={hidePencilPropsModal}
                        renderWidthOptions={drawPencilWidthOptions}
                        renderColorOptions={drawPencilColorOptions}
                    />
                </Portal>
                <ScrollView
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.buttonContainerStyle}
                    style={styles.horizontalScrollView}
                >
                    <GoButton onPress={() => setVisiblePencilProps(true)}
                        title={canvasStrokeColor + ' : ' + canvasStrokeWidth}
                        color={canvasStrokeColor}
                        textColor={canvasStrokeColor}
                        rippleColor={canvasStrokeColor}
                        style={{ marginRight: 12 }}
                    />
                    <GoButton title={'보드 지우기'}
                        onPress={() => sendBoardActionLocal({ actionType: "CLEAN_BOARD" })}
                        style={{ marginRight: 18 }} />
                    <GoButton title={'내 풀이 저장'}
                        onPress={() => sendBoardActionLocal({ actionType: "SAVE" })} />
                </ScrollView>
                <View style={{ flex: 1, width: width, height: '100%', padding: 3, borderRadius: radius.md, overflow: 'hidden', backgroundColor: colors.card }}>
                    <WebView
                        ref={webViewRef}
                        originWhitelist={['*']}
                        style={{ width: width - 6, height: height - 96 }}
                        source={{ html: classCanvasTemplate(width - 6, height - 96) }}
                        javaScriptEnabled={true}
                        onLoadEnd={() => loaded()}
                        onMessage={(event) => {
                            const message = JSON.parse(event.nativeEvent.data);
                            handleMessage(message);
                        }}
                    />
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    buttonContainerStyle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        flexWrap: 'wrap',
        height: 48,
        marginTop: 6,
        marginLeft: 6
    },
    horizontalScrollView: {
        maxHeight: 48,
        height: 42,
        padding: 3
    }
});

export default NotebookCanvasPanel;
