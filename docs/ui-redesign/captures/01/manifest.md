# 단계 1 캡처 목록

- 기준: `feat/study-note` @ `76b99e3`, 노드 id는 `docs/ui-structure/ui-structure.json`
- 파일명: `<device>-<node id>[-<state>]-before.png`. `ipad-`는 실기기, `phone-sim-`은 시뮬레이터만 쓴다
- 상태: `완료` 또는 `blocked`(사유 필수)

## 기기

| 기기 | 출처 | 모델 | OS | 캡처 방법 |
|---|---|---|---|---|
| ipad | 실기기 | iPad Pro 12.9-inch (6th generation), iPad14,6 | 미기록 | 미기록 |
| phone-sim | 시뮬레이터 | 미기록 | 미기록 | `xcrun simctl io <udid> screenshot` |

## 목록

| node id | 화면·상태 | 기기 | 방향 | 파일 | 출처 | 상태 | 사유 |
|---|---|---|---|---|---|---|---|
| welcome | Welcome (로그인) | ipad | 세로 | `ipad-welcome-before.png` | 실기기 | blocked | 미촬영 |
| welcome | Welcome (로그인) | phone-sim | 세로 | `phone-sim-welcome-before.png` | 시뮬레이터 | blocked | 미촬영 |
| auth_callback | OAuth 콜백 | ipad | 세로 | `ipad-auth_callback-before.png` | 실기기 | blocked | 미촬영 |
| auth_callback | OAuth 콜백 | phone-sim | 세로 | `phone-sim-auth_callback-before.png` | 시뮬레이터 | blocked | 미촬영 |
| public_questions | 공개 문제 목록 | ipad | 세로 | `ipad-public_questions-before.png` | 실기기 | blocked | 미촬영 |
| public_questions | 공개 문제 목록 | phone-sim | 세로 | `phone-sim-public_questions-before.png` | 시뮬레이터 | blocked | 미촬영 |
| public_solution | 공개 해답 | ipad | 세로 | `ipad-public_solution-before.png` | 실기기 | blocked | 미촬영 |
| public_solution | 공개 해답 | phone-sim | 세로 | `phone-sim-public_solution-before.png` | 시뮬레이터 | blocked | 미촬영 |
| notebook | 문제 풀이 캔버스 | ipad | 세로 | `ipad-notebook-before.png` | 실기기 | blocked | 미촬영 |
| notebook | 문제 풀이 캔버스 (가로) | ipad | 가로 | `ipad-notebook-landscape-before.png` | 실기기 | blocked | 미촬영 |
| topic_live | 주제 실황 수업 | ipad | 세로 | `ipad-topic_live-before.png` | 실기기 | blocked | 미촬영 |
| topic_live | 주제 실황 수업 (가로) | ipad | 가로 | `ipad-topic_live-landscape-before.png` | 실기기 | blocked | 미촬영 |
| hotline | 선생님 수업 | ipad | 세로 | `ipad-hotline-before.png` | 실기기 | blocked | 미촬영 |
| hotline | 선생님 수업 (가로) | ipad | 가로 | `ipad-hotline-landscape-before.png` | 실기기 | blocked | 미촬영 |
| agent_home | 에이전트 홈 (Stage) | ipad | 세로 | `ipad-agent_home-before.png` | 실기기 | blocked | 미촬영 |
| profile | 내 정보 탭 | phone-sim | 세로 | `phone-sim-profile-before.png` | 시뮬레이터 | blocked | 미촬영 |
| timeline_index | History | phone-sim | 세로 | `phone-sim-timeline_index-before.png` | 시뮬레이터 | blocked | 미촬영 |
| timeline_problems | 문제 목록 | phone-sim | 세로 | `phone-sim-timeline_problems-before.png` | 시뮬레이터 | blocked | 미촬영 |
| timeline_topic | 주제 문제 | phone-sim | 세로 | `phone-sim-timeline_topic-before.png` | 시뮬레이터 | blocked | 진입 경로 없음(orphan) |
| timeline_solution | 해답 | phone-sim | 세로 | `phone-sim-timeline_solution-before.png` | 시뮬레이터 | blocked | 미촬영 |
| search_index | 검색 | phone-sim | 세로 | `phone-sim-search_index-before.png` | 시뮬레이터 | blocked | 미촬영 |
| search_problems | 문제 목록 | phone-sim | 세로 | `phone-sim-search_problems-before.png` | 시뮬레이터 | blocked | 미촬영 |
| search_topic | 주제 문제 | phone-sim | 세로 | `phone-sim-search_topic-before.png` | 시뮬레이터 | blocked | 미촬영 |
| search_solution | 해답 | phone-sim | 세로 | `phone-sim-search_solution-before.png` | 시뮬레이터 | blocked | 미촬영 |
| chat_index | Study Log | phone-sim | 세로 | `phone-sim-chat_index-before.png` | 시뮬레이터 | blocked | 미촬영 |
| chat_problems | 문제 목록 | phone-sim | 세로 | `phone-sim-chat_problems-before.png` | 시뮬레이터 | blocked | 미촬영 |
| chat_topic | 주제 문제 | phone-sim | 세로 | `phone-sim-chat_topic-before.png` | 시뮬레이터 | blocked | 미촬영 |
| chat_solution | 해답 | phone-sim | 세로 | `phone-sim-chat_solution-before.png` | 시뮬레이터 | blocked | 미촬영 |
| diary_index | Diary | phone-sim | 세로 | `phone-sim-diary_index-before.png` | 시뮬레이터 | blocked | 미촬영 |
| diary_day | 그날 풀이 기록 | phone-sim | 세로 | `phone-sim-diary_day-before.png` | 시뮬레이터 | blocked | 미촬영 |
| diary_solution | 답안 예시 | phone-sim | 세로 | `phone-sim-diary_solution-before.png` | 시뮬레이터 | blocked | 미촬영 |
| study_note_sheet | 학습장 시트 | ipad | 세로 | `ipad-study_note_sheet-before.png` | 실기기 | blocked | 미촬영 |
| study_note_sheet | 학습장 시트 | phone-sim | 세로 | `phone-sim-study_note_sheet-before.png` | 시뮬레이터 | blocked | 미촬영 |
| global_loading | 앱 차단 로딩 | ipad | 세로 | `ipad-global_loading-before.png` | 실기기 | blocked | 진입 경로 없음(orphan) |
| global_loading | 앱 차단 로딩 | phone-sim | 세로 | `phone-sim-global_loading-before.png` | 시뮬레이터 | blocked | 진입 경로 없음(orphan) |
| tablet_launch | 태블릿 런치 로고 | ipad | 세로 | `ipad-tablet_launch-before.png` | 실기기 | blocked | 미촬영 |
| chat_rail | 세로 pill 툴바 | ipad | 세로 | `ipad-chat_rail-before.png` | 실기기 | blocked | 미촬영 |
| dock_timeline | Study dock | ipad | 세로 | `ipad-dock_timeline-before.png` | 실기기 | blocked | 미촬영 |
| dock_notice | Diary dock | ipad | 세로 | `ipad-dock_notice-before.png` | 실기기 | blocked | 미촬영 |
| dock_search | 검색 dock | ipad | 세로 | `ipad-dock_search-before.png` | 실기기 | blocked | 미촬영 |
| dock_live | 실황 수업 dock | ipad | 세로 | `ipad-dock_live-before.png` | 실기기 | blocked | 미촬영 |
| dock_profile | 내 정보 dock | ipad | 세로 | `ipad-dock_profile-before.png` | 실기기 | blocked | 미촬영 |
| dock_chat | Study Log dock | ipad | 세로 | `ipad-dock_chat-before.png` | 실기기 | blocked | 미촬영 |
| agent_toast | 튜터·에이전트 토스트 | ipad | 세로 | `ipad-agent_toast-before.png` | 실기기 | blocked | 미촬영 |
| canvas_toolbar | 캔버스 하단 툴바 | ipad | 세로 | `ipad-canvas_toolbar-before.png` | 실기기 | blocked | 미촬영 |
| concept_sheet | 개념 검색 시트 | ipad | 세로 | `ipad-concept_sheet-before.png` | 실기기 | blocked | 미촬영 |
| clear_confirm | 전체 지우기 확인 | ipad | 세로 | `ipad-clear_confirm-before.png` | 실기기 | blocked | 미촬영 |
| landscape_notice | 가로 모드 안내 | ipad | 세로 | `ipad-landscape_notice-before.png` | 실기기 | blocked | 미촬영 |
| pencil_popover | 펜 설정 팝오버 | ipad | 세로 | `ipad-pencil_popover-before.png` | 실기기 | blocked | 미촬영 |
| concept_detail | 개념 설명 모달 | ipad | 세로 | `ipad-concept_detail-before.png` | 실기기 | blocked | 미촬영 |
| concept_detail | 개념 설명 모달 | phone-sim | 세로 | `phone-sim-concept_detail-before.png` | 시뮬레이터 | blocked | 미촬영 |
| name_edit_modal | 이름 변경 | ipad | 세로 | `ipad-name_edit_modal-before.png` | 실기기 | blocked | 미촬영 |
| name_edit_modal | 이름 변경 | phone-sim | 세로 | `phone-sim-name_edit_modal-before.png` | 시뮬레이터 | blocked | 미촬영 |
| pdf_viewer | 사서함 PDF | ipad | 세로 | `ipad-pdf_viewer-before.png` | 실기기 | blocked | 미촬영 |
| pdf_viewer | 사서함 PDF | phone-sim | 세로 | `phone-sim-pdf_viewer-before.png` | 시뮬레이터 | blocked | 미촬영 |
| upload_alert | 풀이 업로드 결과 | phone-sim | 세로 | `phone-sim-upload_alert-before.png` | 시뮬레이터 | blocked | 미촬영 |
| bookmark_alert | 책갈피 결과 | phone-sim | 세로 | `phone-sim-bookmark_alert-before.png` | 시뮬레이터 | blocked | 미촬영 |
| quiz_modal | 실황 퀴즈 | ipad | 세로 | `ipad-quiz_modal-before.png` | 실기기 | blocked | 미촬영 |
| nb_list_modal | 문제 목록 모달 | ipad | 세로 | `ipad-nb_list_modal-before.png` | 실기기 | blocked | 미촬영 |
| nb_answer_sheet | 해답 시트 | ipad | 세로 | `ipad-nb_answer_sheet-before.png` | 실기기 | blocked | 미촬영 |
| nb_workout_sheet | 내 풀이 시트 | ipad | 세로 | `ipad-nb_workout_sheet-before.png` | 실기기 | blocked | 미촬영 |
| tl_list_modal | 수업 문제 목록 | ipad | 세로 | `ipad-tl_list_modal-before.png` | 실기기 | blocked | 미촬영 |
| tl_answer_sheet | 답안 예시 시트 | ipad | 세로 | `ipad-tl_answer_sheet-before.png` | 실기기 | blocked | 미촬영 |
| tl_toast | 상단 토스트 | ipad | 세로 | `ipad-tl_toast-before.png` | 실기기 | blocked | 미촬영 |
| tl_memo | 선생님 메모 | ipad | 세로 | `ipad-tl_memo-before.png` | 실기기 | blocked | 미촬영 |
| tl_popup | 해설 팝업 | ipad | 세로 | `ipad-tl_popup-before.png` | 실기기 | blocked | 진입 경로 없음(orphan) |
| hl_list_modal | 수업 문제 목록 | ipad | 세로 | `ipad-hl_list_modal-before.png` | 실기기 | blocked | 미촬영 |
| hl_answer_sheet | 답안 예시 시트 | ipad | 세로 | `ipad-hl_answer_sheet-before.png` | 실기기 | blocked | 미촬영 |
| hl_toast | 상단 토스트 | ipad | 세로 | `ipad-hl_toast-before.png` | 실기기 | blocked | 미촬영 |
| hl_memo | 선생님 메모 | ipad | 세로 | `ipad-hl_memo-before.png` | 실기기 | blocked | 미촬영 |
| hl_popup | 해설 팝업 | ipad | 세로 | `ipad-hl_popup-before.png` | 실기기 | blocked | 진입 경로 없음(orphan) |
