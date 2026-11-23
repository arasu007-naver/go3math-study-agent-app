# 컴포넌트 용어집

프롬프트에서 아래 **이름**만 말해도 해당 파일을 바로 찾을 수 있도록 정리한 용어집입니다. 항목 형식은 `- **이름**: \`상대경로\`` 이며, 화면 항목의 설명은 라우트 경로입니다. 라우트 파일은 저장소 루트의 `app/` 아래에 있습니다(`src/app/`이 아님). 컴포넌트·훅·상태·API·유틸·테마를 추가/삭제/이동하면 이 문서도 함께 갱신하세요.

## 네비게이터

- **MainLayout**: `app/(main)/_layout.tsx` — `/` 레이아웃
- **ChatTabLayout**: `app/(main)/chat/_layout.tsx` — `/chat` 레이아웃
- **DiaryTabLayout**: `app/(main)/diary/_layout.tsx` — `/diary` 레이아웃
- **SearchTabLayout**: `app/(main)/search/_layout.tsx` — `/search` 레이아웃
- **TimelineTabLayout**: `app/(main)/timeline/_layout.tsx` — `/timeline` 레이아웃
- **RootLayout**: `app/_layout.tsx` — `/` 레이아웃

## 화면

- **ChatTabScreen**: `app/(main)/chat/index.tsx` — `/chat`
- **ChatProblemsScreen**: `app/(main)/chat/problems.tsx` — `/chat/problems`
- **ChatTopicScreen**: `app/(main)/chat/topic.tsx` — `/chat/topic`
- **DiaryDayScreen**: `app/(main)/diary/day.tsx` — `/diary/day`
- **DiaryTabScreen**: `app/(main)/diary/index.tsx` — `/diary`
- **AgentHome**: `app/(main)/index.tsx` — `/`
- **ProfileTabScreen**: `app/(main)/profile.tsx` — `/profile`
- **SearchTabScreen**: `app/(main)/search/index.tsx` — `/search`
- **SearchProblemsScreen**: `app/(main)/search/problems.tsx` — `/search/problems`
- **SearchTopicScreen**: `app/(main)/search/topic.tsx` — `/search/topic`
- **TimelineTabScreen**: `app/(main)/timeline/index.tsx` — `/timeline`
- **TimelineProblemsScreen**: `app/(main)/timeline/problems.tsx` — `/timeline/problems`
- **TimelineTopicScreen**: `app/(main)/timeline/topic.tsx` — `/timeline/topic`
- **AuthCallback**: `app/auth/callback.tsx` — `/auth/callback`
- **HotlineClassScreen**: `app/hotline-class.tsx` — `/hotline-class`
- **NotebookScreen**: `app/notebook.tsx` — `/notebook`
- **PublicQuestionsViewScreen**: `app/public-questions.tsx` — `/public-questions`
- **PublicSolutionViewScreen**: `app/public-solution.tsx` — `/public-solution`
- **TopicLiveClassScreen**: `app/topic-live-class.tsx` — `/topic-live-class`
- **WelcomeScreen**: `app/welcome.tsx` — `/welcome`

## 공용 컴포넌트

