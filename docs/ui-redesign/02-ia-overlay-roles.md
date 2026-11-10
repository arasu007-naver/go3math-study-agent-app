# 단계 2 — 역할·정보구조·오버레이

Method: impeccable shape(설계 브리프) + adapt(native 참고). 소스 미수정, 코드 근거만 사용

## 1. 요약

| 항목 | 값 |
|---|---|
| 단계 / 상태 | 단계 2 / **승인대기** — Gate B 검토 중. 질문은 §7 |
| 기준 | `76b99e3` (블록도 `docs/ui-structure/ui-structure.json`, 진단 `docs/ui-redesign/01-diagnosis.md`) |
| 설계·계획 | `docs/superpowers/specs/2026-11-10-ui-redesign-stage2-design.md`, `docs/superpowers/plans/2026-11-10-ui-redesign-stage2.md` |
| 사용한 스킬 | `impeccable` — `shape`(발견 질문은 단계 2 브레인스토밍 Q1~Q5로 대신하고 브리프 구조를 §2에 적용), `adapt` + native 참고(§6) |
| 쓰지 않은 스킬 | `expo-design-system`, `vercel-react-native-skills`(단계 3부터), `ui-ux-pro-max`, `expo-router`·`expo-native-ui`(조건부, 필요 없었다) |
| 대상 | 블록도 노드 66개 전부 |
| 소스 변경 | 없음 (`git diff --stat 76b99e3 -- app src package.json` 출력 없음) |
| 검증 | `node docs/ui-redesign/tools/check-roles.mjs docs/ui-redesign/02-roles.json docs/ui-redesign/02-ia-overlay-roles.md docs/ui-structure/ui-structure.json docs/ui-redesign/01-diagnosis.md` |

역할 표의 원천은 `docs/ui-redesign/02-roles.json`이다. 이 문서 §3·§4의 표는 그 JSON과 같은 행이다.

증거 한계: 캡처는 단계 1의 시뮬레이터 캡처뿐이고 번들 출처가 확인되지 않았다(진단 §9). 이 문서의 사실은 모두 `76b99e3` 코드에서 읽은 `파일:라인`이다. 실기기 캡처는 단계 4 파일럿에서 찍는다(설계 Q5).

## 2. 역할 정의와 층 순서

### 2.1 브리프 (impeccable shape)

- **누가, 어떤 상황에서**: 태블릿에서 펜으로 수능 수학을 푸는 고등학생. 화면 대부분이 캔버스나 Stage 문제 목록이고, 에이전트·튜터가 끼어든다. Phone은 보기·사진 업로드용이다. 모드는 **Operate**(과제 수행)다.
- **성공**: 학생이 어떤 층이 지금 입력을 받는지 헷갈리지 않고, 필기와 문제 보기가 오버레이에 끊기지 않는다(PRODUCT.md 원칙 1·2).
- **상호작용 논지**: 막는 것은 Modal 하나뿐이다. 나머지(Dock, Modeless, Bottom Sheet)는 자기 영역만 차지하고 뒤를 살려 둔다. 튜터 메시지(toast)는 dock보다 위에 둔다.
- **상태와 범위**: dock은 한 번에 하나, 내용은 비었음·로딩·오류가 있다(오류·빈 상태 표현은 진단 D-03, 단계 3). 시트는 해답·내 풀이·개념·학습장 네 가지 내용이다.
- **건드리지 않는 것**: 라우트 의미, 에이전트 프로토콜(`back_requested`, `menu_selected`), Tablet 판정, 6칸 기능, 잉크 색 저장값, Landscape 제한 목록.
- **빌더가 지어내면 안 되는 것**: 폭·높이·간격 수치(단계 3), 새 기능 진입점(§7에서 사용자가 정한다).

### 2.2 역할 다섯 가지

