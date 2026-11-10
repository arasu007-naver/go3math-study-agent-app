# 단계 1 캡처 목록

- 기준: `feat/study-note` @ `76b99e3`, 노드 id는 `docs/ui-structure/ui-structure.json`
- 파일명: `<device>-<node id>[-<state>]-before.png`. `ipad-sim-`과 `phone-sim-`은 시뮬레이터 캡처다. 실기기 캡처는 `ipad-` 접두사만 쓰며 **이번에는 한 장도 없다**(사용자 지시로 시뮬레이터 사용)
- 상태: `완료` 또는 `blocked`(사유 필수)

## 기기

| 기기 | 출처 | 모델 | OS | 캡처 방법 |
|---|---|---|---|---|
| ipad-sim | 시뮬레이터 | iPad Air 13-inch (M4), 1024×1366pt | iOS 26.4 | `xcrun simctl io <udid> screenshot` |
| phone-sim | 시뮬레이터 | iPhone 17, 402×874pt | iOS 26.4 | `xcrun simctl io <udid> screenshot` |

## 조건

- 빌드: `feat/study-note` @ `76b99e3`에서 만든 Debug 네이티브 빌드(`xcodebuild`, `IPHONEOS_DEPLOYMENT_TARGET=15.1` 덮어쓰기). JS는 이미 떠 있던 Metro 개발 서버에서 받았다.
- **번들 출처 미확인**: 그 개발 서버가 `76b99e3`의 JS를 내보내지 않았다. 로그인 상태 Study dock 캡처에 study-note UI(학습장 줄·버튼)가 없고, 캡처 뒤 서버에서 받은 `TimelinePanel` 모듈에도 `noteBtn`이 없었다. 캡처 전체가 study-note 이전 번들일 수 있다. 개발 서버를 다시 띄운 뒤 재촬영해야 한다.
- 로그인: 1차는 개발 빌드 전용 "로그인 없이 둘러보기"(Phone 6장, iPad의 로그인·홈·Diary·검색·내 정보·Study Log dock). 계정 데이터가 없어 빈 상태·오류 문구가 찍혔다. 2차는 사용자가 시뮬레이터에 직접 로그인한 뒤 iPad에서 Study dock, 문제 목록, 캔버스와 그 오버레이를 찍었다. 하단의 광고 띠는 테스트 광고다.
- 캔버스에서는 필기·저장·전체 지우기 확인을 하지 않았다. 문제 목록을 연 것 외에 계정 데이터를 바꾸는 동작은 없다.
- iOS 27.2 시뮬레이터에서는 앱이 실행 직후 종료된다(`UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`). 그래서 iOS 26.4 시뮬레이터를 썼다.
- `agent_home`과 `chat_rail`은 같은 화면 한 장이다. `notebook`과 `canvas_toolbar`도 같은 한 장이다.

## 목록

