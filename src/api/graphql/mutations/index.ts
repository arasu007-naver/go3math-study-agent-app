/**
 * GraphQL Mutations — Barrel re-export
 *
 * 도메인별 분리된 뮤테이션들을 하나의 진입점으로 re-export합니다.
 * 기존 import 경로(@libs/apollo/mutations)와의 호환성을 유지합니다.
 *
 * 도메인 구조:
 *   - user.ts   : 인증, 프로필 변경
 *   - task.ts   : 과제 생성, 스케줄, 복제
 *   - record.ts : 기록 생성, 북마크 추가/삭제
 *   - topic.ts  : 주제 생성, 메시지 전송, 사용자 요청
 *   - study.ts  : 학습 노트 등록/수정
 */

export { SIGN_IN, SIGN_UP, CHANGE_PROFILE_IMAGE, CHANGE_MY_NAME, CHANGE_MY_EMAIL, QUIT_SERVICE } from './user';
export { CREATE_SELECTION_TASK, CREATE_COLLECTION_TASK, CREATE_BOOKMARK_TASK, UPDATE_VISIT_COUNT, UPDATE_TASK_SCHEDULE, CLONE_TASK } from './task';
export { CREATE_RECORD, ADD_BOOKMARK, REMOVE_BOOKMARK, ADD_LIVE_CLASS_QUIZ_RESPONSE } from './record';
export { CREATE_TOPIC, SEND_REQUEST_MESSAGE, ADD_USER_REQUEST } from './topic';
export { REGIST_TASK_NOTE, UPDATE_STUDY_NOTE } from './study';
