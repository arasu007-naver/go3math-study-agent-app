# 단계 1 — 현황 진단

Method: design review only (detector not applicable, native platform)

## 1. 요약

| 항목 | 값 |
|---|---|
| 단계 / 상태 | 단계 1 / **승인대기 (조건부)** — 실기기 캡처가 없고, 캡처에 쓴 번들이 기준 커밋과 다를 수 있다. 아래 §9 참고 |
| 기준 | `feat/study-note` @ `76b99e3`, 작업 브랜치 `design/ui-redesign` |
| 사용한 스킬 | `impeccable` — 로드함. `critique`(native 경로: 설계 리뷰만)와 `audit.native`의 5개 차원을 적용했다 |
| 쓰지 않은 스킬 | `expo-design-system`, `vercel-react-native-skills`(설치·노출됨, 단계 3부터 사용), `ui-ux-pro-max` |
| 대상 | 태블릿 학습 화면(에이전트 홈, dock, 캔버스, 시트·모달)을 중심으로 하고 Phone 탭 5개를 함께 봤다 |
| 소스 변경 | 없음 (`git diff --stat 76b99e3 -- app src` 출력 없음) |

가장 큰 문제 세 가지:

1. **같은 동작이 화면마다 다르게 그려진다.** "가자!!!" 하나가 네 가지 모양이고, 주요 버튼 채움색이 세 가지, 칩 선택색이 네 가지다.
2. **떠 있는 UI끼리 서로를 가린다.** 세로 pill 툴바가 Stage 문제 카드를 덮고, 해답 시트가 캔버스 툴바를 덮는다.
3. **빈 상태와 오류 상태가 설계돼 있지 않다.** 회색 문장 한 줄이거나 아무것도 없다.

## 2. 증거

- **블록도**: 노드 66개(screen 24, modeless 16, modal 13, bottomsheet 6, navigator 6, external 1), 엣지 115개. 검증 스크립트 통과, Mermaid 4개 뷰 렌더링 확인.
- **캡처**: 26장(같은 화면을 두 노드에 쓴 2쌍이 있어 서로 다른 이미지는 24장), **전부 시뮬레이터**(iOS 26.4). iPad Air 13-inch (M4) 20장, iPhone 17 6장. 실기기 0장. 번들 출처 미확인(§9). 목록·조건·미촬영 사유는 `docs/ui-redesign/captures/01/manifest.md`.
- **버튼·칩 조사**: `docs/ui-redesign/01-buttons-chips-survey.md` (후보 71 = 버튼 42 + 칩 8 + 제외 21, `GoButton` 호출 28곳).
- 아래 표의 캡처 경로는 모두 `docs/ui-redesign/captures/01/` 기준이다.

## 3. 설계 리뷰 (impeccable critique)

### 3.1 Design Health Score

| # | Heuristic | 점수 | 핵심 근거 |
|---|---|---|---|
| 1 | 시스템 상태 표시 | 2 | 불러오기 실패가 본문 한 줄로만 나온다. "내 풀이" 시트는 비어 있을 때 아무 표시가 없다 |
| 2 | 현실 세계와의 일치 | 3 | 수학 표기와 기출 분류는 학생 언어다. 다만 History·Diary·Study Log·Options처럼 영어 라벨이 한국어 라벨과 섞인다 |
| 3 | 사용자 통제 | 3 | dock·시트·모달 모두 닫을 수 있다. 해답 시트가 열리면 툴바가 가려지고, 보이는 닫기 수단은 손잡이 하나다 |
| 4 | 일관성 | 1 | 버튼·칩·시트 높이·닫기 방식이 화면마다 다르다(§4 D-01, D-05) |
| 5 | 오류 예방 | 3 | 전체 지우기에 확인 대화상자가 있다 |
| 6 | 기억보다 인식 | 2 | 세로 pill 툴바는 라벨 없는 아이콘 6개다. 타임라인 카드는 번호 1~30을 글자로 나열한다 |
| 7 | 유연성·효율 | 2 | 숙련 사용자를 위한 지름길이 보이지 않는다(캡처·코드 범위 안에서) |
| 8 | 미니멀한 디자인 | 2 | 타임라인 카드의 굵은 주황 구분선과 이모지 아이콘, 초록 "선택 →" 라벨이 주의를 나눈다 |
| 9 | 오류 인식·복구 | 1 | "불러오지 못했어요. (로그인이 필요해요)"에 다시 시도나 로그인으로 가는 동작이 없다 |
| 10 | 도움말 | 1 | 처음 쓰는 학생에게 dock과 캔버스 도구를 알려 주는 장치가 없다 |
| **합계** | | **20/40** | **Acceptable** — 사용자에게 내놓기 전에 손봐야 할 것이 많다 |

