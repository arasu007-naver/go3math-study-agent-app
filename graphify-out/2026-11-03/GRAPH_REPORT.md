# Graph Report - go3math-study-agent-app  (2026-11-03)

## Corpus Check
- 183 files · ~268,652 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1061 nodes · 1954 edges · 73 communities (60 shown, 13 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 12 edges (avg confidence: 0.53)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ce27657c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_TabletAgentLayer.tsx|TabletAgentLayer.tsx]]
- [[_COMMUNITY_dependencies|dependencies]]
- [[_COMMUNITY_deviceMode.ts|deviceMode.ts]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_go3math-study-agent-app 디자인 개선 구현 명세 (design-spec.md)|go3math-study-agent-app 디자인 개선 구현 명세 (design-spec.md)]]
- [[_COMMUNITY_TimelinePanel.tsx|TimelinePanel.tsx]]
- [[_COMMUNITY_commandRouter.ts|commandRouter.ts]]
- [[_COMMUNITY_useScriptPlayer.ts|useScriptPlayer.ts]]
- [[_COMMUNITY_MessageBoxPanel.tsx|MessageBoxPanel.tsx]]
- [[_COMMUNITY_hotline-class-canvas.tsx|hotline-class-canvas.tsx]]
- [[_COMMUNITY_TopicTabsPanel.tsx|TopicTabsPanel.tsx]]
- [[_COMMUNITY_ExamSearchPanel.tsx|ExamSearchPanel.tsx]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_notebook.tsx|notebook.tsx]]
- [[_COMMUNITY_session.ts|session.ts]]
- [[_COMMUNITY_AgentSession|AgentSession]]
- [[_COMMUNITY_auth.ts|auth.ts]]
- [[_COMMUNITY_Transport|Transport]]
- [[_COMMUNITY_8. 단계별 구현 계획 (Done criteria)|8. 단계별 구현 계획 (Done criteria)]]
- [[_COMMUNITY_topic-notebook.tsx|topic-notebook.tsx]]
- [[_COMMUNITY_state.test.ts|state.test.ts]]
- [[_COMMUNITY_3.5 같은 ID 대체 업데이트 경로|3.5 같은 ID 대체 업데이트 경로]]
- [[_COMMUNITY_exam.constants.ts|exam.constants.ts]]
- [[_COMMUNITY_welcome.tsx|welcome.tsx]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_MockAgentTransport|MockAgentTransport]]
- [[_COMMUNITY_bootstrap.ts|bootstrap.ts]]
- [[_COMMUNITY_Qoolla 에이전트 주도 수능 수학 학습 앱 — 구현 명세서|Qoolla 에이전트 주도 수능 수학 학습 앱 — 구현 명세서]]
- [[_COMMUNITY_widgets.tsx|widgets.tsx]]
- [[_COMMUNITY_ResearchPanel.tsx|ResearchPanel.tsx]]
- [[_COMMUNITY_scripts|scripts]]
- [[_COMMUNITY_4. 에이전트 UX 레이아웃|4. 에이전트 UX 레이아웃]]
- [[_COMMUNITY_api.constants.ts|api.constants.ts]]
- [[_COMMUNITY_pencil-props-modal.tsx|pencil-props-modal.tsx]]
- [[_COMMUNITY_ResearchPanel.tsx|ResearchPanel.tsx]]
- [[_COMMUNITY_withTabletSplash.js|withTabletSplash.js]]
- [[_COMMUNITY_2. 기존 앱 구조 분석 결과 (직접 읽은 내용)|2. 기존 앱 구조 분석 결과 (직접 읽은 내용)]]
- [[_COMMUNITY_5. 에이전트–앱 프로토콜|5. 에이전트–앱 프로토콜]]
- [[_COMMUNITY_7. 에이전트 서버 인터페이스|7. 에이전트 서버 인터페이스]]
- [[_COMMUNITY_components — 109개|components — 109개]]
- [[_COMMUNITY_MathJaxWrapper.tsx|MathJaxWrapper.tsx]]
- [[_COMMUNITY_go-button.tsx|go-button.tsx]]
- [[_COMMUNITY_Supabase Edge Functions — Naver Auth|Supabase Edge Functions — Naver Auth]]
- [[_COMMUNITY_tsconfig.json|tsconfig.json]]
- [[_COMMUNITY_qoolla-agent-app|qoolla-agent-app]]
- [[_COMMUNITY_notification.ts|notification.ts]]
- [[_COMMUNITY_devDependencies|devDependencies]]
- [[_COMMUNITY_AGENTS|AGENTS.md]]
- [[_COMMUNITY_1. 목표, 범위, 비목표|1. 목표, 범위, 비목표]]
- [[_COMMUNITY_ResearchPanel.tsx|ResearchPanel.tsx]]
- [[_COMMUNITY_10월 모의고사 주제 식별 검증 (명세서 §6.2 2단계, M3 완료 조건)|10월 모의고사 주제 식별 검증 (명세서 §6.2 2단계, M3 완료 조건)]]
- [[_COMMUNITY_1. 목표, 범위, 비목표|1. 목표, 범위, 비목표]]
- [[_COMMUNITY_canvas-template-base.ts|canvas-template-base.ts]]
- [[_COMMUNITY_skeleton-placeholder.tsx|skeleton-placeholder.tsx]]
- [[_COMMUNITY_imports|imports]]
- [[_COMMUNITY_eslint.config.js|eslint.config.js]]
- [[_COMMUNITY_metro.config.js|metro.config.js]]
- [[_COMMUNITY_withKakaoMavenRepo.js|withKakaoMavenRepo.js]]
- [[_COMMUNITY_supabase.ts|supabase.ts]]
- [[_COMMUNITY_equ-view-param-template.ts|equ-view-param-template.ts]]
- [[_COMMUNITY_video.tsx|video.tsx]]
- [[_COMMUNITY_index.ts|index.ts]]
- [[_COMMUNITY_app.config.ts|app.config.ts]]
- [[_COMMUNITY_ui.constants.ts|ui.constants.ts]]
- [[_COMMUNITY_ClassicPlaceholder.tsx|ClassicPlaceholder.tsx]]
- [[_COMMUNITY_screen-wrapper.tsx|screen-wrapper.tsx]]
- [[_COMMUNITY_web-view.tsx|web-view.tsx]]

