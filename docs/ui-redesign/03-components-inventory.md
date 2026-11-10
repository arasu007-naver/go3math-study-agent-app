# 단계 3 — 공용 컴포넌트 인벤토리와 예외 대장

- 기준: `design/ui-redesign-stage3` (단계 3 컴포넌트 커밋 포함). 단계 1 조사 `01-buttons-chips-survey.md`(`76b99e3`)에서 시작했고, 그 뒤로 줄 번호가 바뀐 행은 없다.
- 검증: `node docs/ui-redesign/tools/check-inventory.mjs docs/ui-redesign/03-components-inventory.md .` — `app/`·`src/`에서 `<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button)\b`가 나오는 줄마다 §1에 행이 있어야 한다.
- 이 문서는 대상과 교체 단계를 정할 뿐이다. 사용처 교체는 Gate C 승인 뒤 단계 4(파일럿 화면)와 단계 5(나머지)에서 한다.
- `교체 단계` 4는 단계 4 파일럿 화면(채팅·rail·에이전트, 캔버스와 그 시트, dock 패널, `app/notebook.tsx`, `SheetHost`)에 그려지는 파일이고, 그 밖은 5다. `예외`는 `—`다.

## 1. 눌리는 요소

76행 = 단계 1의 71 + 단계 3 공용 컴포넌트 안의 5(`Button`·`Chip` 본체, `StateView`·`Dialog` 안의 `<Button`). 앞의 세 열은 단계 1 조사의 값이고, `(T)`는 토큰만, `(H)`는 하드코딩 값이 있는 것이다.