### 3.2 Design Specificity

**LLM assessment**: 구조는 이 제품에 맞게 쓰여 있다. 화면 전체를 쓰는 Stage, 필요할 때만 나오는 dock, 필기를 가리지 않는 하단 툴바는 "펜으로 푸는 태블릿 학습"이라는 사용 장면에서 나온 선택이다. 반면 표면은 제품 하나로 읽히지 않는다. `InstructionCard`·`ChatRail`·`StudyNoteForm`은 토큰만 쓰는 새 코드이고, `QuizResponseModal`·`ConceptLookupPanel`·`ExamSearchPanel`은 slate 계열 회색과 `'orange'`, `#ea580c`를 직접 쓰는 옛 코드다. 두 세대가 한 화면에 함께 나온다.

**Deterministic scan**: not applicable (native platform).

### 3.3 잘 된 것

- **캔버스가 주인공이다.** 캔버스 화면은 문제와 하단 툴바 한 줄뿐이고, 툴바 버튼은 아이콘과 라벨을 함께 보여 준다(`ipad-sim-notebook-before.png`).
- **토큰 기반이 이미 있다.** `src/ui/theme.ts`에 색·간격·반경·타이포·그림자·모션·레이아웃·z 토큰이 있고 `layout.hit = 44`가 정의돼 있다. 새 코드는 이것만 쓴다.
- **주황을 행동에 쓴다는 원칙이 새 코드에서는 지켜진다.** dock 닫기 손잡이, 선택된 툴바 항목, 주요 버튼이 같은 accent 계열이다.

### 3.4 Persona Red Flags

- **처음 쓰는 학생**: 로그인 직후 홈에서 Study dock이 열려 있고 그 뒤 Stage는 로고뿐이다. 왼쪽 아이콘 6개가 무엇인지 눌러 보기 전에는 알 수 없다(`ipad-sim-agent_home-closed-before.png`).
- **빨리 풀고 싶은 학생**: 타임라인에서 "가자!!!" → 문제 목록 → 연필 FAB → 캔버스로 세 번 눌러야 풀이가 시작된다. 문제 목록에서 세로 툴바가 5번 문제의 앞부분을 가린다.
- **스크린리더·큰 글씨 사용자**: `GoButton`(28곳)에 `accessibilityRole`이 없고, 버튼 높이가 26·32·38pt로 고정돼 있다.

## 4. 이슈 목록

심각도 순이다. `개선 방향`은 방향만 적었고 수치는 정하지 않았다.