| node id | 화면·상태 | 기기 | 방향 | 파일 | 출처 | 상태 | 사유 |
|---|---|---|---|---|---|---|---|
| welcome | Welcome (로그인) | ipad-sim | 세로 | `ipad-sim-welcome-before.png` | 시뮬레이터 | 완료 | — |
| welcome | Welcome (로그인) | phone-sim | 세로 | `phone-sim-welcome-before.png` | 시뮬레이터 | 완료 | — |
| auth_callback | OAuth 콜백 | ipad-sim | 세로 | `ipad-sim-auth_callback-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| auth_callback | OAuth 콜백 | phone-sim | 세로 | `phone-sim-auth_callback-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| public_questions | 공개 문제 목록 | ipad-sim | 세로 | `ipad-sim-public_questions-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| public_questions | 공개 문제 목록 | phone-sim | 세로 | `phone-sim-public_questions-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| public_solution | 공개 해답 | ipad-sim | 세로 | `ipad-sim-public_solution-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| public_solution | 공개 해답 | phone-sim | 세로 | `phone-sim-public_solution-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| notebook | 문제 풀이 캔버스 | ipad-sim | 세로 | `ipad-sim-notebook-before.png` | 시뮬레이터 | 완료 | — |
| notebook | 문제 풀이 캔버스 (가로) | ipad-sim | 가로 | `ipad-sim-notebook-landscape-before.png` | 시뮬레이터 | 완료 | — |
| topic_live | 주제 실황 수업 | ipad-sim | 세로 | `ipad-sim-topic_live-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| topic_live | 주제 실황 수업 (가로) | ipad-sim | 가로 | `ipad-sim-topic_live-landscape-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| hotline | 선생님 수업 | ipad-sim | 세로 | `ipad-sim-hotline-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| hotline | 선생님 수업 (가로) | ipad-sim | 가로 | `ipad-sim-hotline-landscape-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| agent_home | 에이전트 홈 (Stage) | ipad-sim | 세로 | `ipad-sim-agent_home-before.png` | 시뮬레이터 | 완료 | — |
| profile | 내 정보 탭 | phone-sim | 세로 | `phone-sim-profile-before.png` | 시뮬레이터 | 완료 | — |
| timeline_index | History | phone-sim | 세로 | `phone-sim-timeline_index-before.png` | 시뮬레이터 | 완료 | — |
| timeline_problems | 문제 목록 | phone-sim | 세로 | `phone-sim-timeline_problems-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| timeline_topic | 주제 문제 | phone-sim | 세로 | `phone-sim-timeline_topic-before.png` | 시뮬레이터 | blocked | 진입 경로 없음(orphan) |
| timeline_solution | 해답 | phone-sim | 세로 | `phone-sim-timeline_solution-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| search_index | 검색 | phone-sim | 세로 | `phone-sim-search_index-before.png` | 시뮬레이터 | 완료 | — |
| search_problems | 문제 목록 | phone-sim | 세로 | `phone-sim-search_problems-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| search_topic | 주제 문제 | phone-sim | 세로 | `phone-sim-search_topic-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| search_solution | 해답 | phone-sim | 세로 | `phone-sim-search_solution-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| chat_index | Study Log | phone-sim | 세로 | `phone-sim-chat_index-before.png` | 시뮬레이터 | 완료 | — |
| chat_problems | 문제 목록 | phone-sim | 세로 | `phone-sim-chat_problems-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| chat_topic | 주제 문제 | phone-sim | 세로 | `phone-sim-chat_topic-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| chat_solution | 해답 | phone-sim | 세로 | `phone-sim-chat_solution-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| diary_index | Diary | phone-sim | 세로 | `phone-sim-diary_index-before.png` | 시뮬레이터 | 완료 | — |
| diary_day | 그날 풀이 기록 | phone-sim | 세로 | `phone-sim-diary_day-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| diary_solution | 답안 예시 | phone-sim | 세로 | `phone-sim-diary_solution-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| study_note_sheet | 학습장 시트 | ipad-sim | 세로 | `ipad-sim-study_note_sheet-before.png` | 시뮬레이터 | blocked | 번들 출처 미확인: 캡처에 쓴 번들에 study-note UI가 없었다(위 "조건" 참고) |
| study_note_sheet | 학습장 시트 | phone-sim | 세로 | `phone-sim-study_note_sheet-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| global_loading | 앱 차단 로딩 | ipad-sim | 세로 | `ipad-sim-global_loading-before.png` | 시뮬레이터 | blocked | 진입 경로 없음(orphan) |
| global_loading | 앱 차단 로딩 | phone-sim | 세로 | `phone-sim-global_loading-before.png` | 시뮬레이터 | blocked | 진입 경로 없음(orphan) |
| tablet_launch | 태블릿 런치 로고 | ipad-sim | 세로 | `ipad-sim-tablet_launch-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| chat_rail | 세로 pill 툴바 | ipad-sim | 세로 | `ipad-sim-chat_rail-before.png` | 시뮬레이터 | 완료 | — |
| dock_timeline | Study dock | ipad-sim | 세로 | `ipad-sim-dock_timeline-before.png` | 시뮬레이터 | 완료 | — |
| dock_notice | Diary dock | ipad-sim | 세로 | `ipad-sim-dock_notice-before.png` | 시뮬레이터 | 완료 | — |
| dock_search | 검색 dock | ipad-sim | 세로 | `ipad-sim-dock_search-before.png` | 시뮬레이터 | 완료 | — |
| dock_live | 실황 수업 dock | ipad-sim | 세로 | `ipad-sim-dock_live-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| dock_profile | 내 정보 dock | ipad-sim | 세로 | `ipad-sim-dock_profile-before.png` | 시뮬레이터 | 완료 | — |
| dock_chat | Study Log dock | ipad-sim | 세로 | `ipad-sim-dock_chat-before.png` | 시뮬레이터 | 완료 | — |
| agent_toast | 튜터·에이전트 토스트 | ipad-sim | 세로 | `ipad-sim-agent_toast-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| canvas_toolbar | 캔버스 하단 툴바 | ipad-sim | 세로 | `ipad-sim-canvas_toolbar-before.png` | 시뮬레이터 | 완료 | — |
| concept_sheet | 개념 검색 시트 | ipad-sim | 세로 | `ipad-sim-concept_sheet-before.png` | 시뮬레이터 | 완료 | — |
| clear_confirm | 전체 지우기 확인 | ipad-sim | 세로 | `ipad-sim-clear_confirm-before.png` | 시뮬레이터 | 완료 | — |
| landscape_notice | 가로 모드 안내 | ipad-sim | 세로 | `ipad-sim-landscape_notice-before.png` | 시뮬레이터 | blocked | 캔버스를 가로로 돌려도 안내가 뜨지 않았다(`ipad-sim-notebook-landscape-before.png` 참고) |
| pencil_popover | 펜 설정 팝오버 | ipad-sim | 세로 | `ipad-sim-pencil_popover-before.png` | 시뮬레이터 | 완료 | — |
| concept_detail | 개념 설명 모달 | ipad-sim | 세로 | `ipad-sim-concept_detail-before.png` | 시뮬레이터 | 완료 | — |
| concept_detail | 개념 설명 모달 | phone-sim | 세로 | `phone-sim-concept_detail-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| name_edit_modal | 이름 변경 | ipad-sim | 세로 | `ipad-sim-name_edit_modal-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| name_edit_modal | 이름 변경 | phone-sim | 세로 | `phone-sim-name_edit_modal-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| pdf_viewer | 사서함 PDF | ipad-sim | 세로 | `ipad-sim-pdf_viewer-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| pdf_viewer | 사서함 PDF | phone-sim | 세로 | `phone-sim-pdf_viewer-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| upload_alert | 풀이 업로드 결과 | phone-sim | 세로 | `phone-sim-upload_alert-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| bookmark_alert | 책갈피 결과 | phone-sim | 세로 | `phone-sim-bookmark_alert-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| quiz_modal | 실황 퀴즈 | ipad-sim | 세로 | `ipad-sim-quiz_modal-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| nb_list_modal | 문제 목록 모달 | ipad-sim | 세로 | `ipad-sim-nb_list_modal-before.png` | 시뮬레이터 | 완료 | — |
| nb_answer_sheet | 해답 시트 | ipad-sim | 세로 | `ipad-sim-nb_answer_sheet-before.png` | 시뮬레이터 | 완료 | — |
| nb_workout_sheet | 내 풀이 시트 | ipad-sim | 세로 | `ipad-sim-nb_workout_sheet-before.png` | 시뮬레이터 | 완료 | — |
| tl_list_modal | 수업 문제 목록 | ipad-sim | 세로 | `ipad-sim-tl_list_modal-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| tl_answer_sheet | 답안 예시 시트 | ipad-sim | 세로 | `ipad-sim-tl_answer_sheet-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| tl_toast | 상단 토스트 | ipad-sim | 세로 | `ipad-sim-tl_toast-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| tl_memo | 선생님 메모 | ipad-sim | 세로 | `ipad-sim-tl_memo-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| tl_popup | 해설 팝업 | ipad-sim | 세로 | `ipad-sim-tl_popup-before.png` | 시뮬레이터 | blocked | 진입 경로 없음(orphan) |
| hl_list_modal | 수업 문제 목록 | ipad-sim | 세로 | `ipad-sim-hl_list_modal-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| hl_answer_sheet | 답안 예시 시트 | ipad-sim | 세로 | `ipad-sim-hl_answer_sheet-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| hl_toast | 상단 토스트 | ipad-sim | 세로 | `ipad-sim-hl_toast-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| hl_memo | 선생님 메모 | ipad-sim | 세로 | `ipad-sim-hl_memo-before.png` | 시뮬레이터 | blocked | 미촬영: 이번 회차에서 진입하지 않았다 |
| hl_popup | 해설 팝업 | ipad-sim | 세로 | `ipad-sim-hl_popup-before.png` | 시뮬레이터 | blocked | 진입 경로 없음(orphan) |
| agent_home | 에이전트 홈 (dock 닫힘) | ipad-sim | 세로 | `ipad-sim-agent_home-closed-before.png` | 시뮬레이터 | 완료 | — |
| agent_home | 에이전트 홈 (Stage 문제 목록) | ipad-sim | 세로 | `ipad-sim-agent_home-problems-before.png` | 시뮬레이터 | 완료 | — |
