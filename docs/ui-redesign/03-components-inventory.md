# 단계 3 — 공용 컴포넌트 인벤토리와 예외 대장

- 기준: `design/ui-redesign-stage3` (단계 3 컴포넌트 커밋 포함). 단계 1 조사 `01-buttons-chips-survey.md`(`76b99e3`)에서 시작했고, 그 뒤로 줄 번호가 바뀐 행은 없다.
- 검증: `node docs/ui-redesign/tools/check-inventory.mjs docs/ui-redesign/03-components-inventory.md .` — `app/`·`src/`에서 `<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button)\b`가 나오는 줄마다 §1에 행이 있어야 한다.
- 이 문서는 대상과 교체 단계를 정할 뿐이다. 사용처 교체는 Gate C 승인 뒤 단계 4(파일럿 화면)와 단계 5(나머지)에서 한다.
- `교체 단계` 4는 단계 4 파일럿 화면(채팅·rail·에이전트, 캔버스와 그 시트, dock 패널, `app/notebook.tsx`, `SheetHost`)에 그려지는 파일이고, 그 밖은 5다. `예외`는 `—`다.

## 1. 눌리는 요소

76행 = 단계 1의 71 + 단계 3 공용 컴포넌트 안의 5(`Button`·`Chip` 본체, `StateView`·`Dialog` 안의 `<Button`). 앞의 세 열은 단계 1 조사의 값이고, `(T)`는 토큰만, `(H)`는 하드코딩 값이 있는 것이다.

단계 4a 뒤 72행: 공용 컴포넌트로 옮긴 곳은 역할 열에 "4a 됨"을 적고 앞의 세 열을 지금 값으로 고쳤다. `IconButton`·`Chip`·`Dialog`로 옮겨 이 검색에 더는 잡히지 않는 9행(`ChatRail` dock 항목, `Stage` 전환, `SheetHost` scrim, `CanvasChrome` 배경, 메모 닫기 2, 퀴즈 닫기, `StudyNoteForm` 내부 Chip)은 지웠고, `notebook.tsx`의 `<Button` 3행과 `IconButton` 본체 1행을 더했다.

단계 4b 뒤 67행: dock 패널을 옮긴 곳은 "4b 됨"이다. `Chip`·`IconButton`·`Dialog`로 들어가 이 검색에 잡히지 않게 된 10행(Diary 탭 라벨·닫기, 달력 화살표 2, 검색 종류 탭, 기출 검색 내부 Chip, 이름 대화상자 배경·취소·저장, 떠 있던 Diary FAB)은 지웠고, `<Button`으로 바뀐 5행(Diary 책갈피 추가·답안 예시·문제별 가자, 기출 검색 가자·행 비우기)을 더했다. `app/` 세 파일의 줄 번호는 합친 커밋 `62095a5`로 밀린 것만 고쳤다.

