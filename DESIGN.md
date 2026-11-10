---
name: Go3 Math
description: 에이전트가 이끄는 수능 수학 학습 앱. 옅은 회색 바닥 위에 흰 카드가 떠 있고, 주황은 행동에만 쓴다.
colors:
  accent: "#F97316"
  accent-press: "#EA580C"
  accent-text: "#C2410C"
  accent-soft: "#FFF7ED"
  accent-soft-press: "#FFEDD5"
  bg: "#F7F7F8"
  card: "#FFFFFF"
  card-muted: "#EFEFF1"
  text: "#18181B"
  subtle: "#3F3F46"
  muted: "#71717A"
  disabled: "#A1A1AA"
  line: "#E4E4E7"
  line-strong: "#D4D4D8"
  scrim: "rgba(24,24,27,0.32)"
  success: "#16A34A"
  danger: "#DC2626"
  warn-soft: "#FEF3C7"
typography:
  heading:
    fontFamily: "Pretendard-Bold, system-ui"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: "28px"
  title:
    fontFamily: "Pretendard-SemiBold, system-ui"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: "22px"
  body-strong:
    fontFamily: "Pretendard-SemiBold, system-ui"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
  body:
    fontFamily: "Pretendard-Regular, system-ui"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  caption:
    fontFamily: "Pretendard-Regular, system-ui"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "16px"
  tab-label:
    fontFamily: "Pretendard-SemiBold, system-ui"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: "14px"
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
  pill: "999px"
spacing:
  xxs: "2px"
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.card}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-primary-pressed:
    backgroundColor: "{colors.accent-press}"
  button-secondary:
    backgroundColor: "{colors.card}"
    borderColor: "{colors.line-strong}"
    textColor: "{colors.text}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-secondary-pressed:
    backgroundColor: "{colors.card-muted}"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.card}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-text:
    textColor: "{colors.accent-text}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-text-pressed:
    backgroundColor: "{colors.accent-soft}"
  button-sm:
    typography: "{typography.body-strong}"
    padding: "0 12px"
    height: "32px"
  chip:
    backgroundColor: "{colors.card-muted}"
    textColor: "{colors.subtle}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: "0 12px"
    height: "32px"
  chip-selected:
    backgroundColor: "{colors.accent-soft}"
    borderColor: "{colors.accent}"
    textColor: "{colors.accent-text}"
  chip-pressed:
    backgroundColor: "{colors.accent-soft-press}"
  dialog:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
    padding: "16px"
    width: "400px"
  surface-card:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.lg}"
  tutor-box:
    backgroundColor: "{colors.card-muted}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px"
  segment-bar:
    backgroundColor: "{colors.card-muted}"
    rounded: "{rounded.pill}"
    padding: "2px"
    height: "56px"
  segment-active:
    backgroundColor: "{colors.card}"
    textColor: "{colors.accent-text}"
    typography: "{typography.tab-label}"
    rounded: "{rounded.pill}"
  floating-toolbar:
    backgroundColor: "{colors.card}"
    rounded: "{rounded.pill}"
    padding: "0 8px"
    height: "52px"
  toast:
    backgroundColor: "{colors.card}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "12px"
    width: "360px"
  icon-button:
    rounded: "{rounded.pill}"
    size: "44px"
  icon-button-on:
    backgroundColor: "{colors.accent-soft}"
    rounded: "{rounded.pill}"
    size: "44px"
---

# Design System: Go3 Math

## Overview

**Creative North Star: "The Quiet Desk"**

Go3 Math는 학생의 책상이다. 주인공은 학생의 필기와 문제이고, 인터페이스는 책상 위 도구처럼 한쪽에 물러나 있다가 필요할 때만 손에 잡힌다. 옅은 회색 바닥(`bg`) 위에 흰 카드(`card`)가 떠 있는 두 층 구조가 전부이고, 그 외의 장식은 없다. 영역은 선이 아니라 면과 아주 옅은 그림자로 나눈다.

