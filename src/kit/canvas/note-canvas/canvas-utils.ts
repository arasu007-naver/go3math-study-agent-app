// @ts-nocheck
/* eslint-disable react/display-name, no-var, react/jsx-key -- 기존 코드를 그대로 옮긴 파일 */
// 기존 qoolla-student-app `src/components/note-canvas/canvas-utils.ts`를 그대로 옮김(import 경로만 이 프로젝트에 맞춤).
// AppCtx·storage·utils는 ./legacy 호환 계층, 템플릿은 ../templates를 쓴다.
/**
 * 캔버스 패널 공통 유틸리티
 *
 * notebook.tsx 등 캔버스 패널이 공유하는 유틸리티 함수,
 * 상수, 업로드 로직을 모아놓은 모듈입니다.
 */
import { MutableRefObject } from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { requestStorageUrl } from '../../../api/rest';

// --- 상수 ---
export const strokeWidths = [3, 4, 6, 9, 15, 24];
export const strokeColors = ['orange', 'blue', 'black', 'red', 'green'];
/** 펜 색 저장값 → 보이는 라벨(02-roles.json names, Gate B Q6). 저장·동기화·MMKV에는 여전히 저장값을 넘긴다 */
export const INK_LABELS: Record<string, string> = { orange: '주황', blue: '파랑', black: '검정', red: '빨강', green: '초록' };

/** 지우개(흰 펜) 굵기 */
export const ERASER_WIDTH = 72;
const WIDTH_BEFORE_ERASER = 'canvasStrokeWidthBeforeEraser';
const COLOR_BEFORE_ERASER = 'canvasStrokeColorBeforeEraser';
type WidthStore = {
    set: (k: string, v: number | string) => void;
    getNumber: (k: string) => number | undefined;
    getString?: (k: string) => string | undefined;
};

/** 지우개를 고를 때: 지우개 전 굵기·색을 기억하고 지우개 굵기를 돌려준다(이미 지우개면 기억을 덮어쓰지 않는다) */
export function eraserWidth(store: WidthStore, color: string, width: number): number {
    if (color !== 'white') {
        store.set(WIDTH_BEFORE_ERASER, width);
        if (typeof color === 'string' && color) store.set(COLOR_BEFORE_ERASER, color);
    }
    return ERASER_WIDTH;
}

/** 퀴즈 답안 펜: 캔버스 펜 설정. 지우개(흰색)면 지우개 전 색·굵기(없으면 orange·6) */
export function quizPen(store: {
    getString(k: string): string | undefined;
    getNumber(k: string): number | undefined;
}): { color: string; width: number } {
    const color = store.getString('canvasStrokeColor') || 'orange';
    if (color !== 'white') return { color, width: store.getNumber('canvasStrokeWidth') || 6 };
    const before = store.getString(COLOR_BEFORE_ERASER);
    return {
        color: before && before !== 'white' ? before : 'orange',
        width: store.getNumber(WIDTH_BEFORE_ERASER) || 6,
    };
}

/** 색 펜을 고를 때: 지우개였으면 지우개 전 굵기로, 아니면 지금 굵기 그대로 */
export function inkWidth(store: WidthStore, color: string, width: number): number {
    return color === 'white' ? (store.getNumber(WIDTH_BEFORE_ERASER) || 6) : width;
}

// --- 유틸리티 ---
export const getBase64StringFromDataURL = (dataURL: string): string =>
    dataURL.replace('data:', '').replace(/^.+,/, '');

// --- WebView 메시지 전송 ---
export function sendBoardAction(webViewRef: MutableRefObject<any>, command: any) {
    if (webViewRef.current) {
        webViewRef.current.postMessage(JSON.stringify(command));
    }
}

// --- Azure Blob 업로드 공통 로직 ---
type UploadParams = {
    dataUrl: string;
    sourceType: string;
    sourceId: number;
    appToken: string;
};

async function uploadToStorage(params: UploadParams): Promise<string | null> {
    const { dataUrl, sourceType, sourceId, appToken } = params;
    try {
        const fileName = new Date().getTime();
        const space = await requestStorageUrl(
            fileName + '.png',
            appToken,
            'math-files/' + sourceType + '/' + sourceId,
        );
        const signedUrl = space.data.url;
        const fileContent = getBase64StringFromDataURL(dataUrl);

        await ReactNativeBlobUtil.fetch(
            'PUT',
            signedUrl,
            {
                'x-ms-blob-type': 'BlockBlob',
                'content-type': 'application/octet-stream',
                'x-ms-blob-content-type': 'image/png',
            },
            fileContent,
        );

        return signedUrl.split('?')[0];
    } catch (err) {
        console.log(err);
        return null;
    }
}

type WorkoutUploadContext = {
    webViewRef: MutableRefObject<any>;
    unitHolder: MutableRefObject<{ sourceType: string; sourceId: number; unitModelId: number }>;
    appToken: string;
    saveWorkout?: (imageUrl: string) => void;
    saveMentorRequestShot?: (imageUrl: string, lastObj?: any) => void;
};

export async function uploadWorkoutToStorage(
    dataUrl: string,
    ctx: WorkoutUploadContext,
) {
    const imageUrl = await uploadToStorage({
        dataUrl,
        sourceType: ctx.unitHolder.current.sourceType,
        sourceId: ctx.unitHolder.current.sourceId,
        appToken: ctx.appToken,
    });
    if (imageUrl && ctx.saveWorkout) {
        ctx.saveWorkout(imageUrl);
        setTimeout(() => {
            sendBoardAction(ctx.webViewRef, { actionType: 'CLEAN_BOARD' });
        }, 10);
    }
}

export async function uploadSnapshotToStorage(
    dataUrl: string,
    ctx: WorkoutUploadContext,
) {
    const imageUrl = await uploadToStorage({
        dataUrl,
        sourceType: ctx.unitHolder.current.sourceType,
        sourceId: ctx.unitHolder.current.sourceId,
        appToken: ctx.appToken,
    });
    if (imageUrl && ctx.saveMentorRequestShot) {
        ctx.saveMentorRequestShot(imageUrl);
    }
}

export async function uploadQuizAnswerToStorage(
    dataUrl: string,
    appToken: string,
    quizId: string | number,
    userId?: string | number,
): Promise<string | null> {
    try {
        const randomSalt = Math.random().toString(36).substring(2, 10);
        const userTag = userId ? `u${userId}-` : '';
        const fileName = `quiz-${quizId}-${userTag}${Date.now()}-${randomSalt}.png`;
        const space = await requestStorageUrl(fileName, appToken, 'quiz');
        const signedUrl = space.data.url;
        const fileContent = getBase64StringFromDataURL(dataUrl);

        await ReactNativeBlobUtil.fetch(
            'PUT',
            signedUrl,
            {
                'x-ms-blob-type': 'BlockBlob',
                'content-type': 'application/octet-stream',
                'x-ms-blob-content-type': 'image/png',
            },
            fileContent,
        );

        return signedUrl.split('?')[0];
    } catch (err) {
        console.log('uploadQuizAnswerToStorage error:', err);
        return null;
    }
}


