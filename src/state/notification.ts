/**
 * 알림/메시지 관련 상태 (기존 src/ctx/notification에서 이전, reducer는 원본 그대로)
 * - 알람, 알림 메시지, 읽지 않은 메모/공지 수
 */
import { createStore } from './createStore';
import { storage } from '../storage';

export type NotificationState = {
    alarmMessage: string;
    alertMessage: number;
    unReadMemoCount: number;
    unReadNoticeCount: number;
};

export type NotificationAction =
    | { type: 'ALARM'; item: { message: string } }
    | { type: 'ALERT_MESSAGE'; item: { message: string } }
    | { type: 'MEMO_COUNT'; item: { memoCount: number } }
    | { type: 'NOTICE_COUNT'; item: { noticeCount: number } };

export const defaultNotificationState: NotificationState = {
    alarmMessage: '',
    alertMessage: new Date().getTime(),
    unReadMemoCount: 0,
    unReadNoticeCount: 0,
};

export const notificationReducer = (
    prevState: NotificationState,
    action: NotificationAction,
): NotificationState => {
    switch (action.type) {
        case 'ALARM':
            return { ...prevState, alarmMessage: action.item.message };
        case 'ALERT_MESSAGE':
            storage.set('alert-message', action.item.message);
            return { ...prevState, alertMessage: new Date().getTime() };
        case 'MEMO_COUNT':
            return { ...prevState, unReadMemoCount: action.item.memoCount };
        case 'NOTICE_COUNT':
            return { ...prevState, unReadNoticeCount: action.item.noticeCount };
        default:
            return prevState;
    }
};

export const notificationStore = createStore(notificationReducer, defaultNotificationState);