| 역할 | 대상 | 뒤를 막는가 | 열림 / 닫힘 | Phone ↔ Tablet |
|---|---|---|---|---|
| **Screen** | 24 | 영역 전체를 차지한다 | 라우트로 연다. 뒤로가기는 지금처럼 `back_requested`로 에이전트에 넘긴다 | 같은 라우트. 늘리지 않고 재구성한다 |
| **Dock** | 6 | **막지 않는다.** scrim 없음, 보이는 Stage는 조작된다 | rail 항목으로 연다. 같은 항목·닫기 손잡이·기존 규칙(Stage에 문제 목록이 뜨면 닫힘, Diary의 `list` 출처는 예외)으로 닫는다. 한 번에 하나 | 태블릿 전용. Phone에서는 각 dock이 탭 화면이다 |
| **Modeless** | 10 | 자기 영역 밖의 입력을 막지 않는다. 경쟁하는 Stage 콘텐츠를 가리지 않는다 | 부모 화면이 소유한다 | rail·캔버스 툴바·toast는 태블릿 전용(Phone의 instruction은 하단 모달, PRODUCT.md:31) |
| **Bottom Sheet** | 6 | 자기 영역만 덮는다. 캔버스에서는 툴바 위에서 멈춘다 | 보이는 닫기 컨트롤 + 끌어 닫기. 높이는 공용 단계에서 고른다 | 같은 역할 |
| **Modal** | 13 | **막는다.** scrim 있음 | 명시적 선택이나 닫기가 있어야 닫힌다 | Phone에서는 전체 높이로 보일 수 있다 |
| (역할 밖) | 7 | — | — | 내비게이터 6, 앱 밖 시스템 1 |

역할별 기대 차단 값(`02-roles.json`의 `expectedBlocking`): Screen `—`, Dock `false`, Modeless `false`, Bottom Sheet `false`, Modal `true`, 역할 밖 `—`.

### 2.3 층 순서

아래에서 위로: **Stage → 캔버스 툴바 → Bottom Sheet → Dock → rail → toast → Modal → 시스템 UI**.

- Bottom Sheet는 툴바 옆(위쪽)에 놓이고 툴바 위로 겹치지 않는다(설계 Q2).
- toast가 dock보다 위인 이유: dock이 열려 있어도 튜터 메시지가 보여야 한다(PRODUCT.md 원칙 3 "사람 튜터가 먼저다").
- rail이 dock보다 위인 이유: dock은 rail 오른쪽에서 시작하고(`src/agent/tablet/TabletAgentLayer.tsx:112`의 `left`), 열린 dock을 rail 항목으로 다시 닫을 수 있어야 한다.

## 3. 역할 표

`기대 차단`과 `기록 blocking`이 다르면 어긋남 id가 있어야 한다(검증 규칙). `—`는 차단 개념이 없는 값(null)이다.