| 파일:라인 | 역할 | 현재 표현 | 동작·상태 | 대상 | 예외 사유 | 교체 단계 |
|---|---|---|---|---|---|---|
| `app/hotline-class.tsx:187` | 모달 배경 닫기 영역 | — | — | 예외 | 모달 배경 닫기 영역 | — |
| `app/notebook.tsx:160` | 모달 배경 닫기 영역 | — | — | 예외 | 모달 배경 닫기 영역 | — |
| `app/topic-live-class.tsx:194` | 모달 배경 닫기 영역 | — | — | 예외 | 모달 배경 닫기 영역 | — |
| `app/welcome.tsx:114` | 공개 문제 분류 탭. role=tab 유지 | minHeight 36, minWidth 64, 반경 18 (H) | role=tab, selected | Chip | — | 5 |
| `app/welcome.tsx:129` | 개발 빌드용 둘러보기(텍스트) | minHeight 44 (H) | — | Button text md | — | 5 |
| `app/welcome.tsx:139` | 소셜 로그인 아이콘 | 60×60, 반경 30 (H) | disabled, 스피너, pressed(scale 0.92) | 예외 | 소셜 로그인 제공사 아이콘(제공사 표시 규칙) | — |
| `src/agent/EdgeHandle.tsx:15` | dock·drawer 닫기 손잡이 | `layout.hit` 원형, `colors.accent`, `shadow.float` (T) | pressed(`accentPress`) | 예외 | 이미 공용, 모양 일치 | — |
| `src/agent/InstructionCard.tsx:26` | 에이전트 지시 카드의 선택지(주요) | minHeight `layout.hit`, `radius.md`, `colors.accent` (T) | pressed(opacity 0.7) | Button primary md | — | 4 |
| `src/agent/InstructionCard.tsx:35` | 에이전트 지시 카드의 확인(보조) | 같은 틀, `colors.cardMuted` (T) | pressed(opacity 0.7) | Button secondary md | — | 4 |
| `src/agent/tablet/ChatRail.tsx:120` | 세로 pill 툴바의 dock 항목(내비) | `layout.hit` 원형, 선택 `accentSoft` (T) | disabled, selected, pressed(`accentSoftPress`) | 예외 | 아이콘 전용 내비 항목(공용 Button에 아이콘 전용 형태 없음, Gate C Q5) | — |
| `src/agent/tablet/ChatRail.tsx:133` | 세로 pill 툴바의 채팅 항목 | 같은 틀, `accentSoft` (T) | selected, pressed | 예외 | 아이콘 전용 내비 항목(Gate C Q5) | — |
| `src/agent/tablet/ChatTimeline.tsx:102` | 타임라인 카드 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(카드 전체) | — |
| `src/agent/tablet/DrawerFooter.tsx:54` | 하단 6칸 세그먼트 (컴포넌트는 미사용, 타입만 쓰임) | minHeight `layout.footerH - space.sm`, `radius.pill` (T) | role=tab, disabled, selected, pressed, hitSlop | 예외 | 데드 코드(렌더되지 않음), 정리는 별도 결정 | — |
| `src/host/SheetHost.tsx:33` | 시트 scrim | — | — | 예외 | 시트 scrim. Gate B Q5로 단계 4에서 scrim 자체를 없앤다 | — |
| `src/host/Stage.tsx:25` | 책갈피/문제 목록 전환 아이콘 | 스타일 정의 없음 | pressed(opacity 0.6), hitSlop | 예외 | 아이콘 전용 버튼(Gate C Q5) | — |
| `src/kit/canvas/CanvasChrome.tsx:113` | 대화상자 배경 닫기 영역. 전체 지우기 확인(clear_confirm)의 배경. Dialog가 Sheet scrim으로 대신한다 | — | — | Dialog | — | 4 |
| `src/kit/canvas/FloatingToolbar.tsx:59` | 캔버스 툴바 동작 버튼 | 높이 `layout.toolbarH - 8`, `radius.pill` (H: -8, 2, 1) | pressed(`accentSoftPress`) | 예외 | 캔버스 툴바 전용(아이콘+라벨, layout.toolbarH) | — |
| `src/kit/canvas/FloatingToolbar.tsx:84` | 캔버스 툴바 도구 버튼 | 같은 틀, 선택 `accentSoft`, 비활성 opacity 0.38 (H) | disabled, selected, pressed | 예외 | 캔버스 툴바 전용 도구(선택 상태) | — |
| `src/kit/canvas/ToolPopover.tsx:26` | 팝오버 바깥 닫기 영역 | — | — | 예외 | 팝오버 바깥 닫기 영역 | — |
| `src/kit/canvas/note-canvas/hotline-class-canvas.tsx:705` | 선생님 메모 닫기 ✕. role 없음은 단계 4에서 보완 | `memoToastClose` (미확인) | hitSlop. role 없음 | 예외 | 아이콘 전용 닫기 ✕(Gate C Q5) | — |
| `src/kit/canvas/note-canvas/topic-live-canvas.tsx:684` | 선생님 메모 닫기 ✕. role 없음은 단계 4에서 보완 | `memoToastClose` (미확인) | hitSlop. role 없음 | 예외 | 아이콘 전용 닫기 ✕(Gate C Q5) | — |
| `src/kit/canvas/note-canvas/topic-notebook.tsx:417` | 보조 풀이 FAB (데드 코드 파일) | 60×60, 반경 30, `colors.accent`, 그림자 직접 지정 (H) | — | 예외 | 데드 코드, 정리는 별도 결정 | — |
| `src/kit/concepts/ConceptLookupPanel.tsx:88` | 개념 검색 과목 선택. role=tab 유지 | padding 14/6, 반경 16, 테두리 1.5 `#fed7aa` → 선택 `#ea580c` (H) | role=tab, selected | Chip | — | 5 |
| `src/kit/concepts/ConceptLookupPanel.tsx:113` | 개념 검색 단원 선택. role=tab 유지 | padding 12/6, 반경 14, 테두리 1.2 → 선택 `#ea580c` (H) | role=tab, selected | Chip | — | 5 |
| `src/kit/concepts/ConceptLookupPanel.tsx:144` | 개념 항목(누르면 설명 모달). 선택이 아니라 열기 동작. selected=false 고정 | padding 12/7, 반경 14, 테두리 1.2 `#ea580c`, 흰 바탕 (H) | role=button | Chip | — | 5 |
| `src/kit/concepts/ConceptLookupPanel.tsx:174` | 모달 배경 닫기 영역. 개념 설명 모달(concept_detail)의 배경 | — | — | Dialog | — | 5 |
| `src/kit/concepts/ConceptLookupPanel.tsx:190` | 개념 설명 모달 닫기(주요). 개념 설명 모달의 닫기 → Dialog confirm | paddingVertical 12, 반경 12, `#ea580c` (H) | — | Dialog | — | 5 |
| `src/kit/diary/DiaryPanel.tsx:99` | Diary "가자!!!" 확장 FAB. "가자!!!" 네 표현 중 하나 | 높이 48, `radius.pill`, `colors.accent`, `shadow.float` (H: 48) | pressed(`accentPress`) | Button primary md | — | 4 |
| `src/kit/diary/DiaryPanel.tsx:117` | "풀이 목록" 뒤로(텍스트+아이콘). icon 사용 | 높이 `layout.hit` (T) | — | Button text md | — | 4 |
| `src/kit/diary/DiaryPanel.tsx:129` | 탭 헤더 라벨 | — | — | 예외 | 탭 헤더(세그먼트), 칩 아님 | — |
| `src/kit/diary/DiaryPanel.tsx:138` | Diary 탭 닫기 아이콘 | 높이 100%, 음수 margin (T) | hitSlop | 예외 | 아이콘 전용 닫기(Gate C Q5) | — |
| `src/kit/diary/RecordsCalendar.tsx:85` | 이전 달 화살표 | `layout.hit` 정사각 (T) | — | 예외 | 아이콘 전용 화살표(Gate C Q5) | — |
| `src/kit/diary/RecordsCalendar.tsx:98` | 다음 달 화살표 | 같은 정의 (T) | — | 예외 | 아이콘 전용 화살표(Gate C Q5) | — |
| `src/kit/diary/RecordsCalendar.tsx:123` | 달력 날짜 칸 | — | — | 예외 | 버튼이 아닌 눌리는 면(달력 날짜 칸) | — |
| `src/kit/exam-search/ExamSearchPanel.tsx:111` | 기출 검색 필터(파일 내부 `Chip`, 4곳). 과목 단일 선택, 연도·월·번호 다중 선택. 파일 내부 Chip 4곳 | minHeight 32, minWidth 40, 반경 16, 테두리 `lineStrong`, 흰 바탕 → 선택 `'orange'` (H) | selected | Chip | — | 4 |
| `src/kit/live-class/LiveClassListPanel.tsx:56` | 목록 행 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(목록 행) | — |
| `src/kit/live-class/LiveClassListPanel.tsx:73` | 목록 행 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(목록 행) | — |
| `src/kit/live-class/QuizResponseModal.tsx:235` | 퀴즈 닫기 ✕. role 없음은 단계 4에서 보완 | padding 6, 반경 16, `#f1f5f9` (H) | disabled. role 없음 | 예외 | 아이콘 전용 닫기 ✕(Gate C Q5) | — |
| `src/kit/live-class/QuizResponseModal.tsx:273` | 퀴즈 필기 지우기(보조). role 없음 → Button이 해결 | padding 10/20, 반경 12, 테두리 `#cbd5e1`, `#f8fafc` (H) | disabled. role 없음 | Button secondary md | — | 4 |
| `src/kit/live-class/QuizResponseModal.tsx:280` | 퀴즈 답 보내기(주요). "보내는 중..." → loading | padding 10/24, 반경 12, `#ea580c`, 비활성 opacity 0.6 (H) | disabled, "보내는 중..." 문구. role 없음 | Button primary md | — | 4 |
| `src/kit/problem-list/ProblemActionRow.tsx:12` | 문제 행 아이콘 동작 | `layout.hit` 원형, 배경 없음 (T) | pressed(`accentSoft`) | 예외 | 아이콘 전용 동작(Gate C Q5) | — |
| `src/kit/problem-list/ProblemActionRow.tsx:15` | 문제 행 아이콘 동작(업로드 등) | 같은 정의 (T) | disabled, pressed | 예외 | 아이콘 전용 동작(Gate C Q5) | — |
| `src/kit/problem-list/ProblemListPanel.tsx:197` | 문제 카드 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(문제 카드) | — |
| `src/kit/profile/MessageBoxPanel.tsx:146` | 메시지 카드 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(메시지 카드) | — |
| `src/kit/profile/ProfileActions.tsx:53` | 이름 변경(텍스트) | minHeight `layout.hit`, `radius.sm` (T) | disabled, pressed(`cardMuted`) | Button text md | — | 4 |
| `src/kit/profile/ProfileActions.tsx:65` | 프로필 이미지 변경(텍스트) | 같은 정의 (T) | disabled, pressed | Button text md | — | 4 |
| `src/kit/profile/ProfileActions.tsx:74` | 로그아웃(텍스트). 로그아웃. 규칙은 danger 색 text지만 API에 없음(Gate C Q6) | 같은 정의 (T) | pressed | Button text md | — | 4 |
| `src/kit/profile/ProfileActions.tsx:83` | 대화상자 배경 닫기 영역. 이름 변경 대화상자(name_edit_modal)의 배경 | — | — | Dialog | — | 4 |
| `src/kit/profile/ProfileActions.tsx:97` | 이름 변경 대화상자 취소. 대화상자 취소 → Dialog cancel | 같은 정의 (T) | pressed | Dialog | — | 4 |
| `src/kit/profile/ProfileActions.tsx:100` | 이름 변경 대화상자 저장. 대화상자 저장 → Dialog confirm | 같은 정의 (T) | disabled, pressed | Dialog | — | 4 |
| `src/kit/research/ResearchPanel.tsx:62` | 검색 종류 탭. role=tab 유지 | minHeight 36, minWidth 64, 반경 18, `#E5E5E5` → 선택 `'orange'` (H) | role=tab, selected | Chip | — | 4 |
| `src/kit/study-note/StudyNoteForm.tsx:42` | 학습장 선택 칩(파일 내부 `Chip`, 3곳). 난이도·기대 선택과 힌트 삽입. 파일 내부 Chip 3곳 | 높이 32, `radius.pill`, `cardMuted` → 선택 `accentSoft` (H: 32) | role을 prop으로 받음, selected, hitSlop | Chip | — | 4 |
| `src/kit/study-note/StudyNoteForm.tsx:183` | "다음 목표" 펼치기(텍스트) | 스타일 정의 없음 | expanded 상태, hitSlop | Button text sm | — | 4 |
| `src/kit/study-note/StudyNoteForm.tsx:208` | 학습장 "나중에"(텍스트) | minHeight 44, 배경 없음 (H: 44) | hitSlop | Button text md | — | 4 |
| `src/kit/study-note/StudyNoteForm.tsx:211` | 학습장 저장(주요) | minHeight 44, `radius.md`, `colors.accent`, 비활성 `cardMuted` (H: 44) | disabled | Button primary md | — | 4 |
| `src/kit/timeline/TimelinePanel.tsx:196` | 타임라인 "학습장"(보조) | minHeight 32, `radius.pill`, 테두리 `lineStrong` (H: 32) | hitSlop | Button secondary sm | — | 4 |
| `src/kit/timeline/TimelinePanel.tsx:205` | 타임라인 "가자!!!"(주요). "가자!!!", #FF8800 → accent | minHeight 32, 반경 16, `#FF8800` (H) | pressed, hitSlop | Button primary sm | — | 4 |
| `src/kit/topic-panel/TopicTabsPanel.tsx:90` | 개념 카드 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(개념 카드) | — |
| `src/kit/topic-panel/TopicTabsPanel.tsx:97` | 목록 행 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(목록 행) | — |
| `src/kit/topic-panel/TopicTabsPanel.tsx:116` | 주제 탭의 과목 선택 | minHeight 36, 반경 18, 테두리 `lineStrong`, 흰 바탕 → 선택 `'orange'` (H) | selected | Chip | — | 5 |
| `src/kit/topic-panel/TopicUnitList.tsx:60` | 단원 카드 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(단원 카드) | — |
| `src/kit/topic-panel/TopicUnitList.tsx:74` | 주제 단원 "가자 !!!". "가자 !!!", #FFC256 테두리 → accent | minHeight 38, 반경 19, 테두리 2px `#FFC256`, 흰 바탕 (H) | pressed(opacity 0.6) | Button primary md | — | 5 |
| `src/kit/ui/PdfViewerModal.tsx:45` | PDF 뒤로(텍스트+아이콘). icon 사용 | minWidth 72, minHeight `layout.hit` (H: 72) | hitSlop | Button text md | — | 5 |
| `src/kit/ui/PdfViewerModal.tsx:67` | PDF 닫기(outline) | minHeight 44, minWidth 64, 반경 22, 테두리 `colors.accent` (H) | — | Button secondary md | — | 5 |
| `src/kit/ui/PdfViewerModal.web.tsx:17` | PDF 닫기(웹 변형) | 스타일 정의 미확인 | — | Button secondary md | — | 5 |
| `src/kit/ui/PencilFab.tsx:8` | 풀이 시작 FAB | 64×64, `radius.pill`, `colors.accent`, `shadow.float` (H: 64) | pressed(`accentPress`) | 예외 | 이미 공용 FAB(64×64), 모양 일치 | — |
| `src/kit/ui/go-button.tsx:103` | 공용 `GoButton` 본체 | 높이 26/32/38, 반경 13/16/19, outline 또는 filled, 기본색 `colors.accent` (H: 크기 수치) | disabled, loading(스피너), pressed(scale), 400ms 디바운스. role 없음 | 예외 | GoButton 본체. 사용처를 옮긴 뒤(단계 5) 삭제 | — |
| `src/kit/ui/toast.tsx:69` | 토스트 본문 전체(데드 코드) | — | — | 예외 | 데드 코드, 정리는 별도 결정 | — |
| `src/ui/Button.tsx:99` | 공용 Button 본체 | theme 토큰만 (T) | disabled, busy, pressed, 400ms 디바운스 | 예외 | 공용 Button 본체 | — |
| `src/ui/Chip.tsx:19` | 공용 Chip 본체 | theme 토큰만 (T) | selected, disabled, pressed | 예외 | 공용 Chip 본체 | — |
| `src/ui/Dialog.tsx:32` | Dialog 취소 | Button secondary md (T) | Button과 같음 | 예외 | 공용 Dialog 안의 공용 Button(이미 공용) | — |
| `src/ui/Dialog.tsx:33` | Dialog 확인 | Button primary·danger md (T) | Button과 같음 | 예외 | 공용 Dialog 안의 공용 Button(이미 공용) | — |
| `src/ui/Sheet.tsx:24` | 시트 scrim | — | — | 예외 | Sheet scrim(Dialog가 그대로 쓴다) | — |
| `src/ui/SheetHandle.tsx:16` | 시트 닫기 손잡이 | `EdgeHandle`과 같은 정의 (T) | pressed(`accentPress`) | 예외 | 이미 공용, EdgeHandle과 같은 정의 | — |
| `src/ui/StateView.tsx:25` | StateView 동작 | Button primary·secondary md (T) | Button과 같음 | 예외 | 공용 StateView 안의 공용 Button(이미 공용) | — |
| `src/ui/toast/Toast.tsx:68` | 토스트 본문 전체 | — | — | 예외 | 버튼이 아닌 눌리는 면(토스트 본문) | — |

