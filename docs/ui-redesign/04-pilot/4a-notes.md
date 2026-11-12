# 단계 4a 기록 — 셸과 공용 부품

- 상태: **진행** (4a 완료, 4b 미착수). Gate D는 4b까지 끝난 뒤 실기기 캡처로 한 번 받는다.
- 브랜치: `design/ui-redesign-stage4` (기준 `8c0bce1`). push·PR은 하지 않았다.
- 설계: `docs/superpowers/specs/2026-11-10-ui-redesign-stage4a-design.md` (`4b87856`), 계획: `docs/superpowers/plans/2026-11-10-ui-redesign-stage4a.md` (`33eee71`).

## 1. 바뀐 것 (커밋별)

| 커밋 | 내용 |
|---|---|
| `c3ce67c` | 캡처 목록 `04-pilot/shot-list.md` (14장, `ipad-<화면>-before\|after.png`) |
| `6b15d59` | `colors.dangerSoft`, `Button`의 `tone="danger"`(보조·텍스트만, 타입으로 막음) |
| `461e049` | 공용 `IconButton` (md = `layout.hit`, sm = `controlSm` + hitSlop, selected·disabled) |
| `2b08616` | 공용 `Tag` (neutral·accent·unread) |
| `ab19b19` | `Sheet` 카드가 키보드 위에 머문다(`KeyboardAvoidingView`, 화면 전체를 채워 캔버스 팝업 위치 유지) |
| `bb43730` | rail 바탕 반투명 카드색, dock 항목 → `IconButton`, 지시 카드 → `Button`, 타임라인 배지 → `Tag`, `Stage` 전환 → `IconButton` |
| `a9af9c2` | 캔버스 시트 4곳: 2단계 snap(`50%`·`70%`), 툴바 위에서 멈춤(`bottomInset = toolbarH + 아래 안전 영역`) |
| `cf7ffc7` | 전체 지우기 → `Dialog`(danger 확인), notebook 목록 모달 → `Button`·`Chip`, 토스트·저장 문구 토큰, 잉크 라벨 한국어 표시(`INK_LABELS`, 저장값 그대로), 메모 닫기 ✕ → `IconButton`(role·라벨) |
| `8a3b967` | 퀴즈 모달: 닫기 ✕ → `IconButton`, 지우기·답 보내기 → `Button`(보내는 중 loading), 스타일 토큰 |
| `5cc9ed3` | 학습장 시트: backdrop 없는 bottom sheet(`@gorhom/bottom-sheet`, 내용 높이·최대 90%), 끌어 내리기·Android 뒤로 가기로 닫힘, 공용 `Chip`·`Button`, `Button`에 `expanded` |
| `4c132b1` | 인벤토리 72행으로 갱신, 이 기록, 가이드 단계 표 |
| `2b7d5ef` | 최종 리뷰 수정: 세션이 학습장 시트를 닫는 애니메이션 중에 다시 열면 다시 올린다(전에는 안 보인 채 멈췄다). 학습장 양식이 `BottomSheetScrollView`라 90%를 넘는 내용이 스크롤된다 |

화면의 동작·저장값·권한·라우트 의미는 바꾸지 않았다. 새 의존성은 없다.

## 2. 검증

- `npx jest`(리뷰 수정 뒤): 51 묶음 중 48 통과, 312 중 309 통과. 실패 3은 기존 baseline 그대로다(`canvasSize`, `notices`, `timeline`).
- `npm run typecheck`: 오류 없음.
- `node docs/ui-redesign/tools/check-inventory.mjs docs/ui-redesign/03-components-inventory.md .` → `OK rows=72`.
- 손댄 파일의 hex·이름 색·숫자 `fontSize` 검색: 잉크 색·견본 글자, WebView 문자열(`QuizResponseModal`), `MathJaxWrapper` 색 3곳만 남았다. `FloatingToolbar` 라벨은 사용자 결정으로 `caption`이 됐다(아래 결정 참고).
- 이 검증은 모두 jest·정적 검사다. 실기기에서 본 것은 아직 없다.

## 3. 실행 중 내린 결정

- Button 누름 색은 RNTL v14가 pressed 스타일을 읽지 못해 순수 함수 `buttonLook`으로 시험한다.
- Sheet 키보드 회피 층은 화면 전체를 채운다(캔버스 팝업이 `position: absolute`라서).
- `TimelineCard`를 export했다(시험용). `Stage` 전환 아이콘은 24 → 22(IconButton md 크기).
- 캔버스 route 시트는 `enableDynamicSizing={false}`로 snap만 쓴다.
- notebook 목록 모달 "닫기"는 설계 §4대로 `sm`이다(전에는 기본 크기).
- `canvasStyles.memoToastCloseText`는 쓰이지 않게 됐지만 `canvasStyles.ts`가 설계 범위 밖이라 남겼다.
- 퀴즈 제목은 `type.heading` + `accentText`, 테두리는 `cardMuted`·`lineStrong`, 그림자는 `shadow.float`.
- 학습장 "다음 목표" 펼치기의 접근성 expanded 상태를 지키려고 `Button`에 선택 prop `expanded`를 더했다.
- 학습장 시트 닫기: 세션이 시트를 비워서 닫힐 때는 아무 이벤트도 보내지 않고, 사용자가 끌어 내리거나 뒤로 가기로 닫을 때만 위젯의 닫기(`study_note_dismissed`)로 보낸다. 뒤로 가기는 시트가 떠 있을 때만 받는다.
- `FloatingToolbar` 라벨: 사용자 결정(2026-11-12)으로 `fontSize: 10` → `type.caption`(12/16), 굵기는 semibold 유지. 버튼 높이 44 안에 아이콘 22 + 간격 1 + 16 + 위아래 2씩 = 43이 들어간다. 라벨이 넓어진 만큼 툴바 폭이 늘고, 좁으면 가로 스크롤된다. 실기기에서 확인한다.

## 4. 남은 것

- **접근성 변화**: backdrop 없는 시트라 VoiceOver·TalkBack이 학습장 시트 뒤 화면에도 닿는다(전의 `Modal`은 시트 안에 가뒀다). Gate B Q5의 선택에 따른 것이다.
- **실기기 확인이 필요한 위험**: 학습장 시트(최대 90%)에서 긴 메모와 키보드가 올라온 상태에서 저장까지 스크롤되는지. 캔버스 시트가 툴바 위에서 멈추는지. 키보드가 올라올 때 학습장 입력이 가려지지 않는지.
- **D-02**는 부분 해결로 열어 둔다(셸·시트·캔버스 모달은 옮겼고, dock 패널은 4b).
- **4b**: dock 패널(Diary, 문제 목록, 기출 검색, 타임라인, 프로필 등). 따로 설계·계획을 쓴다.
- 다른 세션과 겹치는 파일은 사용자가 말할 때 합친다.

## 5. 캡처 요청

- "전" 캡처: 사용자가 찍었다고 알려 주었다("Shots are in"). 이 브랜치와 main 체크아웃의 `docs/ui-redesign/captures/04`에는 파일이 없다. 어디에 두었는지 알려 주면 이 절에 적는다. 개인정보가 보이는 캡처는 커밋하지 않는다.
- "후" 캡처: `shot-list.md`의 14장을 실제 iPad에서 이 브랜치 빌드로 찍어 주기를 요청한다. 데이터가 필요한 화면은 사용자가 직접 테스트 계정으로 로그인한다. 시뮬레이터 캡처는 실기기 증거로 쓰지 않는다.
