// @ts-nocheck
/* eslint-disable react/display-name, no-var, react/jsx-key -- 기존 코드를 그대로 옮긴 파일 */
// 기존 qoolla-student-app `src/components/note-canvas/canvas-utils.ts`를 그대로 옮김(import 경로만 이 프로젝트에 맞춤).
// AppCtx·storage·utils는 ./legacy 호환 계층, 템플릿은 ../templates를 쓴다.
/**
 * 캔버스 패널 공통 유틸리티
 *
 * notebook.tsx와 topic-notebook.tsx에서 공유하는 유틸리티 함수,
 * 상수, 업로드 로직을 모아놓은 모듈입니다.
 */
import { MutableRefObject } from 'react';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { requestStorageUrl } from '../../../api/rest';

// --- 상수 ---
export const strokeWidths = [3, 4, 6, 9, 15, 24];
export const strokeColors = ['orange', 'blue', 'black', 'red', 'green'];

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