- **AdSlot**: `src/ui/AdSlot.tsx`
- **Button**: `src/ui/Button.tsx`
- **Chip**: `src/ui/Chip.tsx`
- **LiveClassWaiting**: `src/kit/live-class/LiveClassWaiting.tsx`
- **Dialog**: `src/ui/Dialog.tsx`
- **IconButton**: `src/ui/IconButton.tsx`
- **Sheet**: `src/ui/Sheet.tsx`
- **SheetHandle**: `src/ui/SheetHandle.tsx`
- **StateView**: `src/ui/StateView.tsx`
- **StudyLogIcon**: `src/ui/StudyLogIcon.tsx`
- **TabletLaunchOverlay**: `src/ui/TabletLaunchOverlay.tsx`
- **Tag**: `src/ui/Tag.tsx`
- **Toast**: `src/ui/toast/Toast.tsx`
- **CanvasAnswer**: `src/kit/canvas/CanvasAnswer.tsx`
- **CanvasChrome**: `src/kit/canvas/CanvasChrome.tsx`
- **CanvasStudySheet**: `src/kit/canvas/CanvasStudySheet.tsx`
- **FloatingToolbar**: `src/kit/canvas/FloatingToolbar.tsx`
- **LandscapeNotice**: `src/kit/canvas/LandscapeNotice.tsx`
- **ToolPopover**: `src/kit/canvas/ToolPopover.tsx`
- **HotlineClassCanvas**: `src/kit/canvas/note-canvas/hotline-class-canvas.tsx`
- **ImageAdjustCard**: `src/kit/canvas/note-canvas/image-adjust-card.tsx`
- **Notebook**: `src/kit/canvas/note-canvas/notebook.tsx`
- **NoteCanvasPencilPropsModal**: `src/kit/canvas/note-canvas/pencil-props-modal.tsx`
- **ScreenWrapper**: `src/kit/canvas/note-canvas/screen-wrapper.tsx`
- **TopicLiveCanvas**: `src/kit/canvas/note-canvas/topic-live-canvas.tsx`
- **LiveScriptId**: `src/kit/canvas/note-canvas/live-script-id.ts`
- **ConceptLookupPanel**: `src/kit/concepts/ConceptLookupPanel.tsx`
- **ConceptStatement**: `src/kit/concepts/ConceptStatement.tsx`
- **DailyRecordsList**: `src/kit/diary/DailyRecordsList.tsx`
- **DiaryPanel**: `src/kit/diary/DiaryPanel.tsx`
- **RecordsCalendar**: `src/kit/diary/RecordsCalendar.tsx`
- **ExamSearchPanel**: `src/kit/exam-search/ExamSearchPanel.tsx`
- **LiveClassListPanel**: `src/kit/live-class/LiveClassListPanel.tsx`
- **QuizResponseModal**: `src/kit/live-class/QuizResponseModal.tsx`
- **toPositionGuide**: `src/kit/live-class/toPositionGuide.ts`
- **MathChipLabel**: `src/kit/math/MathChipLabel.tsx`
- **MathJaxWrapper**: `src/kit/math/MathJaxWrapper.tsx`
- **NoticesPanel**: `src/kit/notices/NoticesPanel.tsx`
- **AnswerBubble**: `src/kit/problem-list/AnswerBubble.tsx`
- **ProblemActionRow**: `src/kit/problem-list/ProblemActionRow.tsx`
- **ProblemListPanel**: `src/kit/problem-list/ProblemListPanel.tsx`
- **MessageBoxPanel**: `src/kit/profile/MessageBoxPanel.tsx`
- **MyInfoPanel**: `src/kit/profile/MyInfoPanel.tsx`
- **ProfileActions**: `src/kit/profile/ProfileActions.tsx`
- **ResearchPanel**: `src/kit/research/ResearchPanel.tsx`
- **PlaybackToolbar**: `src/kit/script-player/PlaybackToolbar.tsx`
- **StudyNoteReviewList**: `src/kit/study-log/StudyNoteReviewList.tsx`
- **StudyNoteForm**: `src/kit/study-note/StudyNoteForm.tsx`
- **TimelinePanel**: `src/kit/timeline/TimelinePanel.tsx`
- **TopicTabsPanel**: `src/kit/topic-panel/TopicTabsPanel.tsx`
- **TopicUnitList**: `src/kit/topic-panel/TopicUnitList.tsx`
- **PdfViewerModal**: `src/kit/ui/PdfViewerModal.tsx`
- **PdfViewerModalWeb**: `src/kit/ui/PdfViewerModal.web.tsx`
- **PencilFab**: `src/kit/ui/PencilFab.tsx`
- **SkeletonCards**: `src/kit/ui/SkeletonCards.tsx`
- **GoButton**: `src/kit/ui/go-button.tsx`
- **ImageDynamicDims**: `src/kit/ui/image-dynamic-dims.tsx`
- **GlobalOverlay**: `src/kit/ui/loading-view/global-overlay.tsx`
- **LoadingView**: `src/kit/ui/loading-view/index.tsx`
- **WebView**: `src/kit/ui/web-view.tsx`
- **DockWrapper**: `src/agent/DockWrapper.tsx`
- **EdgeHandle**: `src/agent/EdgeHandle.tsx`
- **InstructionCard**: `src/agent/InstructionCard.tsx`
- **StudyLogPanel**: `src/agent/StudyLogPanel.tsx`
- **TabletAgentLayer**: `src/agent/TabletAgentLayer.tsx`
- **ChatRail**: `src/agent/tablet/ChatRail.tsx`
- **ChatTimeline**: `src/agent/tablet/ChatTimeline.tsx`
- **DrawerFooter**: `src/agent/tablet/DrawerFooter.tsx`
- **TabletAgentLayerV2**: `src/agent/tablet/TabletAgentLayer.tsx`
- **SheetHost**: `src/host/SheetHost.tsx`
- **Stage**: `src/host/Stage.tsx`
- **HostWidgets**: `src/host/widgets.tsx`
- **PhoneScreens**: `src/phone/PhoneScreens.tsx`
- **PhoneStudySheets**: `src/phone/PhoneStudySheets.tsx`

## 훅

- **useAgentSession**: `src/agent/useAgentSession.ts`
- **useAuthGate**: `src/auth/useAuthGate.ts`
- **useMyInfo**: `src/auth/useMyInfo.ts`
- **useSolveFinished**: `src/host/useSolveFinished.ts`
- **useCanvasLandscape**: `src/kit/canvas/useCanvasLandscape.ts`
- **useScriptPlayer**: `src/kit/script-player/useScriptPlayer.ts`

## 상태

