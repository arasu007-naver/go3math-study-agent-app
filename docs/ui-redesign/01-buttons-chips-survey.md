# 단계 1 — 버튼·칩 사용처 조사

- 기준: `feat/study-note` @ `76b99e3`
- 방법: `rg -n "<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button)\b" app src`로 눌리는 요소를 모두 찾고(71건), 각 태그의 접근성 속성과 참조하는 스타일 정의를 읽어 분류했다. 공용 컴포넌트는 호출 위치를 따로 셌다.
- 이 문서는 조사만 담는다. `공용화 대상`과 `예외 사유` 열은 단계 3에서 채운다.

## 요약

**이미 있는 공용 구현**

| 컴포넌트 | 파일 | 호출 수 | 내용 |
|---|---|---|---|
| `GoButton` | `src/kit/ui/go-button.tsx` | 28곳(11개 파일) | `variant: outline \| filled`, `size: xSmall(26) \| small(32) \| medium(38)`, `disabled`, `loading`, 400ms 중복 누름 방지, 누름 scale 애니메이션. `color`·`textColor`·`style`·`textStyle`을 호출부에서 덮어쓸 수 있다 |
| `PencilFab` | `src/kit/ui/PencilFab.tsx` | 2곳 | 64×64 원형 accent FAB |
| `EdgeHandle` | `src/agent/EdgeHandle.tsx` | 2곳 | `layout.hit` 원형 accent 아이콘 버튼 |
| `SheetHandle` | `src/ui/SheetHandle.tsx` | — | `EdgeHandle`과 스타일 정의가 같다(크기·반경·색·그림자·pressed) |
| `ProblemActionRow` | `src/kit/problem-list/ProblemActionRow.tsx` | 1곳 | `layout.hit` 원형 아이콘 버튼 묶음 |
| `Chip` (파일 내부) | `src/kit/study-note/StudyNoteForm.tsx:42` | 3곳 | 높이 32, pill, `cardMuted` → 선택 `accentSoft`. 토큰만 쓴다 |
| `Chip` (파일 내부) | `src/kit/exam-search/ExamSearchPanel.tsx:111` | 4곳 | minHeight 32, 반경 16, 테두리 → 선택 `'orange'` |

공용 `Button`이라는 이름의 컴포넌트는 없다. 공용 `Chip`도 없고, 같은 이름의 파일 내부 컴포넌트가 두 개 있다.

**집계**

| 항목 | 수 |
|---|---|
| 눌리는 요소 후보 | 71 |
| 버튼 역할 | 42 |
| 칩 역할 | 8 |
| 제외(카드·행·배경 닫기 등) | 21 |
| 인라인으로 만든 버튼(공용 컴포넌트 정의 5건 제외) | 37 |
| `accessibilityRole`이 없는 버튼 | 6 (`go-button.tsx:103`, `QuizResponseModal` 3건, 선생님 메모 닫기 2건) |

**표현 변형**

- 텍스트 버튼 높이: 26, 32, 38(`GoButton`), 32(`TimelinePanel`), 38(`TopicUnitList`), 44(`StudyNoteForm`, `PdfViewerModal`), 48(`DiaryPanel` FAB), `layout.hit`=44(`InstructionCard`, `ProfileActions`), 높이 지정 없이 padding만(`QuizResponseModal`, `ConceptLookupPanel`). 값으로는 26·32·38·44·48 다섯 가지와 padding만 준 것이고, 구현은 여덟 군데에 따로 있다.
- 주요 동작의 채움색: `colors.accent`(`InstructionCard`, `StudyNoteForm`, `DiaryPanel`), `#FF8800`(`TimelinePanel`), `#ea580c`(`QuizResponseModal`, `ConceptLookupPanel`). 3가지다. `#30B650`(`ExamSearchPanel.tsx:103`)은 `onPress` 없는 `GoButton`으로 그린 눌리지 않는 라벨이라 여기서 뺐다.
- "가자!!!" 동작 하나가 네 가지로 그려진다: `GoButton` outline(`ExamSearchPanel:93`), 채움 `#FF8800`(`TimelinePanel:205`), 흰 바탕 + `#FFC256` 2px 테두리(`TopicUnitList:74`), accent FAB(`DiaryPanel:99`).
- 칩 선택색: `'orange'`(CSS 이름, 3곳), `#ea580c`(`ConceptLookupPanel`), `colors.accentSoft`(`StudyNoteForm`), `colors.accent`(`app/welcome.tsx:119`). 4가지다.
- 칩 높이: 36(3곳), 32(2곳), padding만(3곳).
- pressed 표현: `opacity 0.6`, `opacity 0.7`, 배경색 교체(`accentPress`, `accentSoftPress`, `cardMuted`, `accentSoft`), scale 0.92, 표현 없음. `TouchableOpacity`의 기본 투명도 반응 5건을 빼면, 버튼 42건 중 눌림 표현이 없는 `Pressable`이 14건이다.