## God Nodes (most connected - your core abstractions)
1. `colors` - 39 edges
2. `AgentSession` - 23 edges
3. `radius` - 21 edges
4. `space` - 19 edges
5. `layout` - 18 edges
6. `8. 단계별 구현 계획 (Done criteria)` - 17 edges
7. `MockAgentTransport` - 14 edges
8. `authStore` - 13 edges
9. `shadow` - 13 edges
10. `UNITIMAGE()` - 12 edges

## Surprising Connections (you probably didn't know these)
- `run()` --calls--> `routeCommand()`  [EXTRACTED]
  __tests__/commandRouter.test.ts → src/agent/commandRouter.ts
- `AgentHome()` --calls--> `useDeviceMode()`  [EXTRACTED]
  app/(main)/index.tsx → src/layout/deviceMode.ts
- `fetchTopicQuestions()` --calls--> `UNITIMAGE()`  [EXTRACTED]
  app/public-questions.tsx → src/config/api.constants.ts
- `PublicSolutionViewScreen()` --calls--> `UNITANSWER()`  [EXTRACTED]
  app/public-solution.tsx → src/config/api.constants.ts
- `FullScreenWrapper()` --references--> `react`  [EXTRACTED]
  src/kit/canvas/note-canvas/screen-wrapper.tsx → package.json

## Import Cycles
- 1-file cycle: `metro.config.js -> metro.config.js`
- 1-file cycle: `src/api/graphql/client.ts -> src/api/graphql/client.ts`

## Communities (73 total, 13 thin omitted)

### Community 0 - "index.ts"
Cohesion: 0.07
Nodes (46): BOOKMARKS_OF_DAY, CHECK_BOOKMARK_SEARCH, LOG_MY_SHARE_STUDY, MY_ALBUMS, MY_BOOKMARK_TRIES, MY_BOOKMARKS, MY_STUDY_SHARES, PUBLIC_ALBUMS (+38 more)