| node id | 역할 | 기대 차단 | 기록 blocking | 열림·닫힘 | Phone / Tablet | 어긋남 |
|---|---|---|---|---|---|---|
| `nav_root` | outside | — | — | 앱 시작 시 항상(`app/_layout.tsx:43`) | Phone / Tablet: 전역 오버레이를 감싸는 루트 스택 (역할 밖: 오버레이가 아닌 내비게이터) | — |
| `nav_main` | outside | — | — | 인증 게이트 통과 시(`app/(main)/_layout.tsx:75`) | Phone: 하단 탭 바 / Tablet: 탭 바 숨김, index만 (역할 밖: 오버레이가 아닌 내비게이터) | — |
| `nav_timeline` | outside | — | — | 탭 선택(`app/(main)/_layout.tsx:77`) | Phone: 탭 안 스택 (역할 밖: 오버레이가 아닌 내비게이터) | — |
| `nav_search` | outside | — | — | 탭 선택(`app/(main)/_layout.tsx:77`) | Phone: 탭 안 스택 (역할 밖: 오버레이가 아닌 내비게이터) | — |
| `nav_diary` | outside | — | — | 탭 선택(`app/(main)/_layout.tsx:77`) | Phone: 탭 안 스택 (역할 밖: 오버레이가 아닌 내비게이터) | — |
| `nav_chat` | outside | — | — | 탭 선택(`app/(main)/_layout.tsx:77`) | Phone: 탭 안 스택 (역할 밖: 오버레이가 아닌 내비게이터) | — |
| `ext` | outside | — | — | OAuth 리디렉트(`app.config.ts:30`) | Phone / Tablet: 앱 밖 시스템 (역할 밖: 앱 밖 시스템(딥링크 scheme)) | — |
| `welcome` | screen | — | — | 미로그인 리디렉트(`app/auth/callback.tsx:6`). 로그인 성공 시 `/`로 교체(`app/welcome.tsx:51`) | Phone / Tablet: 같은 라우트, 로그인 + 공개 콘텐츠 | — |
| `auth_callback` | screen | — | — | OAuth 리디렉트로 열리고 즉시 `/welcome`으로 교체(`app/auth/callback.tsx:6`) | Phone / Tablet: 화면 없음 | — |
| `public_questions` | screen | — | — | welcome의 가자(`app/welcome.tsx:70`). 헤더 뒤로 | Phone / Tablet: 헤더 있는 스택 화면 | — |
| `public_solution` | screen | — | — | public_questions의 해답(`app/public-questions.tsx:96`). 헤더 뒤로 | Phone / Tablet: WebView 스택 화면 | — |
| `notebook` | screen | — | — | Stage 문제 목록의 연필 FAB(`src/host/widgets.tsx:67`). 툴바 나가기 | Tablet: 전체 화면 캔버스. Phone 진입 없음 | D-06 |
| `topic_live` | screen | — | — | 실황 주제 수업 문제 목록 연필 FAB(`src/host/widgets.tsx:155`). 툴바 나가기 | Tablet: 전체 화면 캔버스. Phone 진입 없음 | — |
| `hotline` | screen | — | — | 선생님 수업 문제 목록 연필 FAB(`src/host/widgets.tsx:157`). 툴바 나가기 | Tablet: 전체 화면 캔버스. Phone 진입 없음 | — |
| `agent_home` | screen | — | — | 탭 index(`app/(main)/_layout.tsx:75`). 뒤로는 `back_requested` | Tablet: Stage + rail + dock. Phone은 `/timeline`으로 교체(`app/(main)/index.tsx:14`) | D-02 |
| `profile` | screen | — | — | 탭 선택(`app/(main)/_layout.tsx:77`) | Phone: 내 정보 탭 화면. Tablet은 dock_profile | D-11 |
| `timeline_index` | screen | — | — | Phone 첫 화면(`app/(main)/index.tsx:14`) | Phone: 타임라인 탭 첫 화면. Tablet은 dock_timeline | — |
| `timeline_problems` | screen | — | — | task 탭(`src/phone/PhoneScreens.tsx:95`). 헤더 뒤로 | Phone: 스택 화면 | — |
| `timeline_topic` | screen | — | — | 여는 코드 없음(고아). 헤더 뒤로 | Phone: 스택 화면 | — |
| `timeline_solution` | screen | — | — | 눈(해답) 탭(`src/phone/PhoneScreens.tsx:216`). 헤더 뒤로 | Phone: WebView 스택 화면 | — |
| `search_index` | screen | — | — | 탭 선택. 결과에서 dismissTo로 복귀(`src/phone/PhoneScreens.tsx:194`) | Phone: 검색 탭 첫 화면. Tablet은 dock_search | — |
| `search_problems` | screen | — | — | 기출 검색 제출(`src/phone/PhoneScreens.tsx:113`). 헤더 뒤로 | Phone: 스택 화면 | — |
| `search_topic` | screen | — | — | 토픽 탭(`src/phone/PhoneScreens.tsx:117`). 헤더 뒤로 | Phone: 스택 화면 | — |
| `search_solution` | screen | — | — | 눈(해답) 탭(`src/phone/PhoneScreens.tsx:216`). 헤더 뒤로 | Phone: WebView 스택 화면 | — |
| `chat_index` | screen | — | — | 탭 선택. 결과에서 dismissTo로 복귀(`src/phone/PhoneScreens.tsx:194`) | Phone: Study Log 탭 첫 화면. Tablet은 dock_chat | — |
| `chat_problems` | screen | — | — | 에이전트 `show_component problem_list`(`src/phone/PhoneScreens.tsx:175`). 헤더 뒤로 | Phone: 스택 화면 | — |
| `chat_topic` | screen | — | — | 에이전트 `show_component problem_preview`(`src/phone/PhoneScreens.tsx:176`). 헤더 뒤로 | Phone: 스택 화면 | — |
| `chat_solution` | screen | — | — | 눈(해답) 탭(`src/phone/PhoneScreens.tsx:216`). 헤더 뒤로 | Phone: WebView 스택 화면 | — |
| `diary_index` | screen | — | — | 탭 선택(`app/(main)/diary/_layout.tsx:10`) | Phone: Diary 탭 첫 화면(달력 + 공지). Tablet은 dock_notice | — |
| `diary_day` | screen | — | — | 달력 날짜 탭(`src/phone/PhoneScreens.tsx:139`). 헤더 뒤로 | Phone: 스택 화면. Tablet은 dock_notice의 날짜 탭 | — |
| `diary_solution` | screen | — | — | 답안 예시 탭(`src/phone/PhoneScreens.tsx:278`). 헤더 뒤로 | Phone: WebView 스택 화면. Tablet은 날짜 탭 안 해답 | — |
| `study_note_sheet` | bottomsheet | false | true | 학습장 탭(`src/phone/PhoneScreens.tsx:97`, `src/agent/tablet/TabletAgentLayer.tsx:125`). scrim 탭·뒤로로 닫음(`src/host/SheetHost.tsx:31`, `:33`) | Phone: 아래 붙은 카드 / Tablet: 폭 제한 카드 | NEW-01 |
| `global_loading` | modeless | false | false | `beginBlocking()` 호출부 없음(고아). pointerEvents none | Phone / Tablet: 전체 덮개(표시되지 않음) | — |
| `tablet_launch` | modeless | false | false | 앱 시작(`src/ui/TabletLaunchOverlay.tsx:18`). 1초 후 페이드아웃 | Tablet: Android 태블릿만. Phone 없음 | — |
| `chat_rail` | modeless | false | false | agent_home에 항상(`src/agent/tablet/TabletAgentLayer.tsx:109`). 닫지 않음, 손잡이로 이동 | Tablet: 끌 수 있는 pill 툴바. Phone은 하단 탭 바 | D-02 |
| `dock_timeline` | dock | false | false | rail 타임라인 또는 홈 진입 기본(`src/agent/tablet/ChatRail.tsx:123`, `src/agent/tablet/TabletAgentLayer.tsx:54`). 같은 항목·닫기 손잡이·문제 목록 표시로 닫힘(`src/agent/tablet/TabletAgentLayer.tsx:100`, `:112`, `:90`) | Tablet: Stage 위 dock. Phone은 timeline_index | D-10 |
| `dock_notice` | dock | false | false | rail Diary(`src/agent/tablet/ChatRail.tsx:123`). 같은 항목·닫기 손잡이로 닫힘. Diary의 `list` 문제 목록은 dock을 두고 연다(`src/agent/tablet/TabletAgentLayer.tsx:90`) | Tablet: Stage 위 dock. Phone은 diary_index | D-10 |
| `dock_search` | dock | false | false | rail 검색(`src/agent/tablet/ChatRail.tsx:123`). 같은 항목·닫기 손잡이·검색 제출로 닫힘(`src/agent/tablet/TabletAgentLayer.tsx:165`) | Tablet: Stage 위 dock. Phone은 search_index | D-10 |
| `dock_live` | dock | false | false | rail 실황 수업(`src/agent/tablet/ChatRail.tsx:123`). 같은 항목·닫기 손잡이·문제 목록 표시로 닫힘(`src/agent/tablet/TabletAgentLayer.tsx:90`) | Tablet: Stage 위 dock. Phone 진입 없음(§6) | D-10 |
| `dock_profile` | dock | false | false | rail 내 정보(`src/agent/tablet/ChatRail.tsx:123`). 같은 항목·닫기 손잡이로 닫힘 | Tablet: Stage 위 dock. Phone은 profile | D-10, D-11 |
| `dock_chat` | dock | false | false | rail Study Log 또는 instruction 도착(`src/agent/tablet/ChatRail.tsx:137`, `src/agent/tablet/TabletAgentLayer.tsx:74`). 같은 버튼·닫기 손잡이로 닫힘 | Tablet: Stage 위 dock. Phone은 chat_index | D-10 |
| `agent_toast` | modeless | false | false | instruction 도착(`src/agent/tablet/TabletAgentLayer.tsx:71`). 시간이 지나면 사라짐(`src/ui/toast/Toast.tsx:44`), 탭하면 채팅 dock | Tablet: 우상단 toast. Phone 없음(Phone instruction은 별도 하단 모달, PRODUCT.md:31) | — |
| `canvas_toolbar` | modeless | false | false | 캔버스 화면에 항상(`src/kit/canvas/CanvasChrome.tsx:95`). 닫지 않음 | Tablet: 캔버스 하단 툴바. Phone 없음 | D-04 |
| `concept_sheet` | bottomsheet | false | false | 툴바 개념(`src/kit/canvas/CanvasChrome.tsx:77`). 손잡이 끌기 | Tablet: snap 70%(`src/kit/canvas/CanvasChrome.tsx:53`, `:135`) 시트, 툴바를 덮음 | D-04 |
| `clear_confirm` | modal | true | true | 툴바 전체 지우기(`src/kit/canvas/CanvasChrome.tsx:81`). 확인·취소 | Tablet: 확인 대화상자 | D-13 |
| `landscape_notice` | modeless | false | false | 가로 회전·제한 버튼(`src/kit/canvas/CanvasChrome.tsx:94`). 자동 사라짐, pointerEvents none | Tablet: 캔버스 안내. 제한 목록이 비어 표시되지 않음 | D-06 |
| `pencil_popover` | modal | true | true | 툴바 Options(`src/kit/canvas/note-canvas/notebook.tsx:167`). 바깥 탭(light-dismiss) | Tablet: 툴바에 붙은 팝오버 | — |
| `concept_detail` | modal | true | true | 개념 칩(`src/kit/concepts/ConceptLookupPanel.tsx:147`). 닫기 버튼 | Phone / Tablet: 카드 대화상자 | D-13 |
| `name_edit_modal` | modal | true | true | 이름 변경(`src/kit/profile/ProfileActions.tsx:58`). 저장·취소 | Phone / Tablet: 입력 대화상자 | D-13 |
| `pdf_viewer` | modal | true | true | 사서함 답변(`src/kit/profile/MessageBoxPanel.tsx:148`). 닫기 | Phone: fullScreen(`src/kit/ui/PdfViewerModal.tsx:41`) / Tablet: 투명 카드(`:62`) | — |
| `upload_alert` | modal | true | true | 업로드 끝(`src/phone/PhoneScreens.tsx:204`, `:207`). 시스템 확인 | Phone: 시스템 Alert | — |
| `bookmark_alert` | modal | true | true | 책갈피(`src/kit/diary/DailyRecordsList.tsx:100`, `:103`). 시스템 확인 | Phone: 시스템 Alert | — |
| `quiz_modal` | modal | true | true | 실황 메시지 action quiz(`app/topic-live-class.tsx:82`, `app/hotline-class.tsx:110`). 답안 제출·닫기 | Tablet: 퀴즈 대화상자 | — |
| `nb_list_modal` | modal | true | true | 툴바 목록(`app/notebook.tsx:247`). 닫기 버튼 | Tablet: 목록 모달 | D-07 |
| `nb_answer_sheet` | bottomsheet | false | false | 툴바 해답(`app/notebook.tsx:248`). 손잡이 끌기 | Tablet: 화면 절반 시트, 툴바를 덮음 | D-04 |
| `nb_workout_sheet` | bottomsheet | false | false | 툴바 내 풀이·저장 후 자동(`app/notebook.tsx:249`, `:132`, `:105`). 손잡이 끌기 | Tablet: 화면 절반 시트, 툴바를 덮음 | D-04 |
| `tl_list_modal` | modal | true | true | 툴바 목록(`app/topic-live-class.tsx:181`). 닫기 버튼 | Tablet: 목록 모달 | — |
| `tl_answer_sheet` | bottomsheet | false | false | 툴바 답안 예시(`app/topic-live-class.tsx:182`). 손잡이 끌기 | Tablet: 같은 BottomSheetModal 구성(`app/topic-live-class.tsx:233`). 툴바 겹침은 캡처 없음(미확인) | D-04 |
| `tl_toast` | modeless | false | false | 답안 전송·오류·강의 미준비(`app/topic-live-class.tsx:66`). 2.5초 후 사라짐 | Tablet: 캔버스 위 toast | — |
| `tl_memo` | modeless | false | false | 스크립트 MEMO 컷(`src/kit/canvas/note-canvas/topic-live-canvas.tsx:283`). ✕로 닫음 | Tablet: 캔버스 우상단 메모 | — |
| `tl_popup` | modal | true | true | 여는 호출 없음(고아). `src/ui/Sheet.tsx` 카드 모달 | Tablet: 카드 모달(표시되지 않음) | — |
| `hl_list_modal` | modal | true | true | 툴바 목록(`app/hotline-class.tsx:174`). 닫기 버튼 | Tablet: 목록 모달 | — |
| `hl_answer_sheet` | bottomsheet | false | false | 툴바 답안 예시(`app/hotline-class.tsx:175`). 손잡이 끌기 | Tablet: 같은 BottomSheetModal 구성. 툴바 겹침은 캡처 없음(미확인) | D-04 |
| `hl_toast` | modeless | false | false | Notes 준비·답안 전송·오류(`app/hotline-class.tsx:65`). 시간이 지나면 사라짐 | Tablet: 캔버스 위 toast | — |
| `hl_memo` | modeless | false | false | 스크립트 MEMO 컷(`src/kit/canvas/note-canvas/hotline-class-canvas.tsx:291`). ✕로 닫음 | Tablet: 캔버스 우상단 메모 | — |
| `hl_popup` | modal | true | true | 여는 호출 없음(고아). `src/ui/Sheet.tsx` 카드 모달 | Tablet: 카드 모달(표시되지 않음) | — |