### 1.1 `GoButton` 호출 (28)

`<GoButton`은 §1의 검색에 잡히지 않아 따로 적는다(검증 스크립트 대상 아님, `rg -n "<GoButton" app src`).

| 파일:라인 | 쓰임 | 지금 | 대상 | 교체 단계 |
|---|---|---|---|---|
| `app/notebook.tsx:214` | 문제 목록 모달 "교체" | outline small | Button secondary sm | 4 |
| `app/notebook.tsx:216` | "책갈피"/"책갈피됨" | 됨이면 filled + disabled | Button secondary sm (됨: disabled) | 4 |
| `app/notebook.tsx:223` | "해답"/"문제" 전환 | 보이는 쪽이 filled | Chip (selected = 해답 보는 중) | 4 |
| `app/notebook.tsx:236` | 문제 목록 모달 "닫기" | outline small | Button secondary sm | 4 |
| `app/public-questions.tsx:93` | "해답" | outline small | Button secondary sm | 5 |
| `src/kit/exam-search/ExamSearchPanel.tsx:93` | "가자!!!" | outline small | Button primary md | 4 |
| `src/kit/exam-search/ExamSearchPanel.tsx:103` | "계열 선택 ->" 라벨(onPress 없음) | filled `#30B650` xSmall | 글자 (`type.bodyStrong`, `colors.subtle`) | 4 |
| `src/kit/diary/DailyRecordsList.tsx:121` | "책갈피 추가" | outline small | Button secondary sm | 4 |
| `src/kit/diary/DailyRecordsList.tsx:122` | "답안 예시" | outline small | Button secondary sm | 4 |
| `src/kit/canvas/CanvasChrome.tsx:118` | 전체 지우기 "취소" | outline small | Dialog cancel | 4 |
| `src/kit/canvas/CanvasChrome.tsx:124` | 전체 지우기 "확인" | filled small | Dialog confirm (`danger`) | 4 |
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
| `src/kit/live-class/LiveClassListPanel.tsx:118` | 숫자 배지: minWidth 24, `radius.pill`, `type.tabLabel` + `colors.card` 글자 (T) | 숫자 배지 2곳 |
| `src/kit/diary/RecordsCalendar.tsx:179` | 숫자 배지(달력 날짜 위): 글자 11/16 `#FFFFFF` bold (H) | 숫자 배지 2곳 |
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