## 버튼 (42)

`현재 표현`의 값은 코드에 적힌 그대로다. `T`는 `theme` 토큰만 쓴 것, `H`는 하드코딩 값이 있는 것이다. 상태 열은 태그에 해당 처리가 있으면 적었다.

| 파일:라인 | 종류 | 역할 | 현재 표현 | 동작·상태 | 공용화 대상 | 예외 사유 |
|---|---|---|---|---|---|---|
| `src/kit/ui/go-button.tsx:103` | button | 공용 `GoButton` 본체 | 높이 26/32/38, 반경 13/16/19, outline 또는 filled, 기본색 `colors.accent` (H: 크기 수치) | disabled, loading(스피너), pressed(scale), 400ms 디바운스. role 없음 | | |
| `src/agent/InstructionCard.tsx:26` | button | 에이전트 지시 카드의 선택지(주요) | minHeight `layout.hit`, `radius.md`, `colors.accent` (T) | pressed(opacity 0.7) | | |
| `src/agent/InstructionCard.tsx:35` | button | 에이전트 지시 카드의 확인(보조) | 같은 틀, `colors.cardMuted` (T) | pressed(opacity 0.7) | | |
| `src/kit/study-note/StudyNoteForm.tsx:211` | button | 학습장 저장(주요) | minHeight 44, `radius.md`, `colors.accent`, 비활성 `cardMuted` (H: 44) | disabled | | |
| `src/kit/study-note/StudyNoteForm.tsx:208` | button | 학습장 "나중에"(텍스트) | minHeight 44, 배경 없음 (H: 44) | hitSlop | | |
| `src/kit/study-note/StudyNoteForm.tsx:183` | button | "다음 목표" 펼치기(텍스트) | 스타일 정의 없음 | expanded 상태, hitSlop | | |
| `src/kit/timeline/TimelinePanel.tsx:205` | button | 타임라인 "가자!!!"(주요) | minHeight 32, 반경 16, `#FF8800` (H) | pressed, hitSlop | | |
| `src/kit/timeline/TimelinePanel.tsx:196` | button | 타임라인 "학습장"(보조) | minHeight 32, `radius.pill`, 테두리 `lineStrong` (H: 32) | hitSlop | | |
| `src/kit/topic-panel/TopicUnitList.tsx:74` | button | 주제 단원 "가자 !!!" | minHeight 38, 반경 19, 테두리 2px `#FFC256`, 흰 바탕 (H) | pressed(opacity 0.6) | | |
| `src/kit/diary/DiaryPanel.tsx:99` | button | Diary "가자!!!" 확장 FAB | 높이 48, `radius.pill`, `colors.accent`, `shadow.float` (H: 48) | pressed(`accentPress`) | | |
| `src/kit/ui/PencilFab.tsx:8` | button | 풀이 시작 FAB | 64×64, `radius.pill`, `colors.accent`, `shadow.float` (H: 64) | pressed(`accentPress`) | | |
| `src/kit/canvas/note-canvas/topic-notebook.tsx:417` | button | 보조 풀이 FAB (데드 코드 파일) | 60×60, 반경 30, `colors.accent`, 그림자 직접 지정 (H) | — | | |
| `src/agent/EdgeHandle.tsx:15` | button | dock·drawer 닫기 손잡이 | `layout.hit` 원형, `colors.accent`, `shadow.float` (T) | pressed(`accentPress`) | | |
| `src/ui/SheetHandle.tsx:16` | button | 시트 닫기 손잡이 | `EdgeHandle`과 같은 정의 (T) | pressed(`accentPress`) | | |
| `src/kit/problem-list/ProblemActionRow.tsx:12` | button | 문제 행 아이콘 동작 | `layout.hit` 원형, 배경 없음 (T) | pressed(`accentSoft`) | | |
| `src/kit/problem-list/ProblemActionRow.tsx:15` | button | 문제 행 아이콘 동작(업로드 등) | 같은 정의 (T) | disabled, pressed | | |
| `src/host/Stage.tsx:25` | button | 책갈피/문제 목록 전환 아이콘 | 스타일 정의 없음 | pressed(opacity 0.6), hitSlop | | |
| `src/agent/tablet/ChatRail.tsx:120` | button | 세로 pill 툴바의 dock 항목(내비) | `layout.hit` 원형, 선택 `accentSoft` (T) | disabled, selected, pressed(`accentSoftPress`) | | |
| `src/agent/tablet/ChatRail.tsx:133` | button | 세로 pill 툴바의 채팅 항목 | 같은 틀, `accentSoft` (T) | selected, pressed | | |
| `src/agent/tablet/DrawerFooter.tsx:54` | button | 하단 6칸 세그먼트 (컴포넌트는 미사용, 타입만 쓰임) | minHeight `layout.footerH - space.sm`, `radius.pill` (T) | role=tab, disabled, selected, pressed, hitSlop | | |
| `src/kit/canvas/FloatingToolbar.tsx:59` | button | 캔버스 툴바 동작 버튼 | 높이 `layout.toolbarH - 8`, `radius.pill` (H: -8, 2, 1) | pressed(`accentSoftPress`) | | |
| `src/kit/canvas/FloatingToolbar.tsx:84` | button | 캔버스 툴바 도구 버튼 | 같은 틀, 선택 `accentSoft`, 비활성 opacity 0.38 (H) | disabled, selected, pressed | | |
| `src/kit/live-class/QuizResponseModal.tsx:280` | button | 퀴즈 답 보내기(주요) | padding 10/24, 반경 12, `#ea580c`, 비활성 opacity 0.6 (H) | disabled, "보내는 중..." 문구. role 없음 | | |
| `src/kit/live-class/QuizResponseModal.tsx:273` | button | 퀴즈 필기 지우기(보조) | padding 10/20, 반경 12, 테두리 `#cbd5e1`, `#f8fafc` (H) | disabled. role 없음 | | |
| `src/kit/live-class/QuizResponseModal.tsx:235` | button | 퀴즈 닫기 ✕ | padding 6, 반경 16, `#f1f5f9` (H) | disabled. role 없음 | | |
| `src/kit/concepts/ConceptLookupPanel.tsx:190` | button | 개념 설명 모달 닫기(주요) | paddingVertical 12, 반경 12, `#ea580c` (H) | — | | |
| `src/kit/ui/PdfViewerModal.tsx:67` | button | PDF 닫기(outline) | minHeight 44, minWidth 64, 반경 22, 테두리 `colors.accent` (H) | — | | |
| `src/kit/ui/PdfViewerModal.tsx:45` | button | PDF 뒤로(텍스트+아이콘) | minWidth 72, minHeight `layout.hit` (H: 72) | hitSlop | | |
| `src/kit/ui/PdfViewerModal.web.tsx:17` | button | PDF 닫기(웹 변형) | 스타일 정의 미확인 | — | | |
| `src/kit/profile/ProfileActions.tsx:53` | button | 이름 변경(텍스트) | minHeight `layout.hit`, `radius.sm` (T) | disabled, pressed(`cardMuted`) | | |
| `src/kit/profile/ProfileActions.tsx:65` | button | 프로필 이미지 변경(텍스트) | 같은 정의 (T) | disabled, pressed | | |
| `src/kit/profile/ProfileActions.tsx:74` | button | 로그아웃(텍스트) | 같은 정의 (T) | pressed | | |
| `src/kit/profile/ProfileActions.tsx:97` | button | 이름 변경 대화상자 취소 | 같은 정의 (T) | pressed | | |
| `src/kit/profile/ProfileActions.tsx:100` | button | 이름 변경 대화상자 저장 | 같은 정의 (T) | disabled, pressed | | |
| `src/kit/diary/DiaryPanel.tsx:117` | button | "풀이 목록" 뒤로(텍스트+아이콘) | 높이 `layout.hit` (T) | — | | |
| `src/kit/diary/DiaryPanel.tsx:138` | button | Diary 탭 닫기 아이콘 | 높이 100%, 음수 margin (T) | hitSlop | | |
| `src/kit/diary/RecordsCalendar.tsx:85` | button | 이전 달 화살표 | `layout.hit` 정사각 (T) | — | | |
| `src/kit/diary/RecordsCalendar.tsx:98` | button | 다음 달 화살표 | 같은 정의 (T) | — | | |
| `app/welcome.tsx:139` | button | 소셜 로그인 아이콘 | 60×60, 반경 30 (H) | disabled, 스피너, pressed(scale 0.92) | | |
| `app/welcome.tsx:129` | button | 개발 빌드용 둘러보기(텍스트) | minHeight 44 (H) | — | | |
| `src/kit/canvas/note-canvas/topic-live-canvas.tsx:684` | button | 선생님 메모 닫기 ✕ | `memoToastClose` (미확인) | hitSlop. role 없음 | | |
| `src/kit/canvas/note-canvas/hotline-class-canvas.tsx:705` | button | 선생님 메모 닫기 ✕ | `memoToastClose` (미확인) | hitSlop. role 없음 | | |