## 4. 어긋남

고칠 단계의 `3`은 공통 컴포넌트·토큰(단계 3)에서 규칙을 만들고, 화면 적용은 단계 4 파일럿부터라는 뜻이다.

| id | 노드 | 어긴 규칙 | 근거 | 고칠 단계 |
|---|---|---|---|---|
| D-02 | `agent_home`, `chat_rail` | Modeless는 경쟁하는 Stage 콘텐츠를 가리지 않는다 | `src/agent/tablet/ChatRail.tsx:149-150`, 캡처 `ipad-sim-agent_home-problems-before.png` | 3 |
| D-04 | `canvas_toolbar`, `concept_sheet`, `nb_answer_sheet`, `nb_workout_sheet`, `tl_answer_sheet`, `hl_answer_sheet` | 캔버스 Bottom Sheet는 툴바 위에서 멈추고, 높이는 공용 단계에서 고르며, 보이는 닫기가 있다 | `app/notebook.tsx:252`, `:272`, `src/kit/canvas/CanvasChrome.tsx:77` | 3 |
| D-06 | `notebook`, `landscape_notice` | (규칙 아님) 가로 빈 띠 처리는 사용자 결정 대기 | `src/kit/canvas/landscapeRestrictions.ts:3-4` | 사용자 결정 |
| D-07 | `nb_list_modal` | Modal 안 목록과 버튼은 공용 기준(최소 터치 영역)을 따른다 | `app/notebook.tsx:160-236`, `src/kit/ui/go-button.tsx:35-37` | 3 |
| D-10 | `dock_timeline`, `dock_notice`, `dock_search`, `dock_live`, `dock_profile`, `dock_chat` | Dock은 Modeless다. 폭과 Stage inset을 한 규칙으로 정한다 | `src/agent/DockWrapper.tsx:43`, `src/agent/tablet/TabletAgentLayer.tsx:112` | 3 |
| D-11 | `profile`, `dock_profile` | 같은 기능의 동작은 Phone과 Tablet에서 같은 자리에 둔다(재구성하되 순서 유지) | `src/kit/profile/ProfileActions.tsx:53-74` | 3 |
| D-13 | `clear_confirm`, `concept_detail`, `name_edit_modal` | Modal 대화상자는 한 틀을 쓴다 | `src/kit/canvas/CanvasChrome.tsx:113-124`, `src/kit/concepts/ConceptLookupPanel.tsx:172-190`, `src/kit/profile/ProfileActions.tsx:83-100` | 3 |
| NEW-01 | `study_note_sheet` | Bottom Sheet는 자기 영역만 덮는다. 학습장 시트는 RN Modal + scrim이라 뒤 전체를 막는다(블록도 blocking true) | `src/host/SheetHost.tsx:31`, `:33` | 3 |