새 토큰을 만들지 않고 기존 토큰으로 바꾼다. 교체 단계는 그 파일이 §1에서 받은 단계를 따른다.

| 값 | 쓰는 파일 | 대체 토큰 |
|---|---|---|
| `#FF8800` | `src/kit/timeline/TimelinePanel.tsx` | `colors.accent` (주요 버튼 채움) |
| `#FFC256` | `src/kit/topic-panel/TopicUnitList.tsx` | `Button primary`로 바뀌며 사라진다 |
| `#30B650` | `src/kit/exam-search/ExamSearchPanel.tsx` | 없앤다(라벨이 글자가 된다, §1.1) |
| `#ea580c` | `QuizResponseModal.tsx`, `ConceptLookupPanel.tsx`, `MathJaxWrapper.tsx`, `hotline-class-canvas.tsx`, `topic-live-canvas.tsx` | 채움·선택 → `colors.accentPress`가 아니라 `colors.accent`(주요 채움), 글자 → `colors.accentText` |
| `#fed7aa` | `ConceptLookupPanel.tsx`, `MathJaxWrapper.tsx` | `palette.brand[200]`에 같은 값이 있다. 테두리 → `colors.line`, 칩 → `Chip` |
| `#E5E5E5` | `app/welcome.tsx`, `ResearchPanel.tsx` | `colors.cardMuted` (칩 비선택 바탕) |
| `#f1f5f9`, `#cbd5e1`, `#f8fafc` (slate) | `QuizResponseModal.tsx` | `colors.cardMuted`, `colors.lineStrong`, `colors.bg` |
| `'orange'` (UI 스타일 11줄) | `RecordsCalendar.tsx`, `ResearchPanel.tsx`, `NoticesPanel.tsx`, `ProblemListPanel.tsx`, `ExamSearchPanel.tsx`, `MessageBoxPanel.tsx`, `QFlatlist.tsx`, `TopicTabsPanel.tsx`, `TimelinePanel.tsx` | `colors.accent`(채움·테두리) 또는 `colors.accentText`(글자). **잉크 색 `'orange'`과 다르다**: 아래 §5 |