- **AuthStore**: `src/state/auth.ts`
- **BlockingStore**: `src/state/blocking.ts`
- **BootstrapStore**: `src/state/bootstrap.ts`
- **CanvasActivityStore**: `src/state/canvasActivity.ts`
- **ConceptsStore**: `src/state/concepts.ts`
- **createStore**: `src/state/createStore.ts`
- **OverlaysStore**: `src/state/overlays.ts`
- **SolveStore**: `src/state/solve.ts`
- **StudyDataStore**: `src/state/studyData.ts`
- **UiStore**: `src/state/ui.ts`

## API

- **GraphqlClient**: `src/api/graphql/client.ts`
- **MutationIndex**: `src/api/graphql/mutations/index.ts`
- **MutationRecord**: `src/api/graphql/mutations/record.ts`
- **MutationStudy**: `src/api/graphql/mutations/study.ts`
- **MutationTask**: `src/api/graphql/mutations/task.ts`
- **MutationTopic**: `src/api/graphql/mutations/topic.ts`
- **MutationUser**: `src/api/graphql/mutations/user.ts`
- **QueryBookmark**: `src/api/graphql/queries/bookmark.ts`
- **QueryIndex**: `src/api/graphql/queries/index.ts`
- **QueryMessaging**: `src/api/graphql/queries/messaging.ts`
- **QueryRecord**: `src/api/graphql/queries/record.ts`
- **QueryStudy**: `src/api/graphql/queries/study.ts`
- **QueryTask**: `src/api/graphql/queries/task.ts`
- **QueryTopic**: `src/api/graphql/queries/topic.ts`
- **QueryUser**: `src/api/graphql/queries/user.ts`
- **GraphqlSubscriptions**: `src/api/graphql/subscriptions.ts`
- **apiV3**: `src/api/rest/apiV3.ts`
- **RestIndex**: `src/api/rest/index.ts`
- **lessonNotes**: `src/api/rest/lessonNotes.ts`
- **ensureTask**: `src/adapters/ensureTask.ts`
- **liveClassFetchers**: `src/adapters/liveClassFetchers.ts`
- **messageBoxFetchers**: `src/adapters/messageBoxFetchers.ts`
- **noticeFetchers**: `src/adapters/noticeFetchers.ts`
- **problemListFetchers**: `src/adapters/problemListFetchers.ts`
- **profileEditors**: `src/adapters/profileEditors.ts`
- **recordFetchers**: `src/adapters/recordFetchers.ts`
- **solutionPhoto**: `src/adapters/solutionPhoto.ts`
- **studyLogFetchers**: `src/adapters/studyLogFetchers.ts`
- **studyNoteFetchers**: `src/adapters/studyNoteFetchers.ts`
- **timelineFetchers**: `src/adapters/timelineFetchers.ts`
- **topicFetchers**: `src/adapters/topicFetchers.ts`
- **AuthLogout**: `src/auth/logout.ts`
- **AuthOauth**: `src/auth/oauth.ts`
- **AuthQoollaToken**: `src/auth/qoollaToken.ts`

## 유틸

- **DeviceMode**: `src/layout/deviceMode.ts`
- **FullScreenRoutes**: `src/layout/fullScreenRoutes.ts`
- **Storage**: `src/storage/index.ts`
- **StorageWeb**: `src/storage/index.web.ts`
- **StorageTypes**: `src/storage/types.ts`
- **Protocol**: `src/protocol/index.ts`
- **CanvasSize**: `src/kit/canvas/canvasSize.ts`
- **CenterListItem**: `src/kit/canvas/centerListItem.ts`
- **LandscapeRestrictions**: `src/kit/canvas/landscapeRestrictions.ts`
- **CanvasUtils**: `src/kit/canvas/note-canvas/canvas-utils.ts`
- **CanvasStyles**: `src/kit/canvas/note-canvas/canvasStyles.ts`
- **CanvasLegacy**: `src/kit/canvas/note-canvas/legacy.ts`
- **ScriptMaker**: `src/kit/canvas/note-canvas/script-maker.ts`
- **ExamSearchQuery**: `src/kit/exam-search/query.ts`
- **AnswerBubblePlacement**: `src/kit/problem-list/answerBubblePlacement.ts`
- **contentVersion**: `src/kit/problem-list/contentVersion.ts`
- **StudyLogModel**: `src/kit/study-log/model.ts`
- **TopicTitles**: `src/kit/study-log/topicTitles.ts`
- **StudyNoteActivity**: `src/kit/study-note/activity.ts`
- **StudyNoteDraft**: `src/kit/study-note/draft.ts`
- **StudyNoteModel**: `src/kit/study-note/model.ts`
- **StudyNotePersist**: `src/kit/study-note/persist.ts`
- **TopicPanelTypes**: `src/kit/topic-panel/types.ts`
- **AnswerPageStyle**: `src/kit/ui/answerPageStyle.ts`

## 테마·상수

- **ApiConstants**: `src/config/api.constants.ts`
- **ExamConstants**: `src/config/exam.constants.ts`
- **UiConstants**: `src/config/ui.constants.ts`
- **Theme**: `src/ui/theme.ts`