### Community 1 - "TabletAgentLayer.tsx"
Cohesion: 0.05
Nodes (60): DockWrapper(), styles, EdgeHandle(), styles, InstructionCard(), styles, PhoneInstructionModal(), styles (+52 more)

### Community 2 - "dependencies"
Cohesion: 0.04
Nodes (54): dependencies, @apollo/client, axios, expo, expo-apple-authentication, expo-asset, expo-constants, expo-crypto (+46 more)

### Community 4 - "index.ts"
Cohesion: 0.05
Nodes (30): fetchExamQuestions(), Params, PublicUnit, Question, styles, toNumbers(), createProblemListFetchers(), fromRemote() (+22 more)

### Community 5 - "index.ts"
Cohesion: 0.08
Nodes (33): createProfileEditors(), createApolloClient(), createErrorLink(), createIsomorphLink(), DevType, ADD_BOOKMARK, ADD_LIVE_CLASS_QUIZ_RESPONSE, CREATE_RECORD (+25 more)

### Community 6 - "go3math-study-agent-app 디자인 개선 구현 명세 (design-spec.md)"
Cohesion: 0.06
Nodes (33): 0. 요약, 10. 열린 질문 / 결정 기록, 1.1 목표, 1.2 비목표 (하지 않음), 1.3 반드시 지킬 UX 결정 (스펙 §4), 1.4 기술 제약, 1. 목표 / 비목표 / 제약, 2. 현재 상태 (확인된 위치) (+25 more)

### Community 7 - "TimelinePanel.tsx"
Cohesion: 0.17
Nodes (12): NotebookCanvasPanel, NotebookScreen(), PanelHandle, styles, { width, height }, PublicSolutionViewScreen(), styles, UNITANSWER() (+4 more)

### Community 8 - "commandRouter.ts"
Cohesion: 0.11
Nodes (23): applyInstruction(), archive(), initialRouterState, Instruction, resolveInstruction(), routeCommand(), RouteResult, RouterState (+15 more)

### Community 9 - "useScriptPlayer.ts"
Cohesion: 0.10
Nodes (18): FloatingToolbar(), PlaybackControls(), Props, CurrentSheet, getLastOfSmallerNumbers(), MeasureImageWidth, Member, ScriptCanvasPort (+10 more)

### Community 10 - "MessageBoxPanel.tsx"
Cohesion: 0.10
Nodes (19): createNoticeFetchers(), createTimelineFetchers(), SQUARE_ANNOUNCEMENTS, MY_TASKS, Notice, NoticeFetchers, NoticesPanel(), styles (+11 more)

### Community 11 - "hotline-class-canvas.tsx"
Cohesion: 0.14
Nodes (18): canvasStyles, HotlineClassCanvasPanel, strokeColors, strokeWidths, styles, { width, height }, AppCtx, findLargestSmallerThan() (+10 more)

### Community 12 - "TopicTabsPanel.tsx"
Cohesion: 0.12
Nodes (19): createTopicFetchers(), buildThisYearQuery(), Props, resolveInitialSubject(), styles, TopicTabsPanel(), pickGoUnitIndex(), Props (+11 more)

### Community 13 - "ExamSearchPanel.tsx"
Cohesion: 0.16
Nodes (14): currentSubjects, thisMonths, ExamSearchMode, ExamSearchPanel(), Props, STORAGE_KEY, styles, ALL_NUMBERS (+6 more)

### Community 14 - "index.ts"
Cohesion: 0.11
Nodes (17): Handlers, AckCode, AgentCommand, AgentCommandSchema, choice, CloseComponentCmd, COMPONENT_IDS, EndSessionCmd (+9 more)

### Community 15 - "notebook.tsx"
Cohesion: 0.26
Nodes (8): canvasContextSize(), canvasScreenSize(), Size, NotebookCanvasPanel, { width, height }, classCanvasTemplate(), offsetOf, scaleOf

### Community 16 - "session.ts"
Cohesion: 0.36
Nodes (7): AgentHome(), getAgentSession(), useAgentSession(), DeviceMode, drawerWidth(), initialMode(), nextMode()

### Community 17 - "AgentSession"
Cohesion: 0.17
Nodes (7): AgentSession, capOutbox(), memoryStore(), SessionOptions, AppEvent, device(), setup()