### `GoButton` 호출 위치 (28)

| 파일 | 수 | 쓰임 |
|---|---|---|
| `src/kit/script-player/PlaybackToolbar.tsx` | 6 | 재생 툴바(나가기, 내 이전 풀이 등) |
| `app/notebook.tsx` | 4 | 문제 목록 모달(교체, 닫기 등) |
| `src/kit/problem-list/ProblemListPanel.tsx` | 3 | 문제 카드 동작 |
| `src/kit/exam-search/ExamSearchPanel.tsx` | 2 | "가자!!!", `filled` + `#30B650` + `xSmall` |
| `src/kit/canvas/CanvasChrome.tsx` | 2 | 전체 지우기 확인 대화상자 |
| `src/kit/diary/DailyRecordsList.tsx` | 2 | 책갈피 추가, 답안 예시 |
| `src/kit/canvas/note-canvas/notebook.tsx` | 2 | 펜 색·굵기 선택 |
| `src/kit/canvas/note-canvas/topic-live-canvas.tsx` | 2 | 펜 색·굵기 선택 |
| `src/kit/canvas/note-canvas/hotline-class-canvas.tsx` | 2 | 펜 색·굵기 선택 |
| `src/kit/canvas/note-canvas/topic-notebook.tsx` | 2 | 펜 색·굵기 선택(데드 코드 파일) |
| `app/public-questions.tsx` | 1 | 해답 |

