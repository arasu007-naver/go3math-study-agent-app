/**
 * 콘텐츠/학습 데이터 관련 상태 (기존 src/ctx/content에서 이전, reducer는 원본 그대로)
 * - 현재 태스크, 시트, 토픽, 학습 노트 등
 */
import { createStore } from './createStore';
import { storage } from '../storage';

export type ContentState = {
    currentTask?: object;
    sheets: object[];
    queryCnt: number;
    lastMemo?: object;
    appStorage: object;
    currentTopic?: object;
    studyShare?: { noteId?: number } & Record<string, any>;
    targetStudyNote: number;
    noteUnits: object[];
};

export type ContentAction =
    | { type: 'CURRENT_TASK'; item: object }
    | { type: 'SHEETS'; item: object[] }
    | { type: 'TOPIC'; item: object }
    | { type: 'STUDY_SHARE'; item: object }
    | { type: 'SHOW_STUDY_NOTE'; item: { noteId: number } }
    | { type: 'NOTE_UNITS'; item: { units: object[] } };

export const createDefaultContentState = (appStorage: object): ContentState => ({
    currentTask: undefined,
    sheets: [],
    queryCnt: 0,
    lastMemo: undefined,
    appStorage,
    currentTopic: undefined,
    studyShare: { noteId: 0 },
    targetStudyNote: 0,
    noteUnits: [],
});

export const contentReducer = (prevState: ContentState, action: ContentAction): ContentState => {
    switch (action.type) {
        case 'CURRENT_TASK':
            return { ...prevState, currentTask: action.item };
        case 'SHEETS':
            return { ...prevState, sheets: action.item as object[], isLoading: false } as any;
        case 'TOPIC':
            return { ...prevState, currentTopic: action.item };
        case 'STUDY_SHARE':
            return { ...prevState, studyShare: action.item as any };
        case 'SHOW_STUDY_NOTE':
            return { ...prevState, targetStudyNote: action.item.noteId };
        case 'NOTE_UNITS':
            return { ...prevState, noteUnits: action.item.units };
        default:
            return prevState;
    }
};

export const contentStore = createStore(contentReducer, createDefaultContentState(storage));