### Community 18 - "auth.ts"
Cohesion: 0.21
Nodes (8): logout(), devGuestStore, MyInfo, AuthAction, AuthState, authStore, defaultAuthState, mockStore

### Community 19 - "Transport"
Cohesion: 0.12
Nodes (3): WebSocketTransport, Transport, FakeServer

### Community 20 - "8. 단계별 구현 계획 (Done criteria)"
Cohesion: 0.12
Nodes (17): 8.1 테스트 전략, 8.2 "기존 앱에 영향 없음" 검증 절차 (M0~M11 각 마일스톤 종료 시. 출시 후에는 기존 리포를 롤백용으로 동결하고 이 절차로 무변경 확인), 8. 단계별 구현 계획 (Done criteria), M0. 기준선 기록과 스캐폴딩, M10. 출시 기능 동등성(Parity) — 출시 차단 조건, M11. 릴리즈 후보와 테스트 트랙, M12. 단계적 출시와 안정화, M1. Expo 프로젝트 스캐폴드 (+9 more)

### Community 21 - "topic-notebook.tsx"
Cohesion: 0.14
Nodes (11): MathJaxView(), styles, { width: screenWidth, height: screenHeight }, strokeColors, strokeWidths, styles, TopicNotebookCanvasPanel, { width, height } (+3 more)

### Community 22 - "state.test.ts"
Cohesion: 0.16
Nodes (11): Action, beginBlocking(), BlockingId, endBlocking(), localOverlayStore, timers, createStore(), defaultUIState (+3 more)

### Community 23 - "3.5 같은 ID 대체 업데이트 경로"
Cohesion: 0.12
Nodes (16): 3.1 리포지토리 (3개 + 서버), 3.2 `qoolla-agent-app` 폴더 구조(제안), 3.3.1 기존 앱 네이티브 모듈의 Expo 호환성, 3.3.2 EAS Build / Submit, 3.3.3 EAS Update (OTA) — 추가 핫픽스/롤백 경로, 3.3 빌드/도구 — **React Native Expo (결정 완료, v0.3)**, 3.4 앱 ID 전략 — [결정 완료], 3.5.1 로컬 데이터·로그인 세션 이전 (MMKV) (+8 more)

### Community 24 - "exam.constants.ts"
Cohesion: 0.14
Nodes (13): Chapter, ChapterTree, MATH_AGENDA, MATH_CHAPTER_TREE, MATH_SUBJECTS, MATH_TOPIC_SUBJECTS, MathSubject, MonthOption (+5 more)

### Community 25 - "welcome.tsx"
Cohesion: 0.20
Nodes (11): MainLayout(), CATEGORIES, icons, logo, styles, topicFetchers, WelcomeScreen(), AuthGate (+3 more)

### Community 26 - "index.ts"
Cohesion: 0.21
Nodes (8): bootstrap(), migrateLegacyStorage(), restoreSession(), mmkv, storage, storage, KeyValueStore, LEGACY_KEYS

### Community 28 - "bootstrap.ts"
Cohesion: 0.20
Nodes (10): CanvasChrome(), canvasTool(), ICONS, FloatingAction, FloatingTool, ToolId, LandscapeNotice(), LANDSCAPE_RESTRICTED (+2 more)

### Community 29 - "Qoolla 에이전트 주도 수능 수학 학습 앱 — 구현 명세서"
Cohesion: 0.18
Nodes (11): 0. 한눈에 보는 결정 요약, 6.1 시퀀스 다이어그램, 6.2 단계 설명 및 상세 계약, 6.3 서버가 풀어줘야 하는 데이터, 6. 대표 시나리오: 10월 모의고사 흐름, 9.0 결정 완료, 9.1 열린 질문 (사용자 결정 필요, 번호는 v0.1 유지), 9.2 가정 (구현 전 검증) (+3 more)

### Community 30 - "widgets.tsx"
Cohesion: 0.22
Nodes (3): problemListFetchers, topicFetchers, WidgetProps

### Community 31 - "ResearchPanel.tsx"
Cohesion: 0.22
Nodes (7): GlobalLoadingOverlay(), styles, blockingStore, apolloClient, logo, styles, TabletLaunchOverlay()

