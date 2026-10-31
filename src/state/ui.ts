/**
 * UI 상태 관련 상태 (기존 src/ctx/ui에서 이전, reducer는 원본 그대로)
 * - 다크모드, 카테고리 필터, 페칭 상태, 스낵바 등
 */
import { createStore } from './createStore';
import moment from 'moment';

export type UIState = {
    dark: boolean;
    currentPublicCategory: string;
    currentStudyCategory: string;
    currentQueryCategory: string;
    currentBookmarksMode: string;
    currentHistoryMode: string;
    currentEducationAgendaIndex: number;
    currentRoomType: string;
    onFetching: boolean;
    lastBookmarkTab: number;
    lastTabChanged: number;
    lastMonth: string;
    showMessageViewer: boolean;
    snackbarTs: number;
    snackbarMessage: string;
    bookmarksRefresh: number;
};

export type UIAction =
    | { type: 'CHANGE_PUBLIC_CATEGORY'; item: { category: string } }
    | { type: 'CHANGE_QUERY_MODE'; item: { category: string } }
    | { type: 'CHANGE_STUDY_CATEGORY'; item: { category: string } }
    | { type: 'CHANGE_BOOKMARKS_MODE'; item: { bookmarksMode: string } }
    | { type: 'CHANGE_HISTORY_MODE'; item: { historyMode: string } }
    | { type: 'CHANGE_ROOM_TYPE'; item: { roomType: string } }
    | { type: 'CHANGE_EDUCATION_AGENDA_INDEX'; item: { agenda: number } }
    | { type: 'LAST_MONTH'; item: { lastMonth: string } }
    | { type: 'SNACKBAR_MESSAGE'; item: { message: string } }
    | { type: 'TOGGLE_DARK' }
    | { type: 'TASK_START' }
    | { type: 'TASK_COMPLETED' }
    | { type: 'VISIT_NOTE' }
    | { type: 'BOOKMARK_REFRESH' }
    | { type: 'TOGGLE_MESSAGE_VIEWER' };

export const defaultUIState: UIState = {
    dark: false,
    currentPublicCategory: 'recent',
    currentStudyCategory: 'recent',
    currentQueryCategory: 'list-class',
    currentBookmarksMode: 'private',
    currentHistoryMode: 'exam',
    currentEducationAgendaIndex: 1,
    currentRoomType: 'public',
    onFetching: false,
    lastBookmarkTab: 0,
    lastTabChanged: 0,
    lastMonth: moment().format('YYYY-MM-DD'),
    showMessageViewer: false,
    snackbarTs: new Date().getTime(),
    snackbarMessage: 'init',
    bookmarksRefresh: new Date().getTime(),
};

export const uiReducer = (prevState: UIState, action: UIAction): UIState => {
    switch (action.type) {
        case 'CHANGE_PUBLIC_CATEGORY':
            return { ...prevState, currentPublicCategory: action.item.category };
        case 'CHANGE_QUERY_MODE':
            return { ...prevState, currentQueryCategory: action.item.category };
        case 'CHANGE_STUDY_CATEGORY':
            return { ...prevState, currentStudyCategory: action.item.category };
        case 'CHANGE_BOOKMARKS_MODE':
            return { ...prevState, currentBookmarksMode: action.item.bookmarksMode };
        case 'CHANGE_HISTORY_MODE':
            return { ...prevState, currentHistoryMode: action.item.historyMode };
        case 'CHANGE_ROOM_TYPE':
            return { ...prevState, currentRoomType: action.item.roomType };
        case 'CHANGE_EDUCATION_AGENDA_INDEX':
            return { ...prevState, currentEducationAgendaIndex: action.item.agenda };
        case 'LAST_MONTH':
            return { ...prevState, lastMonth: action.item.lastMonth };
        case 'SNACKBAR_MESSAGE':
            return { ...prevState, snackbarMessage: action.item.message };
        case 'TOGGLE_DARK':
            return { ...prevState, dark: !prevState.dark };
        case 'TASK_START':
            if (__DEV__) {
                console.warn('[loading] UICtx TASK_START is a no-op; use AppCtx beginBlocking/endBlocking');
            }
            return prevState;
        case 'TASK_COMPLETED':
            if (__DEV__) {
                console.warn('[loading] UICtx TASK_COMPLETED is a no-op; use AppCtx beginBlocking/endBlocking');
            }
            return prevState;
        case 'VISIT_NOTE':
            return { ...prevState };
        case 'BOOKMARK_REFRESH':
            return { ...prevState, bookmarksRefresh: new Date().getTime() };
        case 'TOGGLE_MESSAGE_VIEWER':
            return { ...prevState, showMessageViewer: !prevState.showMessageViewer };
        default:
            return prevState;
    }
};

export const uiStore = createStore(uiReducer, defaultUIState);