| 파일:라인 | 역할 | 현재 표현 | 동작·상태 | 대상 | 예외 사유 | 교체 단계 |
|---|---|---|---|---|---|---|
| `app/hotline-class.tsx:192` | 모달 배경 닫기 영역 | — | — | 예외 | 모달 배경 닫기 영역 | — |
| `app/notebook.tsx:167` | 모달 배경 닫기 영역 | — | — | 예외 | 모달 배경 닫기 영역 | — |
| `app/notebook.tsx:221` | 문제 목록 모달 "교체". 4a 됨(GoButton → Button) | Button secondary sm (T) | Button과 같음 | Button secondary sm | — | 4 |
| `app/notebook.tsx:223` | "책갈피"/"책갈피됨". 4a 됨(GoButton → Button) | Button secondary sm (T) | 됨이면 disabled | Button secondary sm | — | 4 |
| `app/notebook.tsx:238` | 문제 목록 모달 "닫기". 4a 됨(GoButton → Button) | Button secondary sm (T) | Button과 같음 | Button secondary sm | — | 4 |
| `app/topic-live-class.tsx:199` | 모달 배경 닫기 영역 | — | — | 예외 | 모달 배경 닫기 영역 | — |
| `app/welcome.tsx:114` | 공개 문제 분류 탭. role=tab 유지 | minHeight 36, minWidth 64, 반경 18 (H) | role=tab, selected | Chip | — | 5 |
| `app/welcome.tsx:129` | 개발 빌드용 둘러보기(텍스트) | minHeight 44 (H) | — | Button text md | — | 5 |
| `app/welcome.tsx:139` | 소셜 로그인 아이콘 | 60×60, 반경 30 (H) | disabled, 스피너, pressed(scale 0.92) | 예외 | 소셜 로그인 제공사 아이콘(제공사 표시 규칙) | — |
| `src/agent/EdgeHandle.tsx:15` | dock·drawer 닫기 손잡이 | `layout.hit` 원형, `colors.accent`, `shadow.float` (T) | pressed(`accentPress`) | 예외 | 이미 공용, 모양 일치 | — |
| `src/agent/InstructionCard.tsx:27` | 에이전트 지시 카드의 선택지(첫째 주요, 나머지 보조). 4a 됨 | Button primary·secondary md (T) | Button과 같음 | Button primary md | — | 4 |
| `src/agent/InstructionCard.tsx:29` | 에이전트 지시 카드의 확인(보조). 4a 됨 | Button secondary md (T) | Button과 같음 | Button secondary md | — | 4 |
| `src/agent/tablet/ChatRail.tsx:139` | 세로 pill 툴바의 채팅 항목. dock 항목은 4a에서 `IconButton`으로 옮겨 이 검색에 잡히지 않는다 | `layout.hit` 원형, `accentSoft` (T) | selected, pressed, 읽지 않음 점 | 예외 | 학습장 아이콘 + 읽지 않음 점을 함께 그리는 채팅 항목(IconButton은 Ionicons만) | — |
| `src/agent/tablet/ChatTimeline.tsx:103` | 타임라인 카드 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(카드 전체) | — |
| `src/agent/tablet/DrawerFooter.tsx:54` | 하단 6칸 세그먼트 (컴포넌트는 미사용, 타입만 쓰임) | minHeight `layout.footerH - space.sm`, `radius.pill` (T) | role=tab, disabled, selected, pressed, hitSlop | 예외 | 데드 코드(렌더되지 않음), 정리는 별도 결정 | — |
| `src/kit/canvas/FloatingToolbar.tsx:68` | 캔버스 툴바 동작 버튼 | 높이 `layout.toolbarH - 8`, `radius.pill` (H: -8, 2, 1) | pressed(`accentSoftPress`) | 예외 | 캔버스 툴바 전용(아이콘+라벨, layout.toolbarH) | — |
| `src/kit/canvas/FloatingToolbar.tsx:93` | 캔버스 툴바 도구 버튼 | 같은 틀, 선택 `accentSoft`, 비활성 opacity 0.38 (H) | disabled, selected, pressed | 예외 | 캔버스 툴바 전용 도구(선택 상태) | — |
| `src/kit/canvas/ToolPopover.tsx:26` | 팝오버 바깥 닫기 영역 | — | — | 예외 | 팝오버 바깥 닫기 영역 | — |
| `src/kit/canvas/note-canvas/topic-notebook.tsx:417` | 보조 풀이 FAB (데드 코드 파일) | 60×60, 반경 30, `colors.accent`, 그림자 직접 지정 (H) | — | 예외 | 데드 코드, 정리는 별도 결정 | — |
| `src/kit/concepts/ConceptLookupPanel.tsx:88` | 개념 검색 과목 선택. role=tab 유지 | padding 14/6, 반경 16, 테두리 1.5 `#fed7aa` → 선택 `#ea580c` (H) | role=tab, selected | Chip | — | 5 |
| `src/kit/concepts/ConceptLookupPanel.tsx:113` | 개념 검색 단원 선택. role=tab 유지 | padding 12/6, 반경 14, 테두리 1.2 → 선택 `#ea580c` (H) | role=tab, selected | Chip | — | 5 |
| `src/kit/concepts/ConceptLookupPanel.tsx:144` | 개념 항목(누르면 설명 모달). 선택이 아니라 열기 동작. selected=false 고정 | padding 12/7, 반경 14, 테두리 1.2 `#ea580c`, 흰 바탕 (H) | role=button | Button secondary sm | — | 5 |
| `src/kit/concepts/ConceptLookupPanel.tsx:174` | 모달 배경 닫기 영역. 개념 설명 모달(concept_detail)의 배경 | — | — | 예외 | 개념 설명 모달(폭 440, 높이 620, MathJax 스크롤)은 확인 대화상자가 아니다. 단계 5에서 `Sheet`로 | — |
| `src/kit/concepts/ConceptLookupPanel.tsx:190` | 개념 설명 모달 닫기(주요). 개념 설명 모달의 닫기 | paddingVertical 12, 반경 12, `#ea580c` (H) | — | 예외 | 개념 설명 모달 안의 닫기. 모달을 `Sheet`로 옮길 때 같이 정한다 | — |
| `src/kit/diary/DailyRecordsList.tsx:115` | "책갈피 추가"(보조). 4b 됨(GoButton → Button) | Button secondary sm (T) | Button과 같음 | Button secondary sm | — | 4 |
| `src/kit/diary/DailyRecordsList.tsx:116` | "답안 예시"(보조). 4b 됨(GoButton → Button) | Button secondary sm (T) | Button과 같음 | Button secondary sm | — | 4 |
| `src/kit/diary/DailyRecordsList.tsx:133` | 문제별 "가자!!!"(주요). 떠 있던 FAB를 대신한다(세션 "Diary Dock 풀이 구분선 추가", 4b D6). 4b 됨 | Button primary sm (T) | Button과 같음 | Button primary sm | — | 4 |
| `src/kit/diary/DiaryPanel.tsx:100` | "풀이 목록" 뒤로(텍스트+아이콘). 4b 됨 | Button text md + `chevron-back` (T) | 라벨 "풀이 목록으로" | Button text md | — | 4 |
| `src/kit/diary/RecordsCalendar.tsx:112` | 달력 날짜 칸 | — | — | 예외 | 버튼이 아닌 눌리는 면(달력 날짜 칸) | — |
| `src/kit/exam-search/ExamSearchPanel.tsx:94` | 기출 검색 "가자!!!"(주요). 4b 됨(GoButton → Button) | Button primary sm (T) | Button과 같음 | Button primary sm | — | 4 |
| `src/kit/exam-search/ExamSearchPanel.tsx:109` | 연도·시행월·번호 행 "<행> 선택" — 그 행 선택을 비운다(4b D4, 새 동작). 4b 됨 | Button secondary sm + `refresh` (T) | hint "선택을 모두 지웁니다" | Button secondary sm | — | 4 |
| `src/kit/live-class/LiveClassListPanel.tsx:57` | 목록 행 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(목록 행) | — |
| `src/kit/live-class/LiveClassListPanel.tsx:74` | 목록 행 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(목록 행) | — |
| `src/kit/live-class/QuizResponseModal.tsx:268` | 퀴즈 필기 지우기(보조). 4a 됨 | Button secondary md (T) | 보내는 중 disabled | Button secondary md | — | 4 |
| `src/kit/live-class/QuizResponseModal.tsx:270` | 퀴즈 답 보내기(주요). 4a 됨, "보내는 중..." → loading | Button primary md (T) | loading | Button primary md | — | 4 |
| `src/kit/problem-list/ProblemActionRow.tsx:12` | 문제 행 아이콘 동작 | `layout.hit` 원형, 배경 없음 (T) | pressed(`accentSoft`) | 예외 | 아이콘 전용 동작(Gate C Q5) | — |
| `src/kit/problem-list/ProblemActionRow.tsx:15` | 문제 행 아이콘 동작(업로드 등) | 같은 정의 (T) | disabled, pressed | 예외 | 아이콘 전용 동작(Gate C Q5) | — |
| `src/kit/problem-list/ProblemListPanel.tsx:197` | 문제 카드 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(문제 카드) | — |
| `src/kit/profile/MessageBoxPanel.tsx:146` | 메시지 카드 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(메시지 카드) | — |
| `src/kit/profile/ProfileActions.tsx:58` | 이름 변경(텍스트). 4b 됨, 밑줄 없음. 이름 대화상자는 `Dialog`(배경·취소·저장 3행은 Dialog 안으로 들어가 지웠다) | Button text md (T) | busy면 disabled | Button text md | — | 4 |
| `src/kit/profile/ProfileActions.tsx:68` | 프로필 이미지 변경(텍스트). 4b 됨 | Button text md (T) | busy면 disabled | Button text md | — | 4 |
| `src/kit/profile/ProfileActions.tsx:76` | 로그아웃. 구분선 뒤 마지막, 위험 톤(Gate C Q6). 4b 됨 | Button text md `tone="danger"` (T) | Button과 같음 | Button text md | — | 4 |
| `src/kit/study-note/StudyNoteForm.tsx:164` | "다음 목표" 펼치기(텍스트). 4a 됨 | Button text sm (T) | expanded 상태(Button `expanded`) | Button text sm | — | 4 |
| `src/kit/study-note/StudyNoteForm.tsx:189` | 학습장 "나중에"(텍스트). 4a 됨 | Button text md (T) | Button과 같음 | Button text md | — | 4 |
| `src/kit/study-note/StudyNoteForm.tsx:190` | 학습장 저장(주요). 4a 됨 | Button primary md (T) | disabled | Button primary md | — | 4 |
| `src/kit/timeline/TimelinePanel.tsx:232` | 타임라인 "학습장"(보조). 4b 됨 | Button secondary sm (T) | 라벨 "<제목> 학습장"(이모지 뗀 제목) | Button secondary sm | — | 4 |
| `src/kit/timeline/TimelinePanel.tsx:234` | 타임라인 "가자!!!"(주요). 4b 됨 | Button primary sm (T) | 라벨 "<제목> 학습하기" | Button primary sm | — | 4 |
| `src/kit/topic-panel/TopicTabsPanel.tsx:90` | 개념 카드 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(개념 카드) | — |
| `src/kit/topic-panel/TopicTabsPanel.tsx:97` | 목록 행 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(목록 행) | — |
| `src/kit/topic-panel/TopicTabsPanel.tsx:116` | 주제 탭의 과목 선택 | minHeight 36, 반경 18, 테두리 `lineStrong`, 흰 바탕 → 선택 `'orange'` (H) | selected | Chip | — | 5 |
| `src/kit/topic-panel/TopicUnitList.tsx:60` | 단원 카드 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(단원 카드) | — |
| `src/kit/topic-panel/TopicUnitList.tsx:74` | 주제 단원 "가자 !!!". "가자 !!!", #FFC256 테두리 → accent | minHeight 38, 반경 19, 테두리 2px `#FFC256`, 흰 바탕 (H) | pressed(opacity 0.6) | Button primary sm | — | 5 |
| `src/kit/ui/PdfViewerModal.tsx:45` | PDF 뒤로(텍스트+아이콘). icon 사용 | minWidth 72, minHeight `layout.hit` (H: 72) | hitSlop | Button text md | — | 5 |
| `src/kit/ui/PdfViewerModal.tsx:67` | PDF 닫기(outline) | minHeight 44, minWidth 64, 반경 22, 테두리 `colors.accent` (H) | — | Button secondary md | — | 5 |
| `src/kit/ui/PdfViewerModal.web.tsx:17` | PDF 닫기(웹 변형) | 스타일 정의 미확인 | — | Button secondary md | — | 5 |
| `src/kit/ui/PencilFab.tsx:8` | 풀이 시작 FAB | 64×64, `radius.pill`, `colors.accent`, `shadow.float` (H: 64) | pressed(`accentPress`) | 예외 | 이미 공용 FAB(64×64), 모양 일치 | — |
| `src/kit/ui/go-button.tsx:103` | 공용 `GoButton` 본체 | 높이 26/32/38, 반경 13/16/19, outline 또는 filled, 기본색 `colors.accent` (H: 크기 수치) | disabled, loading(스피너), pressed(scale), 400ms 디바운스. role 없음 | 예외 | GoButton 본체. 사용처를 옮긴 뒤(단계 5) 삭제 | — |
| `src/kit/ui/toast.tsx:69` | 토스트 본문 전체(데드 코드) | — | — | 예외 | 데드 코드, 정리는 별도 결정 | — |
| `src/ui/Button.tsx:132` | 공용 Button 본체 | theme 토큰만 (T) | disabled, busy, expanded, pressed, 400ms 디바운스 | 예외 | 공용 Button 본체 | — |
| `src/ui/Chip.tsx:19` | 공용 Chip 본체 | theme 토큰만 (T) | selected, disabled, pressed | 예외 | 공용 Chip 본체 | — |
| `src/ui/IconButton.tsx:44` | 공용 IconButton 본체(단계 4a). rail dock 항목, Stage 전환, 메모·퀴즈 닫기 ✕가 쓴다 | theme 토큰만 (T) | selected, disabled, pressed, sm은 hitSlop | 예외 | 공용 IconButton 본체 | — |
| `src/ui/Dialog.tsx:48` | Dialog 취소 | Button secondary md (T) | Button과 같음, 확인 중 disabled | 예외 | 공용 Dialog 안의 공용 Button(이미 공용) | — |
| `src/ui/Dialog.tsx:50` | Dialog 확인 | Button primary·danger md (T) | Button과 같음 | 예외 | 공용 Dialog 안의 공용 Button(이미 공용) | — |
| `src/ui/Sheet.tsx:24` | 시트 scrim | — | — | 예외 | Sheet scrim(Dialog가 그대로 쓴다) | — |
| `src/ui/SheetHandle.tsx:16` | 시트 닫기 손잡이 | `EdgeHandle`과 같은 정의 (T) | pressed(`accentPress`) | 예외 | 이미 공용, EdgeHandle과 같은 정의 | — |
| `src/ui/StateView.tsx:25` | StateView 동작 | Button primary·secondary md (T) | Button과 같음 | 예외 | 공용 StateView 안의 공용 Button(이미 공용) | — |
| `src/ui/toast/Toast.tsx:68` | 토스트 본문 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(토스트 본문) | — |