컴포넌트는 **부드럽고 또렷하다.** 모서리는 둥글고 터치 영역은 넉넉하다(최소 44). 화면마다 주 행동은 하나이며, 주황으로 칠해져 한눈에 들어온다. 나머지 선택지는 회색 면이라서 주 행동과 다투지 않는다. 에이전트와 튜터는 필요한 순간에만 drawer·toast·모달로 나타났다가 들어간다. 대화 화면이 앱의 중심을 차지하지 않는다.

이 시스템은 과거에 주황 테두리로 칸막이를 친 화면을 버리고 만들어졌다. 게임 같은 학습 앱(배지·마스코트·화려한 보상 연출)과 채팅 앱 같은 화면(에이전트를 말풍선 대화창으로 만드는 것)도 피한다.

**Key Characteristics:**
- 두 층: 회색 바닥 + 떠 있는 흰 카드. 가장자리와 카드 사이는 12.
- 주황은 행동·선택·읽지 않음·진행에만 쓴다.
- Pretendard 400/600/700, 다섯 단계 위계와 하단 바 라벨.
- 오버레이(drawer, toast, 툴바)는 자기 영역만 터치를 받고, 그 밖의 필기는 막지 않는다.
- 모션은 짧고 차분하며, 감소 모션 설정을 따른다.

## Colors

중립 회색(zinc 계열) 위에 따뜻한 주황 하나만 있는 팔레트다. 색은 드물게 쓰기 때문에 의미가 있다.

### Primary
- **Desk Lamp Orange** (`accent`): 주 버튼, 활성 상태, 진행 바, 레일 구분선, drawer 핸들처럼 "누르면 일이 진행되는" 곳에만 쓴다.
- **Pressed Ember** (`accent-press`): 주황 요소를 누른 상태. 읽지 않음 점(`unread`)도 이 값을 쓴다.
- **Burnt Label** (`accent-text`): 흰 바탕 위 주황 글자(활성 탭 라벨, 에이전트 라벨). `accent`보다 대비가 높아 글자에 쓴다.
- **Morning Glow** (`accent-soft`) / **Warm Press** (`accent-soft-press`): 아이콘 버튼의 켜짐 면, 세그먼트 눌림 면, 채팅 진입 버튼 바탕.

### Neutral
- **Desk Surface** (`bg`): 앱 바닥. 카드가 놓이는 면이다.
- **Paper White** (`card`): 카드, 패널, drawer, dock, 툴바, toast, 캔버스.
- **Pencil Tray** (`card-muted`): 카드 안 보조 면. 보조 버튼, 세그먼트 바 바탕, 튜터 말풍선 상자.
- **Ink** (`text`) / **Graphite** (`subtle`) / **Lead Gray** (`muted`) / **Eraser Gray** (`disabled`): 본문, 보조 글, 라벨·안내, 비활성.
- **Hairline** (`line`) / **Hairline Strong** (`line-strong`): 꼭 필요할 때만 1px로 쓴다.
- **Scrim** (`scrim`): Phone 하단 모달 뒤 딤.

### Status
- **Success** (`success`), **Danger** (`danger`), **Warn Soft** (`warn-soft`): 온라인 상태·저장 완료, 오류, 경고 바탕. 상태 표시에만 쓰고 장식에는 쓰지 않는다.

### Named Rules
**The Action-Only Orange Rule.** 주황은 행동·선택·읽지 않음·진행에만 쓴다. 테두리, 구획선, 제목 장식, 배경 면에는 쓰지 않는다.

**The Ink Is Not Chrome Rule.** 필기 잉크 색(`orange, blue, black, red, green`)은 사용자 데이터이며 실황 동기화에 쓰이는 값이다. UI 크롬 토큰과 섞지 않고 바꾸지도 않는다.

**The One Token File Rule.** 모든 색은 `src/ui/theme.ts`에서 가져온다. 새 hex를 화면 파일에 직접 쓰지 않는다. `surface`, `ground`, `border`, `agent*`, `tutor`는 하위 호환용이므로 새 코드에서 쓰지 않는다.

## Typography

**Body Font:** Pretendard (Regular 400 / SemiBold 600 / Bold 700, 번들). 로드에 실패하면 시스템 폰트로 대체된다.

**Character:** 한글이 반듯하고 숫자가 또렷한 산세리프 한 가족만 쓴다. 위계는 크기보다 굵기로 나눈다. 500은 번들하지 않는다.

