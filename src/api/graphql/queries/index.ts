/**
 * GraphQL Queries — Barrel re-export
 *
 * 도메인별 분리된 쿼리들을 하나의 진입점으로 re-export합니다.
 * 기존 import 경로(@libs/apollo/queries)와의 호환성을 유지합니다.
 *
 * 도메인 구조:
 *   - user.ts      : 사용자, 구독, 쿠폰, 주문
 *   - task.ts      : 과제, 검색
 *   - record.ts    : 학습 기록, 시도, 피드백
 *   - bookmark.ts  : 북마크, 앨범, 공유
 *   - topic.ts     : 주제, 수업, 스크립트
 *   - study.ts     : 학습 노트
 *   - messaging.ts : 메시지, 공지, 시험, 일정
 */

export { GET_DRAWER_STATE, VIEWER, USERS, MY_SUBSCRIPTION } from './user';
export { MY_TASKS, CHECK_TASK, TASK_OF_ID, CHECK_PRE_EXAM_SEARCH, CHECK_COLLECTION_SEARCH } from './task';
export { MONTHRY_RECORDS, DAILY_RECORDS, MONTHRY_RECORDS_OF_STUDENT, DAILY_RECORDS_OF_STUDENT, GET_PHOTO_UNIT, FEEDBACK_OF_RECORD, UNIT_TRIES, USER_TRIES_IN_DATE_RANGE, STUDY_NOTE_RECORDS } from './record';
export { MY_BOOKMARKS, MY_ALBUMS, MY_BOOKMARK_TRIES, CHECK_BOOKMARK_SEARCH, PUBLIC_BOOKMARKS, PUBLIC_ALBUMS, SHARE_BOOKMARK, SHARE_ALBUM, BOOKMARKS_OF_DAY, MY_STUDY_SHARES, LOG_MY_SHARE_STUDY } from './bookmark';
export { TOPIC_USERS, TOPIC_MESSAGES, TOPIC_UNITS, STUDY_TOPIC, SUBJECT_TOPICS, SUBJECT_TOTAL_PAGE_COUNT, GET_UNITS_IN_TOPIC, LAST_LIVE_TOPIC_MESSAGE, LAST_ONLINE_CLASS_MESSAGE, ONLINE_CLASS_OF_TUTOR, UNIT_VIDEO_LIST } from './topic';
export { STUDY_NOTE, MY_MONTHLY_STUDY_NOTE, CHECK_MY_STUDY_NOTE } from './study';
export { EXAMS, DATE_AGENDA, SQUARE_ANNOUNCEMENTS, PRIVATE_REQUESTS, PRIVATE_REQUESTS_COUNT, REQUEST_MESSAGE_DOCS, RESPONSE_MESSAGE_DOCS } from './messaging';