펜 색·굵기 선택은 버튼이 아니라 선택 견본으로 쓰인다. 단계 3에서 따로 판단한다.

## 칩 (8)

| 파일:라인 | 종류 | 역할 | 현재 표현 | 동작·상태 | 공용화 대상 | 예외 사유 |
|---|---|---|---|---|---|---|
| `src/kit/study-note/StudyNoteForm.tsx:42` | chip | 학습장 선택 칩(파일 내부 `Chip`, 3곳). 난이도·기대 선택과 힌트 삽입 | 높이 32, `radius.pill`, `cardMuted` → 선택 `accentSoft` (H: 32) | role을 prop으로 받음, selected, hitSlop | | |
| `src/kit/exam-search/ExamSearchPanel.tsx:111` | chip | 기출 검색 필터(파일 내부 `Chip`, 4곳). 과목 단일 선택, 연도·월·번호 다중 선택 | minHeight 32, minWidth 40, 반경 16, 테두리 `lineStrong`, 흰 바탕 → 선택 `'orange'` (H) | selected | | |
| `src/kit/topic-panel/TopicTabsPanel.tsx:116` | chip | 주제 탭의 과목 선택 | minHeight 36, 반경 18, 테두리 `lineStrong`, 흰 바탕 → 선택 `'orange'` (H) | selected | | |
| `src/kit/research/ResearchPanel.tsx:62` | chip | 검색 종류 탭 | minHeight 36, minWidth 64, 반경 18, `#E5E5E5` → 선택 `'orange'` (H) | role=tab, selected | | |
| `app/welcome.tsx:114` | chip | 공개 문제 분류 탭 | minHeight 36, minWidth 64, 반경 18 (H) | role=tab, selected | | |
| `src/kit/concepts/ConceptLookupPanel.tsx:88` | chip | 개념 검색 과목 선택 | padding 14/6, 반경 16, 테두리 1.5 `#fed7aa` → 선택 `#ea580c` (H) | role=tab, selected | | |
| `src/kit/concepts/ConceptLookupPanel.tsx:113` | chip | 개념 검색 단원 선택 | padding 12/6, 반경 14, 테두리 1.2 → 선택 `#ea580c` (H) | role=tab, selected | | |
| `src/kit/concepts/ConceptLookupPanel.tsx:144` | chip | 개념 항목(누르면 설명 모달) | padding 12/7, 반경 14, 테두리 1.2 `#ea580c`, 흰 바탕 (H) | role=button | | |