| ID | 심각도 | 관점 | 화면(node id) | 위치 | 증거 | 관찰 | 개선 방향 |
|---|---|---|---|---|---|---|---|
| D-01 | P1 | 버튼 우선순위·일관성 | 전체 | `01-buttons-chips-survey.md` 요약 | `ipad-sim-dock_timeline-before.png`(번들 출처 미확인, §9), `ipad-sim-dock_search-before.png`, `ipad-sim-concept_detail-before.png` | 같은 "가자!!!"가 채움 `#FF8800`(`TimelinePanel.tsx:205`), outline `GoButton`(`ExamSearchPanel.tsx:93`), `#FFC256` 테두리(`TopicUnitList.tsx:74`), accent FAB(`DiaryPanel.tsx:99`)로 그려진다. 주요 버튼 채움색 3가지(`colors.accent`, `#FF8800`, `#ea580c`), 텍스트 버튼 높이 값 5가지(26·32·38·44·48)와 높이 없이 padding만 준 것 | 주요·보조·위험·텍스트의 위계를 하나로 정하고 공용 `Button`으로 모은다(단계 3) |
| D-02 | P1 | 시트 겹침·가림 | `agent_home`, `chat_rail` | `src/agent/tablet/ChatRail.tsx:149-150` | `ipad-sim-agent_home-problems-before.png` | 세로 pill 툴바가 Stage 문제 카드 위에 떠서 5번 문제의 왼쪽 글자를 가린다. 3번 카드는 글자 아래 빈 부분만 덮인다. 5번은 "함수 f(x)…"의 앞부분이 보이지 않는다 | Stage 콘텐츠가 툴바 영역을 피하도록 할지, 툴바 위치를 옮길지 단계 2에서 정한다 |
| D-03 | P1 | 로딩·빈·오류 상태 | `dock_timeline`, `dock_notice`, `dock_profile`, `timeline_index`, `profile`, `nb_workout_sheet`, `agent_home` | `src/kit/timeline/TimelinePanel.tsx:155`(오류 문구), `app/notebook.tsx:272-293`(내 풀이 시트). 공통 컴포넌트 없음 | `phone-sim-timeline_index-before.png`, `ipad-sim-dock_notice-before.png`, `ipad-sim-nb_workout_sheet-before.png`, `ipad-sim-agent_home-closed-before.png` | 실패 시 "…불러오지 못했어요. (로그인이 필요해요)" 한 줄만 나오고 다시 시도·로그인 동작이 없다. "내 풀이" 시트는 비었을 때 완전히 빈 흰 면이다. Stage의 빈 상태는 로고뿐이다 | 빈·오류·로딩 상태의 공통 표현과 다음 행동을 정한다(단계 3) |
| D-04 | P1 | 시트 겹침·중복 조작 | `nb_answer_sheet`, `nb_workout_sheet`, `concept_sheet`, `canvas_toolbar` | `app/notebook.tsx:248-249`(툴바 동작), `app/notebook.tsx:252`, `:272`(시트 두 개), `src/kit/canvas/CanvasChrome.tsx:77` | `ipad-sim-nb_answer_sheet-before.png`, `ipad-sim-concept_sheet-before.png` | 시트가 열리면 하단 툴바를 덮는다. 시트를 닫아야 다른 도구를 쓸 수 있고, 화면에 보이는 닫기 수단은 가운데 주황 손잡이 하나다(아래로 끌어 닫기가 되는지는 확인하지 않았다). 시트 높이도 해답·내 풀이는 화면의 절반, 개념 검색은 약 2/3로 다르다 | 시트와 툴바의 층 관계, 시트 높이 단계, 닫기 방식을 한 규칙으로 정한다(단계 2) |
| D-05 | P1 | 칩·선택 상태 | `dock_search`, `search_index`, `welcome`, `concept_sheet` | `src/kit/exam-search/ExamSearchPanel.tsx:111`, `src/kit/research/ResearchPanel.tsx:62`, `src/kit/concepts/ConceptLookupPanel.tsx:88,113,144`, `src/kit/study-note/StudyNoteForm.tsx:42` | `ipad-sim-dock_search-before.png`, `ipad-sim-concept_sheet-before.png` | 칩 선택색이 `'orange'`, `#ea580c`, `accentSoft`, `colors.accent`(`app/welcome.tsx:119`) 네 가지이고 높이가 36·32·padding만으로 갈린다. 초록 "계열 선택 →" 라벨은 `onPress` 없는 `GoButton`(`ExamSearchPanel.tsx:103`, `#30B650`)이라 버튼처럼 보이지만 눌리지 않는 제목이다 | 필터·선택·동작 칩을 구분해 공용 `Chip`으로 모으고, 눌리지 않는 라벨은 칩 모양에서 뺀다(단계 3) |
| D-06 | P2 | 회전·adaptivity | `notebook`, `landscape_notice` | `src/kit/canvas/useCanvasLandscape.ts:7-8`, `src/kit/canvas/landscapeRestrictions.ts:3-4` | `ipad-sim-notebook-landscape-before.png` | 가로로 돌리면 캔버스가 세로 폭을 유지해 오른쪽 약 1/4이 빈 회색 띠로 남는다. 제한 목록이 비어 있어 안내도 뜨지 않는다 | 제한 목록은 사용자 결정 대기 사항이라 그대로 둔다. 빈 띠를 어떻게 쓸지만 단계 2에서 논의한다 |
| D-07 | P2 | 모달 레이아웃·터치 영역 | `nb_list_modal` | `app/notebook.tsx:160-236`, `src/kit/ui/go-button.tsx:35-37` | `ipad-sim-nb_list_modal-before.png` | 문제 목록 모달은 카드가 가로로 잘려 보이고 가운데가 큰 빈 면이다. 아래 버튼 5개는 `GoButton`의 `small`(32pt)이라 44pt 터치 기준에 못 미친다 | 모달 안 목록의 방향과 버튼 크기를 공용 기준에 맞춘다(단계 3~4) |
| D-08 | P2 | 과도한 구획·아이콘 | `dock_timeline` | `src/kit/timeline/TimelinePanel.tsx:186-210` | `ipad-sim-dock_timeline-before.png`(번들 출처 미확인, §9) | 카드마다 번호 1~30을 글자로 모두 나열하고, 이모지(📝 🗓 🔢 🕑)와 Ionicons가 섞이며, 카드 사이에 굵은 주황 띠가 있다. 주황은 행동에만 쓴다는 원칙(`DESIGN.md`)과 어긋난다 | 카드 정보의 우선순위를 줄이고 구분선·아이콘을 한 체계로 맞춘다(단계 4) |
| D-09 | P2 | 텍스트 위계·용어 | `nav_main`(Phone 탭), `chat_rail`, `canvas_toolbar`, `pencil_popover` | `app/(main)/_layout.tsx:12-25`, `src/agent/tablet/DrawerFooter.tsx:12-17` | `phone-sim-chat_index-before.png`, `ipad-sim-pencil_popover-before.png` | Phone 탭은 History·검색·Diary·내 정보·Study Log, 태블릿 dock 제목은 Study·Diary·검색·내 정보·Study Log, 하단 6칸 정의는 공지·검색·타임라인·실황 수업·주간 공부·내 정보다. 같은 기능의 이름이 세 벌이고 영어와 한국어가 섞인다. 펜 색 라벨도 orange·blue처럼 영어다 | 기능 이름을 한 벌로 정한다(단계 2). 펜 색 **저장값**은 사용자 데이터라 바꾸지 않고 표시 라벨만 다룬다 |
| D-10 | P2 | 오버레이 역할 | `dock_timeline` 등 dock 5종 | `src/agent/DockWrapper.tsx:43`, `src/agent/tablet/TabletAgentLayer.tsx:109-136` | `ipad-sim-dock_timeline-before.png` | dock은 scrim 없이 Stage 문제 목록 위 왼쪽 약 60%를 덮는다. 뒤 내용이 그대로 보이지만 가려진 부분은 조작할 수 없다. 블록도에서는 Modeless로 분류돼 있다 | dock이 열렸을 때 Stage를 계속 쓸 수 있어야 하는지 정하고 폭·층을 맞춘다(단계 2) |
| D-11 | P2 | Phone↔Tablet 배치 | `profile`, `dock_profile` | `src/kit/profile/ProfileActions.tsx:53-74` | `phone-sim-profile-before.png`, `ipad-sim-dock_profile-before.png` | 이름 변경·프로필 이미지 변경·로그아웃이 Phone에서는 프로필 카드 바로 아래에, 태블릿 dock에서는 맨 아래에 떨어져 있다. 세 버튼이 같은 크기의 밑줄 텍스트이고 로그아웃은 색(`colors.danger`, `ProfileActions.tsx:76`)으로만 구분된다 | 동작의 위치와 위험 동작의 표현을 정한다(단계 2~3) |
| D-12 | P2 | 접근성 | 전체 | `src/kit/ui/go-button.tsx:103`, `src/kit/live-class/QuizResponseModal.tsx:235,273,280` | 코드 근거만 | `accessibilityRole` 없는 버튼 6종(`GoButton` 포함 시 호출 28곳에 영향). 눌림 표현이 없는 `Pressable` 버튼 14건. `allowFontScaling`·`maxFontSizeMultiplier` 언급은 코드 전체에 1곳뿐이고 버튼 높이는 고정 수치다 | 공용 `Button`·`Chip`이 role·state·눌림 표현·최소 터치 영역을 기본으로 갖게 한다(단계 3). 글자 확대 동작은 단계 6에서 기기로 확인한다 |
| D-13 | P3 | 모달 표현 | `concept_detail`, `clear_confirm`, `name_edit_modal` | `src/kit/concepts/ConceptLookupPanel.tsx:172-190`, `src/kit/canvas/CanvasChrome.tsx:113-124`, `src/kit/profile/ProfileActions.tsx:83-100` | `ipad-sim-concept_detail-before.png`, `ipad-sim-clear_confirm-before.png` | 대화상자 세 개가 각각 따로 구현돼 있다. 닫기 버튼이 전폭 채움(`#ea580c`), outline+채움 `GoButton` 쌍, 텍스트 버튼 쌍으로 다르다 | 확인 대화상자의 공통 틀을 정한다(단계 3) |