### 1.1 `GoButton` 호출 (18)

`<GoButton`은 §1의 검색에 잡히지 않아 따로 적는다(검증 스크립트 대상 아님, `rg -n "<GoButton" app src`). 단계 4a에서 `app/notebook.tsx`의 4곳(교체·책갈피 → Button, 해답/문제 → Chip, 닫기 → Button)과 `CanvasChrome`의 2곳(→ Dialog)을 옮겨 28에서 22가 됐다. 단계 4b에서 기출 검색 2곳(가자 → Button, 행 라벨 → 글자·비우기 Button)과 Diary 2곳(책갈피 추가·답안 예시 → Button)을 옮겨 18이 됐다. 합친 커밋 `62095a5`가 더한 Diary 문제별 "가자!!!"도 같은 단계에서 Button이 됐다.

| 파일:라인 | 쓰임 | 지금 | 대상 | 교체 단계 |
|---|---|---|---|---|
| `app/public-questions.tsx:93` | "해답" | outline small | Button secondary sm | 5 |
| `src/kit/problem-list/ProblemListPanel.tsx:231` | "해답"/"문제" 전환 | 보이는 쪽이 filled | Chip (selected = 해답 보는 중) | 5 |
| `src/kit/problem-list/ProblemListPanel.tsx:238` | "책갈피 해제" | outline, 색 덮어쓰기 `colors.danger` | Button danger sm (Gate C Q6) | 5 |
| `src/kit/problem-list/ProblemListPanel.tsx:247` | "책갈피"/"책갈피됨" | 됨이면 filled + disabled | Button secondary sm (됨: disabled) | 5 |
| `src/kit/script-player/PlaybackToolbar.tsx:52` | "나가기" | outline small | Button secondary sm | 5 |
| `src/kit/script-player/PlaybackToolbar.tsx:53` | "내 이전 풀이" | outline small | Button secondary sm | 5 |
| `src/kit/script-player/PlaybackToolbar.tsx:54` | 구간 재생("⏩ a >> b") | outline small, 이모지 | Button secondary sm + Ionicons (이모지 제거, D-08) | 5 |
| `src/kit/script-player/PlaybackToolbar.tsx:61` | 다시 재생("n / m") | outline small | Button secondary sm | 5 |
| `src/kit/script-player/PlaybackToolbar.tsx:68` | 뒤로("◀️") | outline small, 이모지만 | 예외 — 아이콘 전용(Gate C Q5) | — |
| `src/kit/script-player/PlaybackToolbar.tsx:75` | 앞으로("▶️") | outline small, 이모지만 | 예외 — 아이콘 전용(Gate C Q5) | — |
| `src/kit/canvas/note-canvas/notebook.tsx:104` | 펜 색 견본(라벨 = 저장값) | outline small | 예외 — 잉크 색 사용자 데이터·선택 견본. 표시 라벨만 단계 4에서 한국어로(Gate B Q6) | — |
| `src/kit/canvas/note-canvas/notebook.tsx:115` | 펜 굵기 견본 | outline small | 예외 — 선택 견본 | — |
| `src/kit/canvas/note-canvas/topic-live-canvas.tsx:524` | 펜 색 견본 | outline small | 예외 — 잉크 색 사용자 데이터·선택 견본 | — |
| `src/kit/canvas/note-canvas/topic-live-canvas.tsx:538` | 펜 굵기 견본 | outline small | 예외 — 선택 견본 | — |
| `src/kit/canvas/note-canvas/hotline-class-canvas.tsx:546` | 펜 색 견본 | outline small | 예외 — 잉크 색 사용자 데이터·선택 견본 | — |
| `src/kit/canvas/note-canvas/hotline-class-canvas.tsx:560` | 펜 굵기 견본 | outline small | 예외 — 선택 견본 | — |
| `src/kit/canvas/note-canvas/topic-notebook.tsx:296` | 펜 색 견본(데드 코드 파일) | outline small | 예외 — 데드 코드 | — |
| `src/kit/canvas/note-canvas/topic-notebook.tsx:307` | 펜 굵기 견본(데드 코드 파일) | outline small | 예외 — 데드 코드 | — |

