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