`MathJaxWrapper.tsx`의 색은 WebView 안 HTML 문자열이라 RN 토큰을 바로 쓸 수 없다. 값을 토큰에서 문자열로 넣는 방식은 단계 5에서 정한다.

## 5. 예외 대장

§1의 `예외` 43행과 §1.1의 예외 10행을 사유별로 모은 것이다.

| 사유 | 행 | 처리 |
|---|---|---|
| 버튼이 아닌 눌리는 면(카드·행·달력 칸·토스트 본문) | §1: `ChatTimeline:102`, `LiveClassListPanel:56`, `:73`, `ProblemListPanel:197`, `MessageBoxPanel:146`, `TopicTabsPanel:90`, `:97`, `TopicUnitList:60`, `RecordsCalendar:123`, `Toast:68` | 그대로. 카드 눌림 표현은 카드 규칙(`03-tokens-components.md` §4)에서 다룬다 |
| 배경·바깥 닫기 영역, scrim | §1: `app/notebook:160`, `topic-live-class:194`, `hotline-class:187`, `ToolPopover:26`, `SheetHost:33`, `Sheet:24` | 그대로. `SheetHost` scrim은 Gate B Q5로 단계 4에서 없앤다. 대화상자의 배경 3곳은 `Dialog` 대상이라 예외가 아니다 |
| 아이콘 전용 버튼 | §1: `ChatRail:120`, `:133`, `Stage:25`, `DiaryPanel:138`, `RecordsCalendar:85`, `:98`, `QuizResponseModal:235`, `ProblemActionRow:12`, `:15`, 선생님 메모 닫기 2곳. §1.1: `PlaybackToolbar:68`, `:75` | 공용 `Button`은 제목이 필수라 담지 못한다. `IconButton`을 단계 4에서 더할지 Gate C Q5에서 묻는다. role 없는 3곳(퀴즈 닫기, 메모 닫기 2)은 어느 쪽이든 단계 4에서 role을 단다 |
| 이미 공용이고 모양이 같다 | §1: `PencilFab:8`, `EdgeHandle:15`, `SheetHandle:16` | 그대로 |
| 전용 컨트롤 | §1: `FloatingToolbar:59`, `:84`(캔버스 툴바), `DiaryPanel:129`(탭 헤더), `welcome:139`(소셜 로그인 제공사 아이콘) | 그대로 |
| 잉크 색·굵기 견본 | §1.1: 펜 색·굵기 `GoButton` 6곳(데드 코드 2곳 별도) | 저장값 `orange, blue, black, red, green`은 사용자 데이터라 바꾸지 않는다. 표시 라벨만 한국어로(Gate B Q6, 단계 4) |
| 데드 코드 | §1: `DrawerFooter:54`, `topic-notebook:417`, `kit/ui/toast:69`. §1.1: `topic-notebook:296`, `:307` | 정리는 별도 결정(진단 §5) |
| 공용 컴포넌트 자신 | §1: `go-button:103`(단계 5 뒤 삭제), `ui/Button:99`, `ui/Chip:19`, `ui/Dialog:32`, `:33`, `ui/StateView:25` | 그대로 |
