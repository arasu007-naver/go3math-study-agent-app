# 기존 앱 → 새 앱 이전 현황 (components / api / context)

- 원본: `D:\QoollaWorkspace\qoolla-student-app` (HEAD `a4fdcdb`, 읽기 전용 — 명세서 v0.4.4에 적힌 `28ee405`와 다름)
- 방식(2026-10-31 결정): **혼합형**. api는 거의 그대로, context는 도메인별 store로, 컴포넌트는 결합 없는 것은 복사·결합 있는 것은 props/콜백 기반으로 재작성.
- 결합 약어: **Ctx**=AppCtx, **Nav**=react-navigation, **Apo**=Apollo 훅, **St**=MMKV 직접 사용

## api / context — 완료

| 원본 | 새 위치 | 비고 |
|---|---|---|
| `libs/apollo/queries/*`, `mutations/*`, `subscriptions.ts` | `src/api/graphql/` | gql 문서 그대로 |
| `libs/apollo/client.ts` | `src/api/graphql/client.ts` | 토큰을 getToken()으로 요청마다 읽음. **버그 수정**: `shouldRetry(retries)`가 실제로는 오류 이벤트를 받아 3회 제한이 동작하지 않던 것을 `retryAttempts: 3`으로 |
| `libs/api/index.ts`, `libs/api/hello` | `src/api/rest/index.ts` | 엔드포인트 동일, 타입 추가. hello의 react-query 래퍼와 script-parser 재export는 제외 |
| `config/api.constants.ts`, `exam.constants.ts`, `ui.constants.ts` | `src/config/` | 그대로 |
| `ctx/auth`, `ctx/ui`, `ctx/content`, `ctx/notification` | `src/state/*.ts` | reducer 원본 그대로, React Context 대신 모듈 store(`authStore.useStore()` 등) |
| `ctx/index.tsx` (AppCtx) | `src/state/blocking.ts`, `src/state/bootstrap.ts` | 단일 AppCtx는 만들지 않음(§3.2). beginBlocking/endBlocking, app-token 복원 + 레거시 마이그레이터(§3.5.1) |
| `utils/storage.ts` | `src/storage/` | MMKV 기본 인스턴스(무암호화) 그대로. 웹은 localStorage. `clearCacheDirectory`는 미이전(토큰까지 지우는 문제, §3.5.1) |

## pages에서 추출한 로직 (M3)

| 원본 | 새 위치 | 비고 |
|---|---|---|
| `pages/notebook/topic-note/hooks/useScriptPlayer.ts` (358) | `src/kit/script-player/useScriptPlayer.ts` | 캔버스 포트·이미지 폭 측정·스크립트 로더 주입, lodash 제거. **골든 테스트**: 픽스처 3개(실제 공개 스크립트 1, 기존 임시 스크립트 형태 1, 프롤로그/에필로그/커튼 구성 1)의 sendCut 메시지 열이 기존 훅 기록과 일치 |
| `pages/notebook/topic-note/components/PlaybackToolbar.tsx` (87) | `src/kit/script-player/PlaybackToolbar.tsx` | `navigation.goBack()` → `onExit` 콜백 |
| `pages/notebook/topic-note/utils.ts` `getLastOfSmallerNumbers` | `useScriptPlayer.ts`에 포함 | 의미 동일(배열 순서상 마지막) |
| `utils/script-maker.ts` | `@qoolla/script-parser` v1.3.1 직접 의존 + `sleep` | `makeTemporaryScript`는 캔버스 이전(M4) 때 필요 시 |

## components — 109개

상태: ✅ 이전 완료 · ⏳ 예정(마일스톤) · ⛔ 이전 안 함