## 5. 구조 이슈 (블록도에서)

`docs/ui-structure/ui-structure.md`의 미확인/이슈 목록에서 디자인 작업에 영향을 주는 것만 옮겼다.

- **시트 위 모달 2단 중첩**: 캔버스의 개념 검색 시트 안에서 개념 칩을 누르면 RN `Modal`이 뜬다(`ConceptLookupPanel.tsx:172`). 캡처 `ipad-sim-concept_detail-before.png`.
- **시트 구현이 두 가지**: 해답·내 풀이·답안 예시·개념 검색은 backdrop 없는 @gorhom `BottomSheetModal`이고, 학습장 시트는 RN `Modal` + scrim 자체 구현이다(`SheetHost.tsx:31`).
- **펜 설정 팝오버는 보기와 달리 차단형이다**: 투명한 전면 `Pressable`이 바깥 탭을 받는다(`ToolPopover.tsx:26`).
- **orphan**: `GlobalLoadingOverlay`(표시 조건을 부르는 곳 없음), 해설 팝업 Sheet 2개, `/timeline/topic` 라우트.
- **데드 코드**: `AgentDrawer`, `DrawerFooter` 컴포넌트(타입만 쓰임), `ScriptMessageToast`, `QFlatlist`, `topic-notebook.tsx`. 하단 6칸 정의가 들어 있는 `DrawerFooter`가 화면에는 렌더되지 않는다. 실제 내비는 세로 pill 툴바(`ChatRail`)다.
- **Phone 탭과 태블릿 6칸의 구성이 다르다**: Phone은 5개 탭이고 실황 수업·주간 공부가 없다.