분류 중 확인한 것(어긋남은 아님):

- 고아 노드 4개(`timeline_topic`, `global_loading`, `tl_popup`, `hl_popup`)는 여는 코드가 없어 표시되지 않는다. 역할은 정했고 정리 여부는 단계 3 코드 결정이다.
- `pencil_popover`는 캔버스 전체를 덮는 투명 Pressable로 바깥 탭을 받아 닫힌다. 그래서 Modal로 분류했다(`src/kit/canvas/note-canvas/pencil-props-modal.tsx`).
- `tl_answer_sheet`, `hl_answer_sheet`는 해답 시트와 같은 `BottomSheetModal` 구성이라 D-04를 붙였지만, 툴바와 겹치는지는 캡처가 없어 **미확인**이다.

## 5. 기능 이름

최종 한 벌(설계 Q3): **타임라인 · Diary · 검색 · 실황 수업 · 내 정보 · Study Log**. Diary와 Study Log는 제품 이름이라 영어로 두고, 나머지는 한국어다. 바뀌는 이름과 펜 색 라벨의 원천은 `02-roles.json`의 `names`이고, 바뀌지 않는 이름은 이 표에만 있다. 코드 속 라벨 교체는 단계 3 이후다.

| 표면 | 근거 파일:라인 | 옛 이름 | 새 이름 |
|---|---|---|---|
| Phone 탭 | `app/(main)/_layout.tsx:22` | History | 타임라인 |
| Phone 탭 | `app/(main)/_layout.tsx:23` | 검색 | 검색 (그대로) |
| Phone 탭 | `app/(main)/_layout.tsx:24` | Diary | Diary (그대로) |
| Phone 탭 | `app/(main)/_layout.tsx:25` | 내 정보 | 내 정보 (그대로) |
| Phone 탭 | `app/(main)/_layout.tsx:27` | Study Log | Study Log (그대로) |
| dock 제목 | `src/agent/tablet/TabletAgentLayer.tsx:39` | Study | 타임라인 |
| dock 제목 | `src/agent/tablet/TabletAgentLayer.tsx:39` | Diary · 검색 · 내 정보 · 실황 수업 · Study Log | 그대로 |
| rail 라벨 | `src/agent/tablet/ChatRail.tsx:12-16` | 타임라인 · Diary · 검색 · 실황 수업 · 내 정보 | 그대로 |
| rail 채팅 버튼 접근성 라벨 | `src/agent/tablet/ChatRail.tsx:135` | 채팅 | Study Log |
| 하단 6칸 정의 | `src/agent/tablet/DrawerFooter.tsx:12` | 공지 | Diary (공지는 Diary 안의 탭으로 남는다) |
| 하단 6칸 정의 | `src/agent/tablet/DrawerFooter.tsx:13-17` | 검색 · 타임라인 · 실황 수업 · 주간 공부 · 내 정보 | 그대로 |