## 2. 읽기 전용 배지

방법: `rg -n -i "(badge|tag|pill)\w*\s*:" app src`의 결과를 읽어 화면에 그려지는 눌리지 않는 배지만 남겼다(나머지는 데이터 필드 이름이다).

| 파일:라인 | 모양 | 반복 |
|---|---|---|
| `src/kit/live-class/LiveClassListPanel.tsx` | 숫자 배지. 4b 됨 → `Tag tone="unread"` | 숫자 배지 2곳 |
| `src/kit/diary/RecordsCalendar.tsx` | 숫자 배지(달력 날짜 위). 4b 됨 → `Tag tone="unread"`(오른쪽 위에 겹치는 자리만 감싸개가 정한다) | 숫자 배지 2곳 |
| `src/agent/tablet/ChatTimeline.tsx:126` | 글자 태그 "일간 정리" 등: `type.caption`, `accentText` on `accentSoft` (T) | 글자 태그 2곳 |
| `src/kit/concepts/ConceptLookupPanel.tsx:240` | 글자 태그(개념 설명): 12 bold `#ea580c` (H) | 글자 태그 2곳 |

결론: 숫자 배지와 글자 태그가 각각 두 파일에서 따로 구현돼 있다. 읽기 전용 `Tag`(글자·숫자 두 모양)를 단계 4에서 더할지 Gate C에서 묻는다(Q7). 이 단계에서는 만들지 않는다.