### Hierarchy
- **Heading** (700, 20/28): 패널·화면 제목("에이전트", "타임라인").
- **Title** (600, 16/22): 카드 제목, 섹션 제목.
- **Body Strong** (600, 14/20): 버튼 글자, toast 본문, 강조할 목록 항목.
- **Body** (400, 14/20): 일반 본문, 목록, 안내.
- **Caption** (400, 12/16): 라벨, 메타 정보, 도움말.
- **Tab Label** (600, 11/14): 하단 바·툴바 라벨 전용, 한 줄.

### Named Rules
**The Read-Aloud Rule.** 에이전트·튜터가 학생에게 건네는 문장은 Title 크기(16/22)에 Body 굵기(400)로 쓴다. 학생이 읽어야 하는 글이므로 작게 쓰지 않고, 굵게 해서 외치지도 않는다.

**The Android Family Rule.** 굵기는 `fontWeight`만으로 고르지 않는다. 굵기별 `fontFamily`(Pretendard-Regular/SemiBold/Bold)를 함께 지정한다. 그래야 Android에서도 굵기가 맞게 나온다.

## Layout

- **모드**: 짧은 변 600 이상이면 Tablet(이탈 560 미만, 200ms 디바운스), 그보다 작으면 Phone. 모드는 실시간으로 바뀌며, 레이아웃을 바꿀 때 조건부 렌더 대신 스타일만 바꿔 상태가 리마운트되지 않게 한다.
- **Gutter 12**: 화면 가장자리와 카드 사이, 카드와 카드 사이 간격.
- **Tablet**: Stage(캔버스·콘텐츠)가 전체를 쓴다. 에이전트 drawer는 왼쪽에서 오른쪽으로 열리고 Stage 위에 겹친다(폭 30%, 300~400, 펼친 폴더블은 최대 40%). 접히면 폭 64의 레일이 된다. Dock 카드는 최대 560. 튜터 toast는 우상단에 폭 360으로 뜬다.
- **Phone**: instruction은 하단 탭 바로 위의 하단 모달로 띄운다.
- **하단 고정 바**: 높이 56, 아이콘 22 + 라벨 6칸(공지·검색·타임라인·실황·주간·내 정보), 한 줄.
- **캔버스**: 좌우 여백 6, 하단 가운데 플로팅 툴바(높이 52). 툴바는 하단 바·drawer·toast와 최소 16 떨어진다. 가로이면 화면 안에서 기능을 제한한다.
- **간격 리듬**: 2·4·8·12·16·24·32. 카드 안 기본 패딩과 요소 간격은 12와 8이다.
- **조작 높이**: 기본 44(`layout.hit`), 밀집 행 32(`layout.controlSm`, hitSlop으로 터치 영역 44). 고정 높이가 아니라 최소 높이라 글자를 키우면 자란다.
- **대화상자 폭**: 최대 400(`layout.dialogMax`), 좁은 화면에서는 화면 폭 − gutter×2.
- **rail 투명도**: rail 카드 바탕 0.88(`layout.railOpacity`, 단계 4에서 적용). 겹친 글자가 뒤에 있다는 것이 보이게 한다.
- **쌓임 순서**: canvas 0 < dock 10 < drawer 20 < toolbar 30 < toast 40 < modal 50.

## Elevation & Depth

깊이는 두 층의 면 차이와 아주 옅고 넓게 퍼지는 그림자로만 만든다. 테두리로 깊이를 흉내 내지 않는다. 그림자는 iOS에서는 shadow 속성, Android에서는 elevation으로 그린다.

### Shadow Vocabulary
- **Card** (iOS `0 4 12` 검정 6%, Android elevation 3): 바닥에 놓인 카드, 세그먼트 바의 활성 pill.
- **Float** (iOS `0 8 24` 검정 10%, Android elevation 8): 다른 것 위에 떠 있는 것. drawer, dock, 레일, 플로팅 툴바, toast, 엣지 핸들.

### Named Rules
**The Float-Means-Overlay Rule.** Float 그림자는 Stage 위에 겹치는 요소에만 쓴다. 바닥에 놓인 카드에 쓰면 무엇이 떠 있는지 구분이 안 된다.

