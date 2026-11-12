# 단계 4a 캡처 목록 (실 iPad)

- 근거: `docs/superpowers/specs/2026-11-10-ui-redesign-stage4a-design.md` §9, 개선 스펙 §6
- 기기: 실 iPad. 따로 적지 않으면 가로(landscape) 한 장.
- "전": 4a가 화면 파일을 바꾸기 전 지금 빌드(`8c0bce1` 기준). "후": 4a가 끝난 뒤 같은 상태로 다시.
- 파일 위치: `docs/ui-redesign/captures/04/ipad-<screen>-before.png`, `-after.png`
- 데이터가 필요한 화면은 사용자가 테스트 계정으로 로그인한다. Claude는 계정 정보를 입력하지 않는다.
- 이름·사진·전화번호 등 개인정보가 보이는 캡처는 커밋하지 않는다(가리거나 로컬에만 둔다).
- 시뮬레이터 캡처는 `sim-ipad-<screen>-….png`로 이름 짓고 Gate D 근거로 쓰지 않는다.

| # | 화면 | 준비할 상태 | `<screen>` |
|---|---|---|---|
| 1 | 채팅 화면 + rail | Stage(문제 화면) 위에 rail이 보이고, dock 항목 하나가 선택된 상태 | `chat-rail` |
| 2 | 에이전트 지시 카드 | 선택지가 2개 이상인 지시가 떠 있는 상태(가능하면 선택지 없는 "확인" 카드도 한 장 `instruction-confirm`) | `instruction-card` |
| 3 | 캔버스(툴바) | 학습장 캔버스, 하단 툴바 전체가 보이게 | `canvas-toolbar` |
| 4 | 전체 지우기 확인 | 툴바의 전체 지우기를 눌러 확인 창이 뜬 상태 | `clear-confirm` |
| 5 | 해답 시트 · 보기 | 해답 버튼을 눌러 시트가 처음 열린 높이 | `answer-sheet-view` |
| 6 | 해답 시트 · 넓게 | 해답 시트 손잡이를 위로 끌어 올린 높이(지금 빌드에서 안 올라가면 그대로 한 장) | `answer-sheet-wide` |
| 7 | 내 풀이 시트 | 내 풀이 버튼, 저장된 풀이가 2개 이상 | `workouts-sheet` |
| 8 | 개념 검색 시트 | 툴바의 개념 버튼 | `concept-sheet` |
| 9 | 문제 목록 모달 | 툴바의 목록 버튼, 책갈피된 문제와 안 된 문제가 같이 보이게 | `problem-list` |
| 10 | 선생님 메모 토스트 | 핫라인 또는 주제 라이브 수업에서 선생님 메모가 뜬 상태 | `memo-toast` |
| 11 | 퀴즈 모달 | 라이브 수업에서 퀴즈가 뜬 상태, 필기 조금 | `quiz-modal` |
| 12 | 학습장 시트 | 문제를 끝낸 뒤 학습장 기록 시트가 뜬 상태 | `study-note-sheet` |
| 13 | 학습장 시트 · 키보드 | 12에서 메모 입력칸을 눌러 키보드가 열린 상태 | `study-note-keyboard` |
| 14 | 펜 색 팝오버 | 캔버스에서 펜 색 버튼을 눌러 색 목록이 열린 상태 | `pen-color` |

## 단계 4b (dock 패널)

- 근거: `docs/superpowers/specs/2026-11-12-ui-redesign-stage4b-design.md` §7
- "전"은 `f791a77`(4a 끝), "후"는 4b가 끝난 이 브랜치 빌드. 이름 규칙은 위와 같다. Android 태블릿 캡처는 `android-<screen>-….png`.
- 위의 규칙(테스트 계정 로그인은 사용자, 개인정보 캡처는 커밋하지 않음, 시뮬레이터는 근거 아님)이 그대로 적용된다. 특히 15·19·20은 이름·이메일·쪽지가 보이므로 가리거나 로컬에만 둔다.

| # | 화면 | 준비할 상태 | `<screen>` |
|---|---|---|---|
| 15 | 타임라인 dock | 기출 검색·주제·책갈피 카드가 섞여 보이게, 학습장 요약이 있는 카드 하나 | `dock-timeline` |
| 16 | 검색 dock · 2026 | 검색 dock을 열어 2026 탭(탭 셋: 2026·모의 고사·주제/묶음) | `dock-search-recent` |
| 17 | 검색 dock · 모의 고사 | 모의 고사 탭, 번호 몇 개를 고른 뒤 한 장, "시행월 선택"을 눌러 비운 뒤 한 장(`dock-search-pre-cleared`) | `dock-search-pre` |
| 18 | 실황 수업 dock | 선생님 수업·주제 실황 수업 개수 배지가 보이게(없으면 빈 상태 그대로) | `dock-live-class` |
| 19 | 내 정보 dock | 카드 → 동작 버튼 → 사서함 순서가 보이게 | `dock-profile` |
| 20 | 이름 변경 대화상자 | 19에서 "이름 변경"을 눌러 대화상자가 뜬 상태 | `name-dialog` |
| 21 | Diary dock · 공지 | 달력(개수 배지)과 공지 탭 | `dock-diary-notice` |
| 22 | Diary dock · 날 탭 | 풀이가 2번 이상인 날을 눌러 날 탭이 열리고, 풀이 구분선과 문제별 "가자!!!"가 보이게 | `dock-diary-day` |

## 찍은 캡처 (Android 태블릿 HA1V33DF, 2026-11-12)

- `captures/04/android-*-after.png` 18장. 실기기 캡처다.
- 안 찍음: 2, 6, 10–13 (사용자가 나중으로 미룸).
- 커밋하지 않음: 19 `dock-profile`, 20 `name-dialog` — 이름·이메일이 보여 지웠다.
- **개념·해답 통합 전**: 3 `canvas-toolbar`, 5 `answer-sheet-view`, 8 `concept-sheet`는 툴바에 해답·개념 버튼이 따로 있던 빌드다. 지금 빌드는 '개념·해답' 버튼 하나와 탭 시트다(`4b-notes.md`의 "개념·해답 통합 시트").