## 3. 글자 크기

`rg -n "fontSize:\s*\d" app src` = **69줄**(진단 §7의 63건은 `.tsx`만 센 값이고, 여기는 `.ts`의 스타일 파일을 포함한다). 아래 표도 69행이다.

대응 규칙: 10·11 → `caption`·`tabLabel`(11은 `tabLabel`, 10은 가장 작은 본문 토큰 `caption`), 12 → `caption`, 13–14 → `body`(굵기 600 미만) 또는 `bodyStrong`, 15–17 → `title`, 18–22 → `heading`, 22 초과 → 예외. 굵기 열의 `—`는 같은 줄에 `fontWeight`가 없는 것이다(다른 줄에 있을 수 있어 교체 때 다시 본다).

| 파일:라인 | 값 | 굵기 | 토큰 |
|---|---|---|---|
| `app/hotline-class.tsx:255` | 12 | — | caption |
| `app/hotline-class.tsx:267` | 14 | bold | bodyStrong |
| `app/topic-live-class.tsx:263` | 12 | — | caption |
| `app/topic-live-class.tsx:275` | 14 | bold | bodyStrong |
| `src/kit/concepts/ConceptLookupPanel.tsx:208` | 13 | 600 | bodyStrong |
| `src/kit/concepts/ConceptLookupPanel.tsx:215` | 12 | 700 | caption |
| `src/kit/concepts/ConceptLookupPanel.tsx:217` | 12 | 600 | caption |
| `src/kit/concepts/ConceptLookupPanel.tsx:235` | 12 | — | caption |
| `src/kit/concepts/ConceptLookupPanel.tsx:236` | 12 | — | caption |
| `src/kit/concepts/ConceptLookupPanel.tsx:240` | 12 | 700 | caption |
| `src/kit/concepts/ConceptLookupPanel.tsx:243` | 14 | 700 | bodyStrong |
| `src/kit/exam-search/ExamSearchPanel.tsx:125` | 14 | — | body |
| `src/kit/exam-search/ExamSearchPanel.tsx:127` | 14 | — | body |
| `src/kit/problem-list/ProblemListPanel.tsx:276` | 16 | 700 | title |
| `src/kit/problem-list/ProblemListPanel.tsx:277` | 14 | 700 | bodyStrong |
| `src/kit/problem-list/ProblemListPanel.tsx:297` | 13 | 500 | body |
| `src/kit/problem-list/ProblemListPanel.tsx:323` | 14 | — | body |
| `src/ui/theme.ts:85` | 12 | 400 | caption |
| `src/ui/theme.ts:86` | 14 | 400 | body |
| `src/ui/theme.ts:87` | 14 | 600 | bodyStrong |
| `src/ui/theme.ts:88` | 16 | 600 | title |
| `src/ui/theme.ts:89` | 20 | 700 | heading |
| `src/ui/theme.ts:91` | 11 | 600 | tabLabel |
| `src/kit/diary/RecordsCalendar.tsx:167` | 15 | — | title |
| `src/kit/diary/RecordsCalendar.tsx:170` | 16 | bold | title |
| `src/kit/diary/RecordsCalendar.tsx:176` | 14 | — | body |
| `src/kit/diary/RecordsCalendar.tsx:190` | 11 | bold | tabLabel |
| `src/kit/diary/DiaryPanel.tsx:171` | 15 | 700 | title |
| `src/kit/canvas/FloatingToolbar.tsx:154` | 10 | — | caption |
| `src/kit/notices/NoticesPanel.tsx:142` | 18 | 700 | heading |
| `src/kit/notices/NoticesPanel.tsx:144` | 14 | — | body |
| `src/kit/notices/NoticesPanel.tsx:145` | 16 | 700 | title |
| `src/kit/notices/NoticesPanel.tsx:146` | 12 | — | caption |
| `src/kit/notices/NoticesPanel.tsx:149` | 14 | — | body |
| `src/kit/math/MathJaxWrapper.tsx:349` | 12 | — | caption |
| `src/kit/live-class/QuizResponseModal.tsx:332` | 20 | — | heading |
| `src/kit/live-class/QuizResponseModal.tsx:342` | 16 | — | title |
| `src/kit/live-class/QuizResponseModal.tsx:392` | 15 | — | title |
| `src/kit/live-class/QuizResponseModal.tsx:406` | 15 | — | title |
| `src/kit/ui/toast.tsx:113` | 16 | — | title |
| `src/kit/research/ResearchPanel.tsx:97` | 14 | — | body |
| `src/kit/topic-panel/TopicUnitList.tsx:92` | 16 | 700 | title |
| `src/kit/topic-panel/TopicUnitList.tsx:95` | 13 | 500 | body |
| `src/kit/topic-panel/TopicUnitList.tsx:98` | 16 | 600 | title |
| `src/kit/topic-panel/TopicUnitList.tsx:99` | 14 | — | body |
| `src/kit/topic-panel/TopicTabsPanel.tsx:173` | 14 | — | body |
| `src/kit/topic-panel/TopicTabsPanel.tsx:178` | 15 | 500 | title |
| `src/kit/topic-panel/TopicTabsPanel.tsx:179` | 13 | — | body |
| `src/kit/topic-panel/TopicTabsPanel.tsx:180` | 24 | — | 예외 (22 초과, 표시용 숫자 등. 단계 4·5에서 판단) |
| `src/kit/topic-panel/TopicTabsPanel.tsx:182` | 18 | 700 | heading |
| `src/kit/topic-panel/TopicTabsPanel.tsx:185` | 14 | — | body |
| `src/kit/profile/MyInfoPanel.tsx:35` | 18 | 600 | heading |
| `src/kit/profile/MyInfoPanel.tsx:36` | 14 | — | body |
| `src/kit/profile/MyInfoPanel.tsx:37` | 12 | — | caption |
| `src/kit/ui/go-button.tsx:35` | 12 | — | caption |
| `src/kit/ui/go-button.tsx:36` | 14 | — | body |
| `src/kit/ui/go-button.tsx:37` | 16 | — | title |
| `src/kit/profile/MessageBoxPanel.tsx:170` | 16 | 700 | title |
| `src/kit/profile/MessageBoxPanel.tsx:172` | 18 | 700 | heading |
| `src/kit/profile/MessageBoxPanel.tsx:173` | 14 | — | body |
| `src/kit/profile/MessageBoxPanel.tsx:174` | 14 | — | body |
| `src/kit/profile/MessageBoxPanel.tsx:177` | 11 | — | tabLabel |
| `src/kit/profile/MessageBoxPanel.tsx:182` | 14 | — | body |
| `src/kit/timeline/TimelinePanel.tsx:223` | 18 | 700 | heading |
| `src/kit/timeline/TimelinePanel.tsx:224` | 14 | 700 | bodyStrong |
| `src/kit/timeline/TimelinePanel.tsx:225` | 14 | — | body |
| `src/kit/timeline/TimelinePanel.tsx:226` | 12 | — | caption |
| `src/kit/timeline/TimelinePanel.tsx:240` | 14 | 700 | bodyStrong |
| `src/kit/timeline/TimelinePanel.tsx:243` | 14 | — | body |