읽기 전용 태그로 쓰이는 눌리지 않는 칩 모양(`View` + `Text` 배지)은 이 검색으로 잡히지 않는다. 단계 3 목록화에서 `Badge`·`Tag` 모양의 `View`를 따로 조사해야 한다.

## 제외 (21)

| 파일:라인 | 이유 |
|---|---|
| `app/notebook.tsx:160` | 모달 배경 닫기 영역 |
| `app/topic-live-class.tsx:194` | 모달 배경 닫기 영역 |
| `app/hotline-class.tsx:187` | 모달 배경 닫기 영역 |
| `src/host/SheetHost.tsx:33` | 시트 scrim |
| `src/ui/Sheet.tsx:24` | 시트 scrim |
| `src/kit/canvas/CanvasChrome.tsx:113` | 대화상자 배경 닫기 영역 |
| `src/kit/profile/ProfileActions.tsx:83` | 대화상자 배경 닫기 영역 |
| `src/kit/concepts/ConceptLookupPanel.tsx:174` | 모달 배경 닫기 영역 |
| `src/kit/canvas/ToolPopover.tsx:26` | 팝오버 바깥 닫기 영역 |
| `src/ui/toast/Toast.tsx:68` | 토스트 본문 전체 |
| `src/kit/ui/toast.tsx:69` | 토스트 본문 전체(데드 코드) |
| `src/kit/problem-list/ProblemListPanel.tsx:197` | 문제 카드 전체 |
| `src/kit/topic-panel/TopicUnitList.tsx:60` | 단원 카드 전체 |
| `src/kit/topic-panel/TopicTabsPanel.tsx:90` | 개념 카드 전체 |
| `src/kit/topic-panel/TopicTabsPanel.tsx:97` | 목록 행 전체 |
| `src/agent/tablet/ChatTimeline.tsx:102` | 타임라인 카드 전체 |
| `src/kit/profile/MessageBoxPanel.tsx:146` | 메시지 카드 전체 |
| `src/kit/live-class/LiveClassListPanel.tsx:56` | 목록 행 전체 |
| `src/kit/live-class/LiveClassListPanel.tsx:73` | 목록 행 전체 |
| `src/kit/diary/RecordsCalendar.tsx:123` | 달력 날짜 칸 |
| `src/kit/diary/DiaryPanel.tsx:129` | 탭 헤더 라벨 |

후보 71 = 표 50(버튼 42 + 칩 8) + 제외 21.

## 이 조사가 잡지 못하는 것

- `Alert.alert`의 시스템 버튼(`upload_alert`, `bookmark_alert` 등)과 `HeaderBackButton`, 네이티브 헤더·탭 바 버튼. 플랫폼 고유 컨트롤이다.
- WebView 안에서 그려지는 버튼.
- 눌리지 않는 배지·태그 모양.