### Community 32 - "scripts"
Cohesion: 0.08
Nodes (23): devDependencies, eslint, eslint-config-expo, @testing-library/react-native, @types/lodash, @types/react, typescript, jest (+15 more)

### Community 33 - "4. 에이전트 UX 레이아웃"
Cohesion: 0.22
Nodes (9): 4.1 원칙, 4.2 태블릿(짧은 변 ≥ 600) 레이아웃, 4.3 폰(짧은 변 < 600, Tablet에서 이탈은 < 560) 레이아웃, 4.4 기존 컴포넌트 포함 방식 (ComponentHost), 4.5 에이전트 instruction 모델과 표시 (v0.4), 4.6 태블릿 튜터 메시지 알림: toast (v0.4), 4.7.1 태블릿/폰 판단 기준 조사와 제안 (v0.4.1 조사, **v0.4.2 결정 — 질문 24 해결**), 4.7 폴더블·듀얼 화면 대응 (v0.4) (+1 more)

### Community 34 - "api.constants.ts"
Cohesion: 0.24
Nodes (12): react-native-blob-util, requestStorageUrl(), getBase64StringFromDataURL(), sendBoardAction(), strokeColors, strokeWidths, UploadParams, uploadQuizAnswerToStorage() (+4 more)

### Community 35 - "pencil-props-modal.tsx"
Cohesion: 0.31
Nodes (5): PencilPropsModal(), PencilPropsModalProps, styles, ToolPopover(), initialMetrics

### Community 36 - "ResearchPanel.tsx"
Cohesion: 0.20
Nodes (8): CATEGORIES, EXAM_MODE, Props, ResearchCategory, ResearchPanel(), resolveInitialCategory(), Store, styles

### Community 37 - "withTabletSplash.js"
Cohesion: 0.25
Nodes (5): ANDROID_DENSITIES, fs, { generateImageAsync, generateImageBackgroundAsync }, path, { withDangerousMod, IOSConfig }

### Community 38 - "2. 기존 앱 구조 분석 결과 (직접 읽은 내용)"
Cohesion: 0.25
Nodes (8): 2.1 기술 스택 [확인], 2.2 폰/태블릿 분기 [확인], 2.3 내비게이션 계약 [확인], 2.4 인증/API 계층 [확인], 2.5 재사용 대상 컴포넌트와 결합도 [확인], 2.6 결합도 분석 요약 → 추출 시 해결해야 할 5가지, 2.7 공유 모듈 분리 방법: 선택지와 권장, 2. 기존 앱 구조 분석 결과 (직접 읽은 내용)

### Community 39 - "5. 에이전트–앱 프로토콜"
Cohesion: 0.25
Nodes (8): 5.1 설계 원칙, 5.2 TypeScript 타입 (`@qoolla/agent-protocol`), 5.3 명령 → 기존 화면 매핑, 5.4 이벤트 발행 규칙, 5.5 세션 상태 모델, 5.6 오류, 오프라인, 재연결, 멱등성, 버전, 5.7 전송 방식 선택지와 권장, 5. 에이전트–앱 프로토콜

### Community 40 - "7. 에이전트 서버 인터페이스"
Cohesion: 0.25
Nodes (8): 7.1 역할 분리와 권장 구성, 7.2 엔드포인트, 7.3 인증, 7.4 데이터 접근 범위(읽기 전용 vs 신규 저장), 7.5 에이전트 정책(Policy) 단계적 도입, 7.6 관측성/운영, 7.7 Supabase 크론/트리거 (v0.4), 7. 에이전트 서버 인터페이스

### Community 41 - "components — 109개"
Cohesion: 0.29
Nodes (7): api / context — 완료, components — 109개, pages에서 추출한 로직 (M3), 공통 교체 규칙 (재작성 시), 기존 앱 → 새 앱 이전 현황 (components / api / context), 원본에서 발견한 점, 원본에서 발견한 점

### Community 42 - "MathJaxWrapper.tsx"
Cohesion: 0.18
Nodes (9): ConceptFetchers, ConceptLookupPanel(), styles, buildMathJaxHtmlDocument(), cleanMathText(), MathJaxWrapper(), MathJaxWrapperProps, processHtmlImages() (+1 more)