| 파일 | 줄 | 결합 | 네이티브 의존 | 상태 | 새 위치 / 계획 |
|---|---|---|---|---|---|
| `ConceptsPanel.tsx` | 2 | — | — | ⛔ | 2줄 재export 파일 |
| `LiveClassPanel.tsx` | 2 | — | — | ⛔ | 2줄 재export 파일 |
| `QFlatlist.tsx` | 121 | — | — | ✅ | src/kit/ui/QFlatlist.tsx |
| `adjust-images/index.tsx` | 35 | — | react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `adjustment/auto-height-image.tsx` | 45 | — | react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `banner/index.tsx` | 37 | — | react-native-google-mobile-ads  | ⛔ | AdMob — 유지 여부 미결정(§9) |
| `buttons/go-button.tsx` | 158 | — | — | ✅ | src/kit/ui/go-button.tsx |
| `buttons/oauth.tsx` | 309 |  Ctx Apo St | @invertase/react-native-apple-authentication @react-native-google-signin/google-signin @react-native-seoul/kakao-login @react-native-seoul/naver-login react-native-ui-lib  | ⏳ | Supabase Auth 로그인 화면으로 재작성(§7.3) |
| `cards/base/index.tsx` | 32 | — | react-native-auto-height-image react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `cards/base/sized-image.tsx` | 28 | — | react-native-paper react-native-skeleton-placeholder  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `cards/base/tablet-sized-image.tsx` | 33 | — | react-native-paper react-native-skeleton-placeholder  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `cards/base/tablet-unit-image.tsx` | 28 | — | react-native-paper react-native-skeleton-placeholder  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `cards/bookmark.tsx` | 160 |  Ctx Nav Apo | react-native-blob-util react-native-document-scanner-plugin react-native-image-crop-picker  | ⏳ | M4 `usePhotoUpload` 공통 훅으로 재작성(5곳 복붙 구조) |
| `cards/hotline-class.tsx` | 43 | — | react-native-paper  | ⏳ | M9 실황 수업(kit/live-class) |
| `cards/image-adjust-card.tsx` | 77 | — | react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `cards/list-placeholder.tsx` | 41 | — | react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `cards/tablet-bookmark.tsx` | 71 |  Ctx Nav Apo | react-native-blob-util react-native-document-scanner-plugin react-native-image-crop-picker  | ⏳ | M4 `usePhotoUpload` 공통 훅으로 재작성(5곳 복붙 구조) |
| `cards/tablet-list-placeholder.tsx` | 39 | — | react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `cards/topic-live-class.tsx` | 44 | — | react-native-paper  | ⏳ | M9 실황 수업(kit/live-class) |
| `chat/ChatModal.tsx` | 516 |  Ctx Nav Apo St | react-native-paper  | ⛔ | 기존 채팅 에이전트 — 새 에이전트 패널로 대체(§2.5 참고용) |
| `chat/ConceptsPanel.tsx` | 493 |  St | react-native-paper  | ⛔ | 기존 채팅 에이전트 — 새 에이전트 패널로 대체(§2.5 참고용) |
| `chat/GlobalChatAgentButton.tsx` | 73 | — | react-native-safe-area-context  | ⛔ | 기존 채팅 에이전트 — 새 에이전트 패널로 대체(§2.5 참고용) |
| `chat/LiveClassPanel.tsx` | 299 |  Ctx Nav St | react-native-paper  | ⛔ | 기존 채팅 에이전트 — 새 에이전트 패널로 대체(§2.5 참고용) |
| `header/index.tsx` | 29 |  Nav | react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `header/placeholder.tsx` | 29 |  Nav | react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `image-dynamic-dims/index.tsx` | 61 | — | — | ✅ | src/kit/ui/image-dynamic-dims.tsx |
| `image-dynamic-dims/responsive-image.tsx` | 168 | — | — | ⛔ | 원본이 존재하지 않는 './ResponsiveImage'를 import(깨진 파일) |
| `linking/index.tsx` | 55 |  Ctx Nav | — | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `loading-view/fetching-animation.tsx` | 4 | — | — | ✅ | `Go3MathLoader`(loading-view/index.tsx)로 통일 |
| `loading-view/global-overlay.tsx` | 61 |  Ctx | — | ✅ | src/kit/ui/loading-view/global-overlay.tsx — AppCtx 대신 blockingStore·localOverlayStore |
| `loading-view/index.tsx` | 56 | — | react-native-reanimated  | ✅ | src/kit/ui/loading-view/index.tsx — 주황 SVG 로고 가운데 scale 반복, 로딩 뷰 단일화 |
| `loading-view/qoolla-logo-activity-indicator.tsx` | 83 | — | react-native-reanimated  | ✅ | `Go3MathLoader`로 통일(좌우 흔들림 → scale) |
| `loading-view/skeleton-placeholder.tsx` | 60 | — | — | ✅ | src/kit/ui/loading-view/ |
| `loading-view/tablet.tsx` | 56 | — | react-native-reanimated  | ✅ | `Go3MathLoader`로 통일(폭은 deviceMode로) |
| `logo/index.tsx` | 57 | — | react-native-reanimated react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `logo/tablet-logo.tsx` | 47 | — | react-native-reanimated react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `math-web-view/equ-memo-template.ts` | 74 | — | — | ✅ | src/kit/math/templates/ |
| `math-web-view/equ-view-param-template.ts` | 83 | — | — | ✅ | src/kit/math/templates/ |
| `math-web-view/equ-view-template.ts` | 69 | — | — | ✅ | src/kit/math/templates/ |
| `math-web-view/index.tsx` | 122 |  Nav | react-native-webview  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `math/MathJaxWrapper.tsx` | 2 | — | — | ⛔ | 2줄 재export 파일 |
| `math/math-wrapper.tsx` | 354 | — | react-native-webview  | ✅ | src/kit/math/MathJaxWrapper.tsx |
| `modal/BookmarksViewerModal.tsx` | 145 |  Ctx Nav Apo | react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `modal/QuizResponseModal.tsx` | 413 |  Apo | react-native-webview  | ⏳ | M9 실황 수업(kit/live-class) |
| `modal/TabletQuestionsViewerModal.tsx` | 94 |  Nav Apo | react-native-paper  | ⏳ | M3 kit/topic-panel · 검색 패널(콜백 기반) |
| `modal/TabletTopicUnitwViewerModal.tsx` | 96 |  Nav Apo | react-native-paper  | ⏳ | M3 kit/topic-panel · 검색 패널(콜백 기반) |
| `modal/monthly-event.tsx` | 687 |  Ctx Nav Apo | react-native-calendar-events react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `note-canvas/canvas-template-base.ts` | 88 | — | — | ✅ | src/kit/canvas/templates/ (fabric CDN 그대로, 인라인 옵션은 M4) |
| `note-canvas/canvas-utils.ts` | 137 | — | react-native-blob-util  | ⏳ | M4 kit/canvas `SolveCanvas`(크기 props, 업로드·저장 포트) |
| `note-canvas/hotline-class-canvas.tsx` | 843 |  Ctx Nav St | react-native-blob-util react-native-paper react-native-uuid react-native-webview  | ⏳ | M9 실황 수업(kit/live-class) |
| `note-canvas/live-class-canvas-template.ts` | 1014 | — | — | ✅ | src/kit/canvas/templates/ (fabric CDN 그대로, 인라인 옵션은 M4) |
| `note-canvas/notebook.tsx` | 202 |  Ctx Nav St | react-native-paper react-native-webview  | ⏳ | M4 kit/canvas `SolveCanvas`(크기 props, 업로드·저장 포트) |
| `note-canvas/topic-canvas-template.ts` | 1408 | — | — | ✅ | src/kit/canvas/templates/ (fabric CDN 그대로, 인라인 옵션은 M4) |
| `note-canvas/topic-live-canvas.tsx` | 822 |  Ctx Nav St | react-native-blob-util react-native-paper react-native-uuid react-native-webview  | ⏳ | M9 실황 수업(kit/live-class) |
| `note-canvas/topic-notebook.tsx` | 600 |  Ctx Nav St | react-native-blob-util react-native-paper react-native-webview  | ⏳ | M4 kit/canvas `SolveCanvas`(크기 props, 업로드·저장 포트) |
| `note-canvas/whiteboard-canvas-template.ts` | 448 | — | — | ✅ | src/kit/canvas/templates/ (fabric CDN 그대로, 인라인 옵션은 M4) |
| `panels/bookmark/index.tsx` | 307 |  Ctx Nav Apo | react-native-date-picker react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/bookmark/tablet.tsx` | 305 |  Nav Apo | @gorhom/bottom-sheet react-native-date-picker react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/chapter-topics/index.tsx` | 125 |  Ctx Nav Apo | react-native-paper react-native-ui-lib  | ⏳ | M3 kit/topic-panel · 검색 패널(콜백 기반) |
| `panels/chapter-topics/tablet.tsx` | 145 |  Ctx Nav Apo St | react-native-paper react-native-ui-lib  | ⏳ | M3 kit/topic-panel · 검색 패널(콜백 기반) |
| `panels/concept/index.tsx` | 344 |  Ctx Nav Apo | — | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/essay/index.tsx` | 108 |  Ctx Nav Apo | react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/essay/item.tsx` | 198 |  Ctx Nav Apo | react-native-blob-util react-native-document-scanner-plugin react-native-image-crop-picker  | ⏳ | M4 `usePhotoUpload` 공통 훅으로 재작성(5곳 복붙 구조) |
| `panels/profile/cards/emepty-memo.tsx` | 0 | — | — | ⛔ | 빈 파일 |
| `panels/profile/my-info-tablet.tsx` | 123 |  Ctx Nav St | react-native-auto-height-image react-native-paper react-native-restart  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/profile/my-info.tsx` | 136 |  Ctx Nav St | react-native-auto-height-image react-native-paper react-native-restart  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/profile/my-memos.tsx` | 399 |  Ctx Nav Apo | react-native-auto-height-image react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/profile/my-tablet-memos.tsx` | 507 |  Ctx Nav Apo | react-native-auto-height-image react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/profile/notices.tsx` | 362 |  Ctx Nav Apo | react-native-calendar-events react-native-paper react-native-permissions react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/profile/tablet-notices.tsx` | 435 |  Ctx Nav Apo | react-native-calendar-events react-native-paper react-native-permissions react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/questions.tsx` | 236 |  Ctx Nav Apo | react-native-blob-util react-native-document-scanner-plugin react-native-paper  | ⏳ | M4 `usePhotoUpload` 공통 훅으로 재작성(5곳 복붙 구조) |
| `panels/record-calendar/index.tsx` | 289 |  Ctx Nav Apo | react-native-calendars react-native-paper react-native-webview  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/record-calendar/tablet-records-calendar.tsx` | 315 |  Ctx Nav Apo | react-native-calendars react-native-paper react-native-webview  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/research/basic-topics.tsx` | 116 |  Ctx Nav St | react-native-paper  | ⏳ | M3 kit/topic-panel · 검색 패널(콜백 기반) |
| `panels/research/mentor-topics.tsx` | 342 |  Ctx Nav Apo St | react-native-auto-height-image react-native-paper react-native-ui-lib  | ✅ | src/kit/topic-panel/TopicTabsPanel.tsx (태블릿 쌍과 통합) |
| `panels/research/pre-exams.tsx` | 383 |  Ctx Nav Apo St | react-native-paper react-native-ui-lib  | ✅ | src/kit/exam-search/ExamSearchPanel.tsx (mode=pre_exam) |
| `panels/research/tablet-basic-topics.tsx` | 126 |  Ctx Nav St | react-native-paper  | ⏳ | M3 kit/topic-panel · 검색 패널(콜백 기반) |
| `panels/research/tablet-mentor-topics.tsx` | 330 |  Ctx Nav Apo St | react-native-auto-height-image react-native-paper react-native-ui-lib  | ✅ | src/kit/topic-panel/TopicTabsPanel.tsx — 폰 쌍과 통합, fetcher 주입 |
| `panels/research/tablet-pre-exams.tsx` | 392 |  Ctx Nav Apo St | react-native-paper react-native-ui-lib  | ✅ | src/kit/exam-search/ExamSearchPanel.tsx (mode=pre_exam) — 과제 생성은 서버로 |
| `panels/research/tablet-this-year-exams.tsx` | 296 |  Ctx Nav Apo St | react-native-paper react-native-ui-lib  | ✅ | src/kit/exam-search/ExamSearchPanel.tsx (mode=this_year) — 과제 생성은 서버로 |
| `panels/research/this-year-exams.tsx` | 282 |  Ctx Nav Apo St | react-native-paper react-native-ui-lib  | ✅ | src/kit/exam-search/ExamSearchPanel.tsx (mode=this_year) |
| `panels/study-note/index.tsx` | 247 |  Ctx Nav Apo | react-native-blob-util react-native-document-scanner-plugin react-native-paper  | ⏳ | M4 `usePhotoUpload` 공통 훅으로 재작성(5곳 복붙 구조) |
| `panels/study-note/tablet-note-units.tsx` | 169 |  Ctx Nav Apo | react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/tablet-questions.tsx` | 203 |  Ctx Nav Apo | react-native-paper react-native-ui-lib  | ⏳ | M4 `usePhotoUpload` 공통 훅으로 재작성(5곳 복붙 구조) |
| `panels/timeline/cards/bookmark-task.tsx` | 68 | — | react-native-paper react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/timeline/cards/collection-task.tsx` | 55 | — | react-native-paper react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/timeline/cards/concept-task.tsx` | 49 | — | react-native-auto-height-image react-native-paper react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/timeline/cards/empty-task.tsx` | 39 | — | react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/timeline/cards/pre-exam-task.tsx` | 132 |  Ctx Nav Apo | react-native-paper react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/timeline/cards/topic-task.tsx` | 55 | — | react-native-paper react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/timeline/index.tsx` | 1032 |  Ctx Nav Apo St | @react-native-community/slider react-native-calendar-events react-native-date-picker react-native-paper react-native-permissions react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/timeline/tablet.tsx` | 1115 |  Ctx Nav Apo St | @gorhom/bottom-sheet @react-native-community/slider react-native-calendar-events react-native-date-picker react-native-paper react-native-permissions react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `panels/topic/tablet.tsx` | 275 |  Ctx Nav Apo | react-native-paper react-native-ui-lib  | ✅ | src/kit/topic-panel/TopicUnitList.tsx — 책갈피 추가(쓰기)는 M10에서 |
| `public/button/categories.tsx` | 56 |  Ctx | react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `public/card/question.tsx` | 71 |  Nav | react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `public/current-year-exams-section.tsx` | 157 |  Ctx Nav | react-native-paper react-native-ui-lib react-native-webview  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `public/info-section.tsx` | 179 | — | react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `public/mandatory-section.tsx` | 106 |  Nav St | react-native-paper  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `public/pre-exams-section.tsx` | 228 |  Ctx Nav | react-native-paper react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `sections/profile-sections.tsx` | 75 |  Ctx St | react-native-ui-lib  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `sections/research-sections.tsx` | 79 |  Ctx St | react-native-ui-lib  | ⏳ | M3 kit/topic-panel · 검색 패널(콜백 기반) |
| `study-note/tablet.tsx` | 746 |  Ctx Nav Apo | @react-native-community/slider react-native-calendar-events react-native-date-picker react-native-paper react-native-permissions  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `toast/index.tsx` | 117 | — | react-native-webview  | ✅ | src/kit/ui/toast.tsx |
| `video/index.tsx` | 67 | — | react-native-webview  | ✅ | src/kit/ui/video.tsx |
| `web-view/index.tsx` | 107 | — | react-native-webview  | ✅ | src/kit/ui/web-view.tsx |
| `wrappers/ads-screen-wrapper.tsx` | 76 |  Ctx Nav | react-native-safe-area-context  | ⛔ | AdMob — 유지 여부 미결정(§9) |
| `wrappers/ads-tab-wrapper.tsx` | 72 |  Nav | react-native-reanimated react-native-safe-area-context react-native-ui-lib  | ⛔ | AdMob — 유지 여부 미결정(§9) |
| `wrappers/screen-wrapper.tsx` | 76 |  Nav | react-native-safe-area-context  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |
| `wrappers/tab-wrapper.tsx` | 62 |  Nav | react-native-safe-area-context  | ⏳ | M10 기능 동등성(비에이전트 모드 화면과 함께) |