## 6. 기술 점검 (impeccable audit, native)

코드와 시뮬레이터 캡처만으로 매긴 점수다.

| # | 차원 | 점수 | 핵심 근거 |
|---|---|---|---|
| 1 | 접근성 | 2 | `accessibilityLabel` 52곳으로 라벨은 대체로 있다. role 없는 버튼, 고정 높이, 글자 확대 미대응이 남는다(D-12). 스크린리더 실제 동작은 미검증 |
| 2 | 성능 | 미측정 | 프레임을 재지 않았다. 코드상으로는 `FlatList`를 쓰는 파일 14개, `ScrollView` 11개다. 단계 6에서 기기로 잰다 |
| 3 | 외형·테마 | 2 | 토큰은 있지만 일관되게 쓰이지 않는다(§7) |
| 4 | 플랫폼 적합성 | 2 | safe area와 뒤로가기는 캡처 범위에서 문제가 없었다. 아이콘은 Ionicons와 이모지가 섞이고, 시트·대화상자가 손으로 만든 것 여러 벌이다 |
| 5 | 적응성 | 2 | Phone과 Tablet 구조가 따로 설계돼 있다. 가로 방향에서 캔버스가 폭을 쓰지 못한다(D-06). Split View·폴더블은 미검증 |
| **합계** | | **8/16** (성능 제외) | 4개 차원 평균 2 — 부분적으로 갖춰진 상태 |

## 7. 토큰 드리프트

- `.tsx` 안의 hex 색 리터럴 **154건**, CSS 색 이름(`'orange'`, `'blue'`, `'red'`, `'green'`) **33건**.
- 간격·반경·글자 크기를 숫자로 직접 적은 선언 **296건**. 그중 `fontSize` 숫자가 **63건**이고, `type.*` 토큰 사용은 **66건**이다. 타이포 토큰과 직접 지정이 거의 반반이다.
- 하드코딩 색이 많은 파일: `ConceptLookupPanel.tsx`(23), `QuizResponseModal.tsx`(21), `MathJaxWrapper.tsx`(15), `TopicTabsPanel.tsx`(13), `topic-notebook.tsx`(12, 데드 코드), `TimelinePanel.tsx`(10), `MessageBoxPanel.tsx`(9), `RecordsCalendar.tsx`(9), `topic-live-canvas.tsx`(9), `hotline-class-canvas.tsx`(9).
- `DESIGN.md` frontmatter의 색 값(`accent #F97316`, `accent-press #EA580C`, `bg #F7F7F8`, `line #E4E4E7` 등)은 `src/ui/theme.ts`의 palette 값과 일치한다. 어긋남은 문서와 토큰 사이가 아니라 토큰과 화면 코드 사이에 있다.
- `theme.ts`에 없는 계열이 쓰인다: slate 회색(`#f1f5f9`, `#cbd5e1`, `#f8fafc`), `#FF8800`, `#FFC256`, `#30B650`, `'blue'`(달력 표시 테두리).
- 주의: 필기 잉크 색 값(`orange, blue, black, red, green`)은 사용자 데이터라 위 33건 중 잉크 관련은 바꾸지 않는다. 단계 3 목록화에서 UI 색과 잉크 색을 갈라야 한다.