펜 색은 **표시 라벨만** 한국어로 적는다. 저장값은 실황 동기화와 MMKV에 쓰이는 사용자 데이터라 바꾸지 않는다(`src/kit/canvas/note-canvas/canvas-utils.ts:17`). 지금은 저장값이 그대로 라벨로 보인다(진단 D-09).

| 표시 라벨 | 저장값 |
|---|---|
| 주황 | `orange` |
| 파랑 | `blue` |
| 검정 | `black` |
| 빨강 | `red` |
| 초록 | `green` |

## 6. 배치 원칙

impeccable adapt(native): Phone ↔ Tablet은 늘리기가 아니라 재구성이다. 구조는 기기 판정(`src/layout/deviceMode.ts`, 진입 600·이탈 560·200ms, 바꾸지 않음)으로 바꾸고, 기능은 작은 기기에서도 숨기지 않는다. 다만 Phone에 캔버스가 없는 것(v1, PRODUCT.md)은 제품 결정이라 그대로 둔다.

### 6.1 보존 요구 (배치 안과 별개)

- 6칸 기능(공지·검색·타임라인·실황 수업·주간 공부·내 정보)은 기능 목록으로 보존한다. 화면에 6칸을 그리는 것은 요구가 아니다(설계 Q4).
- 필기 중인 캔버스, 열린 instruction, 수업 연결은 폴더블 전환·dock 열고 닫기·시트 열고 닫기에 끊기지 않는다(PRODUCT.md Operating Context).
- 에이전트 프로토콜(`back_requested`, `menu_selected`)과 라우트 의미는 그대로다.