### Community 43 - "go-button.tsx"
Cohesion: 0.25
Nodes (6): GoButtonProps, Size, SIZE_MAP, styles, Variant, fontFamily

### Community 44 - "Supabase Edge Functions — Naver Auth"
Cohesion: 0.25
Nodes (7): 1. 디렉터리 구조, 2. 네이버 개발자센터 설정, 3. 환경 변수 (Secrets) 설정, 4. Edge Function 배포, 5. 인증 흐름 (Auth Flow), Supabase Edge Functions — Naver Auth, 배포 환경 (Supabase Dashboard 또는 CLI)

### Community 45 - "tsconfig.json"
Cohesion: 0.25
Nodes (7): compilerOptions, paths, strict, exclude, extends, include, @/*

### Community 46 - "qoolla-agent-app"
Cohesion: 0.29
Nodes (4): qoolla-agent-app, Supabase 로그인 (§7.3), 구조 (현재: M1 일부 + M2 앱 셸), 명령

### Community 47 - "notification.ts"
Cohesion: 0.33
Nodes (4): defaultNotificationState, NotificationAction, NotificationState, notificationStore

### Community 48 - "devDependencies"
Cohesion: 0.33
Nodes (3): ContentAction, ContentState, contentStore

### Community 49 - "AGENTS.md"
Cohesion: 0.33
Nodes (5): Building with EAS, Commands, Expo has changed — do not trust your training data, Navigation & Routing, Rules

### Community 50 - "1. 목표, 범위, 비목표"
Cohesion: 0.50
Nodes (4): 1.1 목표, 1.2 범위 (In scope), 1.3 비목표 (Non-goals), 1. 목표, 범위, 비목표

### Community 51 - "ResearchPanel.tsx"
Cohesion: 0.43
Nodes (6): configure(), getProviderToken(), OAuthProvider, SignInResult, signInWithProvider(), helloQoolla()

### Community 54 - "10월 모의고사 주제 식별 검증 (명세서 §6.2 2단계, M3 완료 조건)"
Cohesion: 0.50
Nodes (3): 10월 모의고사 주제 식별 검증 (명세서 §6.2 2단계, M3 완료 조건), 결과, 판단

### Community 55 - "1. 목표, 범위, 비목표"
Cohesion: 0.11
Nodes (18): fetchTopicQuestions(), createMessageBoxFetchers(), PRIVATE_REQUESTS, UNITIMAGE(), ProblemPreviewWidget(), FlyObj, makeTemporaryScript(), scriptTemplate() (+10 more)

### Community 56 - "canvas-template-base.ts"
Cohesion: 0.67
Nodes (3): buildCanvasTemplate(), CanvasTemplateOptions, getCanvasInitVars()

### Community 58 - "imports"
Cohesion: 0.50
Nodes (3): imports, @supabase/functions-js, @supabase/server

### Community 74 - "screen-wrapper.tsx"
Cohesion: 0.33
Nodes (5): react, DEFAULT_EDGES, Edge, FullScreenWrapper(), styles

### Community 75 - "web-view.tsx"
Cohesion: 0.13
Nodes (11): Go3MathLoader(), Go3MathLoaderProps, styles, VIEWBOX, styles, ToastProps, { width: screenWidth, height: screenHeight }, DEFAULT_INDICATOR_PROPS (+3 more)

## Knowledge Gaps
- **413 isolated node(s):** `tools`, `scaleOf`, `offsetOf`, `initialMetrics`, `query` (+408 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **13 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `scripts`, `screen-wrapper.tsx`, `api.constants.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Why does `FullScreenWrapper()` connect `screen-wrapper.tsx` to `hotline-class-canvas.tsx`, `notebook.tsx`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `react` connect `screen-wrapper.tsx` to `dependencies`?**
  _High betweenness centrality (0.092) - this node is a cross-community bridge._
- **What connects `tools`, `scaleOf`, `offsetOf` to the rest of the system?**
  _413 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06918238993710692 - nodes in this community are weakly interconnected._
- **Should `TabletAgentLayer.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05423094904160823 - nodes in this community are weakly interconnected._
- **Should `dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.037037037037037035 - nodes in this community are weakly interconnected._