## Shapes

모든 모서리는 둥글고, 크기가 클수록 반경도 크다. 패널 크기의 카드(drawer, dock)는 20, 버튼·말풍선 상자·toast는 12, 작은 칩과 썸네일은 8이다. 툴바, 세그먼트 바, 레일, 아이콘 버튼, 상태 점처럼 떠다니는 도구는 완전한 원형(pill)이다. 원형 바 안의 활성 pill과 눌림 면도 원형으로 맞춰, 양 끝 칸에서 모서리가 바 밖으로 나오지 않게 한다. 구분선은 꼭 필요할 때만 1px로 쓴다.

## Components

### Buttons
공용 `Button`(`src/ui/Button.tsx`, 단계 3, Gate C 승인 대기). 위계는 호출부가 `variant`로 반드시 고른다. 색·글자를 덮어쓸 수 없다.
- **Shape:** 원형(pill). 최소 높이 44(`md`) 또는 32(`sm`, 터치 영역 44). 좌우 패딩 16(`sm` 12). 글자는 Title(`sm`은 Body Strong). 2026-11 단계 3 전에는 모서리 12, 좌우 패딩 12, Body Strong이었다.
- **Primary:** Desk Lamp Orange 면 + 흰 글자. 화면(카드)당 하나만 둔다. 누르면 Pressed Ember.
- **Secondary:** Paper White 면 + 1px Hairline Strong 테두리 + Ink 글자. 누르면 Pencil Tray. 단계 3 전에는 Pencil Tray 면이었다.
- **Danger:** Danger 면 + 흰 글자. 되돌릴 수 없는 확인에만 쓴다. 누르면 불투명도 0.85.
- **Text:** 면 없이 Burnt Label 글자. 누르면 Morning Glow 면.
- **비활성:** Pencil Tray 면 + Eraser Gray 글자(Text·Secondary는 글자·테두리만 Eraser Gray). 불투명도로 흐리게 하지 않는다.
- **Loading:** 글자 자리에 스피너가 뜨고 폭은 그대로다. 돌려받은 promise가 끝날 때까지 자동으로 켜지고, 400ms 안의 중복 누름을 무시한다.
- **Pressed:** 색만 바뀐다. 누를 때 커지는 애니메이션은 쓰지 않는다.
- **Icon button:** 44 원형. 평소에는 투명, 켜지면 Morning Glow, 누르면 Warm Press. 공용 컴포넌트로 만들지는 Gate C에서 정한다.

### Chips
공용 `Chip`(`src/ui/Chip.tsx`). 선택·필터에만 쓴다. 눌리지 않는 라벨을 칩 모양으로 그리지 않는다.
- 원형, 최소 높이 32(터치 영역 44), 좌우 패딩 12, Body Strong.
- 비선택 Pencil Tray 면 + Graphite 글자, 선택 Morning Glow 면 + 1px Desk Lamp Orange 테두리 + Burnt Label 글자, 누르면 Warm Press. 비선택에도 투명 테두리를 둬 선택할 때 크기가 바뀌지 않는다.
- 역할은 button(기본)·tab·radio·checkbox 중 하나로 알린다.

### State View (로딩·빈·오류)
공용 `StateView`(`src/ui/StateView.tsx`). 가운데 정렬, 제목 Title + Ink, 설명 Body + Lead Gray. 오류에는 주요 버튼(다시 시도·로그인), 비었을 때는 보조 버튼을 단다. 문구는 무엇이 일어났는지와 다음에 할 일을 말하고 기술 용어를 쓰지 않는다. 모양을 아는 목록의 로딩은 스켈레톤 카드를 쓴다.

### Dialog
공용 `Dialog`(`src/ui/Dialog.tsx`). 딤 위 가운데 Paper White 카드(20 모서리, Float 그림자, 패딩 16), 최대 폭 400. 제목 Title, 설명 Body + Graphite, 필요하면 입력, 오른쪽 아래에 `[보조 취소] [확인]`. 확인은 Primary 또는 Danger. 딤을 누르거나 뒤로 가기를 하면 닫힌다.