### 원본에서 발견한 점
- `config/exam.constants.ts`의 `thisMonths`에 `{ label: '5월', value: 4 }`가 있다(라벨과 값 불일치). 원본 그대로 두었다 — 서버 데이터 기준 확인 필요.
- graphql-ws `shouldRetry`에 시도 횟수 대신 오류 이벤트가 들어와 재연결 3회 제한이 동작하지 않았다(새 앱에서 `retryAttempts: 3`으로 수정).

### 원본에서 발견한 점
- `config/exam.constants.ts`의 `thisMonths`에 `{ label: '5월', value: 4 }`가 있다(라벨과 값 불일치). 원본 그대로 두었다 — 서버 데이터 기준 확인 필요.
- graphql-ws `shouldRetry`에 시도 횟수 대신 오류 이벤트가 들어와 재연결 3회 제한이 동작하지 않았다(새 앱에서 `retryAttempts: 3`으로 수정).

### 공통 교체 규칙 (재작성 시)
- `react-native-paper`, `react-native-ui-lib` → RN 기본 컴포넌트 + `src/ui/theme`(패치 승계 금지, §3.3.1)
- `react-native-blob-util`, `react-native-fs` → `expo-file-system` / `fetch` PUT
- `react-native-image-crop-picker` → `expo-image-picker`, `react-native-restart` → `expo-updates.reloadAsync`
- `react-native-calendar-events` → `expo-calendar`, `react-native-date-picker` → `@react-native-community/datetimepicker`
- `react-native-auto-height-image`, `react-native-skeleton-placeholder` → 자체 구현 또는 `expo-image`
- AppCtx 읽기 → props / `src/state` store, `useNavigation` → 콜백, Apollo 훅 → fetcher 주입(§2.6)