### 6.2 태블릿

- **내비**: 떠 있는 rail이 기준이다. 항목 순서는 지금 `RAIL_ITEMS`(`src/agent/tablet/ChatRail.tsx:12-16`) 그대로이고, 맨 끝에 Study Log 버튼이 있다. 주간 공부는 **예약 칸**: 화면이 생기면 rail에 넣고, 그 전에는 비활성 칸을 그리지 않는다.
- **`DrawerFooter`**: 렌더되지 않는 레거시다. 삭제 여부는 단계 3의 코드 결정으로 넘긴다.
- **dock**: Modeless. scrim 없이 rail 오른쪽에 붙고 보이는 Stage는 조작된다. 폭 안(수치 없음): dock은 내용 한 열이 읽히는 고정 폭 하나로 두고, Stage는 남은 폭에 맞춰 문제 카드를 다시 배치한다(2열 → 1열). dock 폭을 늘려 Stage를 덮는 대신 Stage를 재구성한다. 근거: D-10의 "가려진 부분은 조작할 수 없다"를 없애고, adapt의 "늘리지 말고 재구성".
- **D-02 (rail이 Stage 카드를 가림)** 비교:

| 안 | 가림 해결 | 필기 방해 | 구현 범위 | 근거 |
|---|---|---|---|---|
| **1안 (추천)**: Stage가 rail의 현재 변을 inset으로 비운다. rail을 끌거나 가로로 바뀌면 다시 계산한다 | 완전 | 없음(캔버스 화면에는 rail이 없다) | Stage와 rail 사이 위치 공유 하나 | rail의 자유 이동을 유지하면서 콘텐츠와 겹치지 않는다 |
| 대안 A: rail을 콘텐츠 밖 고정 위치(왼쪽 변)로 제한 | 완전 | 없음 | rail 끌기 범위 축소 | 단순하지만 사용자가 옮긴 위치를 잃는다(2026-11 rail 결정과 충돌) |
| 대안 B: rail을 반투명으로 | 부분(글자는 여전히 겹친다) | 없음 | 스타일만 | 읽기 문제가 남는다 |