### Cards / Containers
- **Corner Style:** 패널은 20, 내부 상자는 12.
- **Background:** Paper White가 Desk Surface 위에 놓인다. 카드 안 보조 면은 Pencil Tray.
- **Shadow Strategy:** 바닥에 놓인 카드는 Card, 겹쳐 뜬 패널은 Float.
- **Border:** 없음.
- **Internal Padding:** 12~16.

### Navigation (하단 고정 바)
- Pencil Tray 바탕의 원형 세그먼트 바. 6칸이 균등하고, 각 칸은 아이콘 22 + Tab Label이다.
- 활성 칸은 흰 원형 pill(Card 그림자)이 미끄러져 와서 표시하고, 라벨과 아이콘은 Burnt Label 색이 된다. 비활성 칸은 Lead Gray. 누르면 Warm Press 면.

### Instruction Card (에이전트·튜터 안내)
- 위에 Caption 라벨("에이전트" / 튜터 이름), 아래에 Read-Aloud 문장, 그 밑에 선택지 버튼을 세로로 쌓는다(간격 8).
- 튜터 메시지는 Pencil Tray 상자(12, 패딩 12)에 담아 에이전트 문장과 구분한다.
- 같은 렌더러를 Tablet drawer와 Phone 하단 모달에 쓴다.

### Tutor Toast
- 우상단, 폭 360, Paper White + Float 그림자, 12 모서리. Caption 제목과 Body Strong 미리보기(24~30자)를 보여 준다.
- 바닥에 3px 주황 진행 바가 6.4초 동안 줄어든다. 터치하는 동안 멈추고, 탭하면 drawer가 열린다.

### Floating Toolbar (캔버스)
- 하단 가운데의 원형 바, 높이 52, Float 그림자. 버튼은 44 원형이고 아이콘 22, 필요하면 10pt 라벨을 단다.
- 도구 그룹 사이는 hairline 세로선으로 나누고, 현재 펜 색은 채운 원으로 표시한다. 펜 속성은 같은 툴바에서 팝오버로 연다.

### Agent Rail & Edge Handle
- 접힌 drawer는 폭 64의 흰 원형 레일(Float)이 되고, 드래그 손잡이와 항목 사이에 주황 구분선을 둔다.
- 읽지 않음은 10px 점으로 표시한다(`unread`, 2px 흰 테두리).
- 엣지 핸들은 44 주황 원형 버튼(Float)이다.

## Do's and Don'ts

### Do:
- **Do** 모든 스타일을 `StyleSheet.create`와 `src/ui/theme.ts` 토큰으로 쓴다.
- **Do** 화면마다 주 행동은 주황 버튼 하나로 두고, 나머지는 Pencil Tray 보조 버튼으로 둔다.
- **Do** 영역은 면(Desk Surface와 Paper White)과 12 간격으로 나눈다.
- **Do** 모든 터치 대상을 최소 44로 만든다.
- **Do** 오버레이에 `pointerEvents="box-none"` 구조를 유지해, 자기 영역 밖의 필기 입력을 통과시킨다.
- **Do** 애니메이션은 reanimated 4로 하고(fast 150 / base 220 / slow 320 ms, spring damping 22·stiffness 240), `useReducedMotion`을 따른다.

### Don't:
- **Don't** 주황 테두리나 주황 선으로 화면을 칸막이처럼 나누지 않는다.
- **Don't** 배지, 마스코트, 화려한 보상 연출처럼 게임 같은 학습 앱의 장식을 넣지 않는다.
- **Don't** 에이전트를 말풍선이 줄줄이 쌓이는 채팅 앱 화면으로 만들지 않는다. 안내는 Instruction Card로 필요할 때만 띄운다.
- **Don't** 화면 파일에 새 hex 값을 직접 쓰거나, 하위 호환 토큰(`surface`, `ground`, `border`, `agent*`, `tutor`)을 새 코드에 쓰지 않는다.
- **Don't** toast 시간 6.4초와 모드 판단 기준(600/560)을 디자인 작업에서 바꾸지 않는다.
- **Don't** 새 스타일 라이브러리(NativeWind, Tamagui, react-native-paper)를 들이지 않는다.