## 8. 보존 제약 확인

`00-baseline.md` §4의 7개 제약은 이번 진단에서 건드리지 않았다. 위 이슈 중 제약과 맞닿는 것:

- D-06(가로): landscape 제한 목록은 미정으로 두고 새로 만들지 않는다.
- D-09(용어): 하단 6칸의 **기능**은 유지한다. 논의 대상은 이름과 표현뿐이다.
- D-09(펜 색): 잉크 색 저장값은 바꾸지 않는다.
- 이슈 목록에 Pretendard, `react-native-paper`, dark mode, Tablet 판정 로직을 바꾸자는 항목은 없다.

## 9. 미검증·blocked

- **실기기 캡처 0장.** 사용자 지시로 시뮬레이터를 썼다. 개선 스펙 Gate A는 실제 iPad 증거를 요구하므로 이 진단은 시뮬레이터 증거만으로 쓴 것이다. 펜 입력, 실제 터치 크기 체감, 성능은 실기기에서만 확인할 수 있다.
- **미촬영 47행**(`manifest.md`): 학습장 시트, 주제 실황 수업·선생님 수업 화면과 그 시트·모달(수업이 열려 있어야 함), Phone의 결과 화면(문제 목록·주제·해답), 토스트, 이름 변경·PDF 모달, orphan 노드.
- **번들 출처 미확인 (중요)**: 캡처에 쓴 개발 서버(Metro)가 `76b99e3`의 코드를 내보내지 않았다. 코드는 Study dock 카드에 "학습장" 줄과 버튼을 항상 그리는데(`TabletAgentLayer.tsx:125`, `TimelinePanel.tsx:186-203`) 로그인 상태 캡처에는 없다. 캡처 뒤 개발 서버에서 `TimelinePanel` 모듈을 받아 보니 디스크 파일에는 있는 `noteBtn`이 한 건도 없었다. 서버가 study-note 이전 모듈을 내보낸 것이다. 따라서 **캡처 26장은 study-note 변경이 빠진 번들일 수 있고**, 학습장 줄·버튼·시트는 캡처로 확인되지 않았다. 이 문서의 `파일:라인` 근거는 모두 `76b99e3` 코드에서 읽은 것이라 영향이 없다. 개발 서버를 다시 띄운 뒤 재촬영이 필요하다.
- **iOS 27.2에서 앱이 실행 직후 종료된다**(`UIApplicationEvaluateRuntimeIssueForNoSceneLifecycleAdoption`). UI 문제가 아니라 네이티브 수명주기 문제이고 이번 작업 범위 밖이다. 캡처는 iOS 26.4로 했다.
- **기준 lint 실패**: 오류 2건(`src/kit/canvas/CanvasChrome.tsx:116`), 경고 151건. 이번 작업 이전부터 있던 것이다.
- 스크린리더 동작, 글자 확대, 명암 대비 수치, 스크롤 프레임은 재지 않았다.
- 눌리지 않는 배지·태그 모양은 버튼·칩 조사에 들어 있지 않다.

## 10. Gate A 요청

승인되면 단계 2(역할·정보구조)의 입력이 되는 질문이다. 답은 정하지 않았다.

1. dock이 열려 있을 때 Stage를 계속 조작할 수 있어야 하는가, 아니면 dock이 주 화면이 되는가? (D-02, D-10)
2. 캔버스의 시트는 툴바 위로 올라와야 하는가, 툴바를 남기고 그 위에서 멈춰야 하는가? (D-04)
3. 기능 이름을 어느 한 벌로 통일하는가 — Phone 탭 이름, dock 제목, 하단 6칸 정의 중에서? (D-09)
4. 하단 6칸은 지금 화면에 렌더되지 않고 세로 pill 툴바가 그 역할을 한다. 6칸의 "기능"을 세로 툴바로 유지하는 현재 형태를 기준으로 삼는가?
5. 실기기 캡처를 Gate A 전에 채울 것인가, 단계 4 파일럿의 전후 비교 때 실기기로 찍는 것으로 미룰 것인가?

## 11. 소스 변경 파일

없음.