- **캔버스 시트**: 툴바 위에서 멈춘다(설계 Q2). 높이 단계는 **2개 안**: "보기"(해답·내 풀이·학습장처럼 한 화면 분량)와 "넓게"(개념 검색처럼 긴 목록). 근거: 지금 높이가 화면 절반(해답·내 풀이)과 snap 70%(개념, `src/kit/canvas/CanvasChrome.tsx:53`, `:135`) 두 무리로 이미 갈려 있다. 수치는 단계 3. 닫기는 보이는 닫기 버튼 + 끌어 닫기 둘 다.
- **학습장 시트(NEW-01)**: Bottom Sheet 규칙대로 자기 영역만 덮게 한다. 지금은 RN Modal + scrim이라 뒤 전체를 막는다(`src/host/SheetHost.tsx:31`, `:33`).
- **가로 회전(D-06)**: 빈 띠 처리와 제한 목록은 사용자 결정 대기다. 안을 내지 않는다.

### 6.3 Phone

- **내비**: 하단 탭 5개(타임라인 · 검색 · Diary · 내 정보 · Study Log)가 6칸 기능 중 넷(타임라인·검색·공지(Diary)·내 정보)을 맡고, Study Log는 채팅이다.
- **실황 수업**: Phone 진입점이 없다. 1안: **v1에서는 Phone 진입점을 두지 않고 그 사실을 문서로 고정한다.** 근거: 실황 수업의 도착 화면(`topic_live`, `hotline`)은 태블릿 전용 캔버스이고(블록도 modes `tablet`), Phone에는 캔버스가 없다(PRODUCT.md). 진입점만 만들면 막다른 길이 된다. 대안: Study Log 탭 위에 "지금 수업 중" 카드를 두고 그 수업의 문제 목록(보기 전용)으로 보낸다 — Phone 문제 목록 화면(`chat_problems`)을 재사용할 수 있지만, 수업 동기화 없이 문제만 보여 주는 것이 수업 참여로 오해될 수 있다.
- **주간 공부**: 화면이 없어 두 기기 모두 예약 칸이다.
- **프로필 동작(D-11)**: 1안: 이름 변경·프로필 이미지 변경·로그아웃을 두 기기 모두 프로필 카드 바로 아래에 두고, 로그아웃은 색만이 아니라 위치(맨 끝, 구분선 뒤)로도 구분한다. 근거: 같은 기능은 같은 자리(§4 D-11 규칙), 위험 동작을 색 하나로만 구분하지 않는다.

## 7. Gate B 요청

승인되면 단계 3(토큰·공통 컴포넌트·상태 규칙)의 입력이 된다. 답은 정하지 않았다.

1. Phone의 실황 수업: v1에서 진입점을 두지 않는 1안을 받는가, "지금 수업 중" 카드 대안을 원하는가? (§6.3)
2. 주간 공부: 화면이 생길 때까지 두 기기 모두 칸을 그리지 않는 예약 칸으로 두는가? (§6.2, §6.3)
3. D-02: Stage가 rail 변을 inset으로 비우는 1안을 받는가? (§6.2)
4. 캔버스 시트 높이를 "보기"·"넓게" 2단계로 두는가? (§6.2)
5. NEW-01: 학습장 시트를 Bottom Sheet 규칙(자기 영역만 덮음)으로 바꾸는 것을 단계 3에 넣는가, 학습장은 입력 중심이라 Modal로 재분류하는가? (§4)
6. 기능 이름 대응표(§5)와 펜 색 표시 라벨을 이대로 확정하는가?

## 8. 소스 변경 파일

없음.