## 4. 팔레트 밖 UI 색

`app/`·`src/`의 `.ts`·`.tsx`에서 `#` 16진 색과 이름 색(`'orange'` 등)을 모두 찾아 나눈 것이다(`src/ui/theme.ts` 자신은 뺀다). 새 토큰을 만들지 않고 기존 토큰으로 바꾼다. 교체 단계는 그 파일이 §1에서 받은 단계를 따른다.

단계 4a 됨: 아래 표에서 `QuizResponseModal`(UI 스타일), `app/hotline-class`·`app/topic-live-class`(토스트·저장 문구·모달 바탕), `app/notebook`(목록 모달 바탕·그림자), `CanvasChrome`(그림자)의 값은 토큰으로 옮겼다. 이 파일들에 남은 것은 §4.4의 값뿐이다: `QuizResponseModal`의 WebView 문자열(`#ffffff`, `#111827`)과 `MathJaxWrapper color="#1e293b"`, 메모 `MathJaxWrapper color="#ea580c"` 2곳, 잉크 색과 견본 글자. 아래 표의 행은 단계 1 기준 값이라 그대로 둔다. 다시 만드는 명령:

```bash
grep -rnoE "#[0-9a-fA-F]{3,8}\b|'(tomato|red|blue|gray|grey|orange|white|black|green|yellow|purple|pink)'" app src --include=*.tsx --include=*.ts | grep -v src/ui/theme.ts
```

### 4.1 팔레트와 같은 값을 글자로 쓴 곳

값은 이미 맞다. 이름(토큰)으로만 바꾼다.

| 값 | 쓰는 곳 | 토큰 |
|---|---|---|
| `#FFFFFF`·`#FFF`·`#fff`·`#ffffff` (UI 바탕) | `public-questions`, `public-solution`, `welcome`, `hotline-class:269`, `notebook:302`, `DailyRecordsList`, `RecordsCalendar:153`, `ExamSearchPanel`, `NoticesPanel`, `ProblemListPanel`, `MessageBoxPanel`, `MyInfoPanel`, `ResearchPanel`, `TimelinePanel`, `TopicTabsPanel`, `TopicUnitList`, `PdfViewerModal`(+`.web`), `QFlatlist`, `loading-view/index`, `ConceptLookupPanel`, `QuizResponseModal`, `TabletLaunchOverlay` | 바탕 → `colors.card`, 채운 버튼·배지 위 글자 → `colors.onAccent` |
| `#18181B` (gray 900) | `ExamSearchPanel`, `NoticesPanel`, `ProblemListPanel`, `MessageBoxPanel`, `MyInfoPanel`, `ResearchPanel`, `TimelinePanel` ×2, `TopicTabsPanel` ×2, `TopicUnitList` | `colors.text` |
| `#52525B` (gray 600, 이 단계 토큰 없음) | `NoticesPanel` ×2, `ProblemListPanel` ×2, `MessageBoxPanel`, `MyInfoPanel`, `TimelinePanel`, `TopicTabsPanel` ×3, `TopicUnitList` ×2 | `colors.subtle`(gray 700, 한 단계 진하다) |
| `#E4E4E7` (gray 200) | `ProblemListPanel`, `MyInfoPanel`, `TopicTabsPanel`, `SkeletonCards` ×2 | `colors.line` |
| `#D4D4D8` (gray 300) | `ExamSearchPanel`, `TopicTabsPanel`, `TopicUnitList` | `colors.lineStrong` |
| `#ea580c` (brand 600) | `QuizResponseModal` ×2, `ConceptLookupPanel` ×9, `hotline-class-canvas:708`, `topic-live-canvas:687` | 채움·선택 → `colors.accentPress`가 아니라 `colors.accent`(주요 채움), 글자 → `colors.accentText` |
| `#fed7aa` (brand 200) | `ConceptLookupPanel` ×4 | 테두리 → `colors.line`, 칩 → `Chip` |
| `#fff7ed` (brand 50) | `ConceptLookupPanel` ×3 | `colors.accentSoft` |
| `'#000'`·`'#000000'` 그림자 | `app/notebook:306`, `CanvasChrome`, `QFlatlist`, `global-overlay`, `QuizResponseModal:319` (`toast:99`는 데드 코드) | `shadow.sm`·`shadow.md` 통째로(그림자 값 묶음이 이미 토큰이다) |

### 4.2 팔레트 밖 값

| 값 | 쓰는 곳 | 대체 토큰 |
|---|---|---|
| `#FF8800` | `TimelinePanel:239` | `colors.accent` (주요 버튼 채움) |
| `#FFC256` | `TopicUnitList:97` | `Button primary`로 바뀌며 사라진다 |
| `#30B650` | `ExamSearchPanel:103` | 없앤다(라벨이 글자가 된다, §1.1) |
| `#D35400`, `#B45309`, `#9a3412` (진한 주황 글자) | `TimelinePanel:210`, `ExamSearchPanel:127`, `ConceptLookupPanel:215` | `colors.accentText` |
| `#FFE5CC` | `NoticesPanel:148`, `MessageBoxPanel:181`, `TimelinePanel:242` | `colors.accentSoftPress` |
| `#FFF3E6`, `#FFFDF9` (옅은 주황 바탕) | `SkeletonCards:71`, `ProblemListPanel:290` | `colors.accentSoft` |
| `#000000` (글자·밑줄) | `RecordsCalendar:167`, `:170`, `:176`, `MessageBoxPanel:173`, `:177`, `ProfileActions:123`, `TimelinePanel:223` | `colors.text` |
| `#212121`, `#111827`, `#1f2937`, `#1e293b` | `NoticesPanel:145`, `QuizResponseModal:64`, `ConceptLookupPanel:185`, `QuizResponseModal:249` | `colors.text` |
| `#475569`, `#4b5563` | `QuizResponseModal:394`, `ConceptLookupPanel:213` | `colors.subtle` |
| `#64748b`, `#6b7280` | `QuizResponseModal:343`, `ConceptLookupPanel:235` | `colors.muted` |
| `#9ca3af` | `ConceptLookupPanel:236` | `colors.disabled` |
| `#607D8B` (구분선) | `DailyRecordsList:200` | `colors.line` |
| `#E5E5E5`, `#E5E7EB` | `welcome:119`, `ResearchPanel:93`, `:95`, `skeleton-placeholder:56` | 칩 비선택 바탕 → `colors.cardMuted`, 스켈레톤 → `colors.line`(`SkeletonCards`와 같게) |
| `#f1f5f9`, `#cbd5e1`, `#f8fafc` (slate) | `QuizResponseModal` ×2, ×2, ×1 | `colors.cardMuted`, `colors.lineStrong`, `colors.bg` |
| `#f3f4f6`, `#F4F4F5` | `ConceptLookupPanel:241`, `PdfViewerModal:85` | `colors.cardMuted`, `colors.bg` |
| `#F5F5F5` (카드 테두리) | `public-questions:110` | `colors.line` |

### 4.3 이름 색(UI 스타일)

| 값 | 쓰는 곳 | 대체 토큰 |
|---|---|---|
| `'orange'` (13줄) | `RecordsCalendar:164`, `:178`, `ExamSearchPanel:124`, `NoticesPanel:142`, `ProblemListPanel:277`, `MessageBoxPanel:172`, `ResearchPanel:93`, `:96`, `TimelinePanel:224`, `TopicTabsPanel:172`, `:182`, `QFlatlist:104`, `loading-view/index:11`(`LOGO_COLOR`) | `colors.accent`(채움·테두리·로고) 또는 `colors.accentText`(글자). **잉크 색 `'orange'`과 다르다**: §4.4 |
| `'tomato'` (개수 배지) | `RecordsCalendar:186` | `colors.unread` |
| `'red'` (답장 글자) | `MessageBoxPanel:174` | `colors.danger` |
| `'blue'` (기록 있는 날 테두리) | `RecordsCalendar:173` | `colors.accent` |
| `'gray'` | `RecordsCalendar:177`(다른 달 날짜), `math-web-view:87`(WebView 바탕) | `colors.muted`, `colors.cardMuted` |
| `'white'` | `hotline-class:267`, `topic-live-class:275`(토스트 글자), `QuizResponseModal:351`, `screen-wrapper:60`, `:70`, `:74` | 글자 → `colors.onAccent`, 바탕 → `colors.card` |

### 4.4 바꾸지 않는 값

| 값 | 쓰는 곳 | 이유 |
|---|---|---|
| 잉크 색 `'orange'`, `'blue'`, `'black'`, `'red'`, `'green'`과 견본 글자 `'white'`·`'black'` | `canvas-utils:17`, `hotline-class-canvas`, `topic-live-canvas`, `note-canvas/notebook`, `FloatingToolbar:21` | MMKV·서버에 저장되는 사용자 데이터다(§5) |
| WebView·HTML 문자열 안의 색 | `MathJaxWrapper.tsx`(`#ea580c` ×4, `#fed7aa`, `#fff7ed`, `#ffffff` ×4, `#1f2937` ×3, `#f9fafb`, `#9ca3af`), `math/templates/*.ts`(`#333`, `#fff`), `canvas/templates/topic-canvas-template.ts`(`#0000FF`, `#FFA500`, `#FFFFFF` ×2, `'white'`) | RN 토큰을 바로 쓸 수 없다. 토큰 값을 문자열로 넣는 방식은 단계 5에서 정한다. `#0000FF`·`#FFA500`·`'white'`는 캔버스 애니메이션 데이터 색일 수 있어 그때 확인한다 |
| 데드 코드 | `topic-notebook.tsx`(`'white'` ×6, `#f5f5f5`, 잉크 색), `kit/ui/toast.tsx`(`#000`, `'white'`) | 정리는 별도 결정(진단 §5) |

## 5. 예외 대장

§1의 `예외` 44행과 §1.1의 예외 10행을 사유별로 모은 것이다.

| 사유 | 행 | 처리 |
|---|---|---|
| 버튼이 아닌 눌리는 면(카드·행·달력 칸·토스트 본문) | §1: `ChatTimeline:102`, `LiveClassListPanel:56`, `:73`, `ProblemListPanel:197`, `MessageBoxPanel:146`, `TopicTabsPanel:90`, `:97`, `TopicUnitList:60`, `RecordsCalendar:123`, `Toast:68` | 그대로. 카드 눌림 표현은 카드 규칙(`03-tokens-components.md` §4)에서 다룬다 |
| 배경·바깥 닫기 영역, scrim | §1: `app/notebook:160`, `topic-live-class:194`, `hotline-class:187`, `ToolPopover:26`, `SheetHost:33`, `Sheet:24` | 그대로. `SheetHost` scrim은 Gate B Q5로 단계 4에서 없앤다. 대화상자의 배경 2곳은 `Dialog` 대상이라 예외가 아니다 |
| 아이콘 전용 버튼 | §1: `ChatRail:139`(채팅 항목), `ProblemActionRow:12`, `:15`. §1.1: `PlaybackToolbar:68`, `:75` | 공용 `Button`은 제목이 필수라 담지 못한다. 단계 4a에서 공용 `IconButton`을 더해 rail dock 항목·`Stage` 전환·퀴즈 닫기·메모 닫기 2곳을 옮겼고, role 없던 3곳(퀴즈 닫기, 메모 닫기 2)은 role과 라벨을 얻었다. 단계 4b에서 Diary 탭 닫기(`IconButton sm`)와 달력 이전·다음 달(`IconButton md`)을 옮겼다. 남은 곳은 단계 5에서 옮긴다 |
| 이미 공용이고 모양이 같다 | §1: `PencilFab:8`, `EdgeHandle:15`, `SheetHandle:16` | 그대로 |
| 전용 컨트롤 | §1: `FloatingToolbar:59`, `:84`(캔버스 툴바), `welcome:139`(소셜 로그인 제공사 아이콘) | 그대로 |
| 잉크 색·굵기 견본 | §1.1: 펜 색·굵기 `GoButton` 6곳(데드 코드 파일의 2곳은 아래 데드 코드 행) | 저장값 `orange, blue, black, red, green`은 사용자 데이터라 바꾸지 않는다. 표시 라벨만 한국어로(Gate B Q6, 단계 4) |
| 확인 대화상자가 아닌 모달 | §1: `ConceptLookupPanel:174`, `:190`(개념 설명 모달) | 단계 5에서 `Sheet`로 옮긴다(Gate C Q4) |
| 데드 코드 | §1: `DrawerFooter:54`, `topic-notebook:417`, `kit/ui/toast:69`. §1.1: `topic-notebook:296`, `:307` | 정리는 별도 결정(진단 §5) |
| 공용 컴포넌트 자신 | §1: `go-button:103`(단계 5 뒤 삭제), `ui/Button:112`, `ui/Chip:19`, `ui/Dialog:48`, `:50`, `ui/StateView:25` | 그대로 |
