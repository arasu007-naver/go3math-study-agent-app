# UI 디자인 개선 — 단계 3 (토큰·공통 컴포넌트·상태 규칙) 설계

- 작성일: 2026-11-10
- 상위 스펙: `docs/design/qoolla-ui-design-improvement-spec.md` (이하 "개선 스펙") §단계 3, §단계 3 필수 세부 작업
- 선행: 단계 1 진단 `docs/ui-redesign/01-diagnosis.md`, 버튼·칩 조사 `docs/ui-redesign/01-buttons-chips-survey.md`, 단계 2 `docs/ui-redesign/02-ia-overlay-roles.md` (2026-11-10 Gate B 승인, §9)
- 기준 커밋: `3846de6` (`design/ui-redesign`)
- 범위: 개선 스펙 단계 3. **Gate C 승인 요청에서 끝난다.** 사용처 교체는 단계 4(파일럿)·5(확산)다.

## 1. 목표

단계 1이 찾은 드리프트(hex 리터럴 154건, 칩 선택색 4가지, "가자!!!" 표현 4가지, 주요 버튼 채움색 3가지)를 하나의 작은 체계로 모은다. 공용 `Button`·`Chip`·`StateView`·`Dialog`를 코드와 테스트로 만들고, 아직 코드로 만들지 않는 규칙(시트 높이, 학습장 시트, 카드, 글자, 아이콘)은 문서로 정한다. 사용자는 실행되는 컴포넌트와 문서를 보고 Gate C를 판단한다.

성공 기준:

1. `src/ui/Button.tsx`, `src/ui/Chip.tsx`, `src/ui/StateView.tsx`, `src/ui/Dialog.tsx`가 있고 `__tests__/`의 테스트가 통과한다.
2. `src/ui/theme.ts`에 토큰 3개(`layout.controlSm`, `layout.railOpacity`, `layout.dialogMax`)가 더해지고 기존 값은 바뀌지 않는다.
3. 새 컴포넌트 네 파일에 hex 색 리터럴과 `fontSize` 숫자가 없다(드리프트 가드 테스트).
4. `docs/ui-redesign/03-tokens-components.md`, `docs/ui-redesign/03-components-inventory.md`가 있고 `docs/ui-redesign/tools/check-inventory.mjs`가 통과한다.
5. `DESIGN.md`가 새 컴포넌트와 토큰을 담는다.
6. `git diff --stat 3846de6 -- app src package.json`에 나오는 파일이 `src/ui/Button.tsx`, `src/ui/Chip.tsx`, `src/ui/StateView.tsx`, `src/ui/Dialog.tsx`, `src/ui/theme.ts`뿐이다. 기존 사용처(`GoButton` 28곳 포함)는 그대로다.
7. jest 전체 결과가 기준보다 나빠지지 않는다. 기준: 기존 실패 스위트 3개(`canvasSize`, `notices`, `timeline`)는 이번 작업과 무관하게 실패한다.

## 2. 결정 사항 (단계 3 브레인스토밍, 2026-11-10)

| # | 질문 | 결정 |
|---|---|---|
| S1 | Gate C 전에 무엇을 코드로 내는가 | **문서 + 컴포넌트 코드.** `Button`·`Chip` 등은 테스트와 함께 만들고 토큰을 `theme.ts`에 더한다. 사용처는 Gate C 전에 바꾸지 않는다 |
| S2 | `Button`·`Chip` 외에 코드로 만들 것 | **StateView, Dialog, rail 투명도 토큰.** 시트 높이 단계와 학습장 Bottom Sheet 전환(Gate B Q4, Q5)은 문서 규칙만 두고 코드는 단계 4 |
| S3 | 새 `Button`과 `GoButton`의 관계 | **안 A: `src/ui`에 새로 만든다.** `GoButton`은 건드리지 않고, 단계 4·5에서 사용처를 옮긴 뒤 삭제한다. 대가: 한동안 버튼 구현이 둘이다 |
| — | 섹션 1~3 | 사용자 승인("Looks right") |

버린 안: `GoButton`을 그 자리에서 고치는 안(B)은 28곳의 모양이 한꺼번에 바뀌어 Gate C가 막는 일괄 수정이 된다. `GoButton`을 감싸는 안(C)은 D-01·D-12의 원인인 덮어쓰기 prop과 role 누락을 그대로 물려받는다.

## 3. 구조

- 새 파일은 모두 `src/ui/`에 둔다(`theme.ts`, `Sheet.tsx`와 같은 곳).
- `Dialog`는 기존 `src/ui/Sheet.tsx`(scrim + 가운데 카드 모달) 위에 만든다. 같은 역할의 모달을 새로 만들지 않는다(개선 스펙 세부 작업 2).
- 컴포넌트는 `theme.ts` 값만 읽는다. 호출부는 `color`·`textColor`·`textStyle`을 넘길 수 없다. `style`은 배치 키(`margin*`, `flex*`, `alignSelf`)만 받는다. 타입으로 막는다.
- 아이콘은 이미 의존성에 있는 `@expo/vector-icons`의 Ionicons를 쓴다. 의존성 추가 없음.

## 4. 토큰

기존 값은 바꾸지 않는다. 새 값은 1안+근거이고 Gate C에서 승인받는다.

| 토큰 | 값 | 쓰는 곳 | 근거 |
|---|---|---|---|
| `layout.hit` (기존) | 44 | `Button` `md` 최소 높이 | 44pt 터치 기준. `StudyNoteForm`, `PdfViewerModal`, `InstructionCard`, `ProfileActions`가 이미 44 |
| `layout.controlSm` (새) | 32 | `Button` `sm`, `Chip` 최소 높이. hitSlop으로 44까지 | 밀집 행에서 가장 흔한 높이(`GoButton` small, 파일 내부 `Chip` 둘). hitSlop으로 D-07의 44 미달을 행 높이를 늘리지 않고 고친다 |
| `layout.railOpacity` (새) | 0.88 | rail 카드 바탕 투명도(Gate B Q3) | 흰 pill 위 아이콘이 카드 위에서도 읽히고, 가려진 글자가 "뒤에 있다"고 보일 만큼 비친다. 실기기 확인은 단계 4. 이 단계에서는 토큰만 두고 `ChatRail`에 적용하지 않는다 |
| `layout.dialogMax` (새) | 400 | `Dialog` 최대 폭 | `layout.chatMax`와 같다. 버튼 두 개와 한국어 제목 한 줄이 들어간다 |
| 새 색 없음 | — | — | 칩 선택색 4가지와 주요 채움색 3가지가 모두 `accent`·`accentPress`·`accentSoft`·`accentText`로 모인다. 팔레트 밖 값(`#FF8800`, `#FFC256`, `#30B650`, slate 계열)은 새 토큰이 아니라 예외 대장의 "단계 4/5에서 교체" 행이 된다 |

## 5. 컴포넌트

### 5.1 `Button`

```ts
type ButtonProps = {
  variant: 'primary' | 'secondary' | 'danger' | 'text'; // 필수
  size?: 'md' | 'sm';                                    // 기본 md
  title: string;
  icon?: IoniconName;                                    // 앞쪽 아이콘
  onPress(): void | Promise<unknown>;
  disabled?: boolean;
  loading?: boolean;
  debounceMs?: number;                                   // 기본 400
  accessibilityLabel?: string;                           // 기본 title
  accessibilityHint?: string;
  style?: LayoutStyle;                                   // margin·flex·alignSelf만
};
```

- `variant`는 필수다. 호출부가 위계를 매번 고르게 한다(D-01의 원인 제거).
- 크기: `md` = `minHeight: layout.hit`, `sm` = `minHeight: layout.controlSm` + 44까지 hitSlop. 고정 `height`가 아니라 `minHeight`라서 글자를 키우면 버튼이 자란다(D-12).

| variant | 기본 | 눌림 | 비활성 |
|---|---|---|---|
| primary | `accent` 채움, `onAccent` 글자 | `accentPress` | `cardMuted` 채움, `disabled` 글자 |
| secondary | `card` + 1px `lineStrong`, `text` 글자 | `cardMuted` 채움 | `disabled` 글자·테두리 |
| danger | `danger` 채움, `onAccent` 글자 | 불투명도 0.85 | primary와 같음 |
| text | 채움 없음, `accentText` 글자 | `accentSoft` 채움 | `disabled` 글자 |

- 글자: `md`는 `type.title`, `sm`은 `type.bodyStrong`. 모서리 `radius.pill`.
- `GoButton`에서 그대로 가져오는 동작: 400ms 중복 누름 방지, 돌려받은 promise가 끝날 때까지 자동 loading.
- loading: 스피너가 라벨 자리에 뜨고 라벨은 투명하게 남아 폭이 바뀌지 않는다. 누름을 무시하고 `accessibilityState.busy`를 켠다.
- 누름 1.05 확대 애니메이션은 넣지 않는다. 네이티브 버튼은 색으로 눌림을 보인다.
- 접근성: 항상 `accessibilityRole="button"`, `accessibilityState`에 `disabled`·`busy`.

### 5.2 `Chip`

선택·필터 칩만 만든다. 코드의 칩 8개가 모두 이 종류이고 삭제 칩은 없다.

```ts
type ChipProps = {
  label: string;
  selected: boolean;
  onPress(): void;
  disabled?: boolean;
  accessibilityRole?: 'button' | 'radio' | 'checkbox'; // 기본 'button'
  style?: LayoutStyle;
};
```

- 비선택 `cardMuted` 채움 + `subtle` 글자, 선택 `accentSoft` 채움 + 1px `accent` 테두리 + `accentText` 글자, 눌림 `accentSoftPress`, 비활성 `disabled` 글자.
- `minHeight: layout.controlSm`, hitSlop으로 44, `radius.pill`, 글자 `type.bodyStrong`.
- `accessibilityState.selected`를 알린다.
- 눌리지 않는 라벨("계열 선택 →", `ExamSearchPanel.tsx:103`)은 칩이 아니라 글자가 된다(D-05). 인벤토리에 그렇게 적는다.
- 읽기 전용 `Tag`는 인벤토리에서 같은 배지가 여러 곳에 반복될 때만 다음 단계에 더한다. 이 단계에서는 만들지 않는다.

### 5.3 `StateView`

```ts
type StateViewProps = {
  kind: 'loading' | 'empty' | 'error';
  title: string;
  message?: string;
  action?: { title: string; onPress(): void | Promise<unknown> };
};
```

- loading: accent 스피너 + 제목. empty: 제목 + 설명 + `secondary` 동작(있으면). error: 제목 + 설명 + `primary` 동작(다시 시도·로그인).
- 모양을 아는 목록의 로딩은 기존 `SkeletonCards`를 계속 쓴다. `StateView` loading은 모양을 모를 때만 쓴다.
- 문구 규칙(문서): 무엇이 일어났는지 + 다음에 할 일. 기술 용어를 쓰지 않는다. 문구는 호출부가 넘긴다.

### 5.4 `Dialog`

```ts
type DialogProps = {
  visible: boolean;
  title: string;
  message?: string;
  children?: ReactNode;                                  // 입력이 있는 대화상자(이름 변경)
  onDismiss(): void;
  confirm: { title: string; onPress(): void | Promise<unknown>; variant?: 'primary' | 'danger' };
  cancel?: { title?: string; onPress?(): void };         // title 기본 '취소'
};
```

- `Sheet` 위에 놓인다. 제목 `type.title`, 설명 `type.body` + `subtle`. 버튼은 오른쪽 정렬 `[secondary 취소] [confirm]`, 둘 다 `md`. 최대 폭 `layout.dialogMax`.
- scrim을 누르거나 Android 뒤로 가기는 `onDismiss`(기존 `Sheet` 동작).

## 6. 코드로 만들지 않는 규칙 (`03-tokens-components.md`에 적는다)

코드는 단계 4다.

- **시트 높이 2단계(Gate B Q4)**: 이미 코드에 있는 값을 쓴다. "보기" = 화면 절반(지금의 해답·내 풀이), "넓게" = 70% snap(`src/kit/canvas/CanvasChrome.tsx:53`). 새 값을 정하지 않는다. 캔버스에서는 시트 아래 끝이 툴바 위 끝에서 멈춘다(Gate B 설계 Q2).
- **학습장 시트(Gate B Q5, NEW-01)**: Bottom Sheet 규칙, scrim 없음. `SheetHost` 변경은 단계 4.
- **rail(Gate B Q3)**: rail 카드 바탕이 `railOpacity`를 쓴다. 글자 겹침은 남는다. D-02는 부분 해결로 열려 있다.
- **Phone "지금 수업 중" 카드(Gate B Q1)**: 문구 1안 — 제목 "지금 수업 중 · {수업명}", 부제 "문제만 볼 수 있어요. 수업 참여는 태블릿에서 해요." 근거: 보기 전용이라고 말해야 수업 참여로 오해하지 않는다.
- **글자**: `type.*`만. 인벤토리가 직접 지정한 `fontSize` 63건을 가장 가까운 토큰에 대응시킨다.
- **아이콘**: 앱이 그리는 컨트롤에는 Ionicons만, 이모지는 쓰지 않는다(D-08).
- **카드**: 지금의 두 층 규칙(`bg` 위 `card`, `radius.md`/`lg`, `shadow.card`)을 적는다. 새 값 없음.
- **프로필 동작(D-11)**: 두 기기 모두 프로필 카드 바로 아래. 로그아웃은 구분선 뒤 맨 끝, `danger` 색의 `text` 버튼.

## 7. 인벤토리와 예외 대장

`docs/ui-redesign/03-components-inventory.md`:

- 대상: `rg -n "<(Pressable|TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback|Button)\b" app src`의 모든 결과(단계 1의 71건에서 시작, 그 뒤 생긴 것 포함) + 읽기 전용 `View` 배지(단계 1이 잡지 못한 것).
- 열: `파일:라인 / 역할 / 현재 표현 / 동작·상태 / 대상(Button variant·size, Chip, StateView, Dialog, 글자, 예외) / 예외 사유 / 교체 단계(4·5)`.
- 예외 대장(같은 문서 안): 잉크 색, `PencilFab`, `EdgeHandle`, `SheetHandle`, 네이티브 컨트롤, 카드·행·배경 닫기처럼 버튼이 아닌 눌리는 면. 사유를 적는다. 모양이 조금 다르다는 것만으로는 예외가 아니다(개선 스펙 세부 작업 7).
- 팔레트 밖 색(`#FF8800`, `#FFC256`, `#30B650`, slate, `'orange'` 등 UI 색)은 행마다 대체 토큰을 적는다. 잉크 색 `orange, blue, black, red, green`은 UI 색과 갈라 예외로 둔다.

`docs/ui-redesign/tools/check-inventory.mjs`: 위 `rg` 검색을 다시 돌려 모든 결과(`파일:라인`)가 인벤토리에 행으로 있는지, 대상 값이 허용 목록 안인지, 예외 행에 사유가 있는지 확인한다. 테스트는 `node:test`(`check-roles`와 같은 방식).

## 8. 문서

- `docs/ui-redesign/03-tokens-components.md`: §4 토큰 표, §5 API·상태별 사용 예제, §6 규칙, Gate C 질문, 소스 변경 파일 목록.
- `DESIGN.md`: impeccable `document`로 네 컴포넌트와 새 토큰 세 개를 더한다.
- `docs/ui-redesign/1794280544402-contituous-guide.md`: 단계 표와 "지금 멈춘 지점"을 갱신한다.

## 9. 검증

- jest + RNTL(`__tests__/`):
  - `Button`: 끝나지 않은 promise 동안 loading이고 두 번째 누름을 무시한다. debounce 안의 누름을 무시한다. disabled면 `onPress`를 부르지 않는다. role과 `disabled`·`busy` 상태를 알린다. `accessibilityLabel` 기본값이 title이다.
  - `Chip`: `selected`를 알리고 누르면 `onPress`를 부른다. disabled면 부르지 않는다.
  - `StateView`: 세 종류마다 제목이 보이고, `action`이 있으면 버튼이 뜨고 누르면 부른다.
  - `Dialog`: 확인·취소·scrim이 각각 해당 콜백을 부른다. `cancel`이 없으면 취소 버튼이 없다.
  - 드리프트 가드: 네 파일의 소스에 `#[0-9a-fA-F]{3,8}` 색 리터럴과 `fontSize: <숫자>`가 없다.
- `node --test docs/ui-redesign/tools/check-inventory.test.mjs` 통과, `check-inventory.mjs` 실제 실행 `OK`.
- `npx tsc --noEmit` 결과가 기준보다 나빠지지 않는다.
- `git diff --stat 3846de6 -- app src package.json`이 §1 성공 기준 6과 맞는다.
- 화면 변화가 없으므로 이 단계에서는 캡처를 찍지 않는다. 실기기 확인은 단계 4 파일럿(Gate B 설계 Q5).

## 10. Gate C 요청

`03-tokens-components.md`의 Gate C 절에서 묻는다. 답은 정하지 않는다.

1. 새 토큰 값 세 개(`controlSm` 32, `railOpacity` 0.88, `dialogMax` 400)를 받는가?
2. `Button` variant 표(§5.1)를 받는가?
3. Phone "지금 수업 중" 카드 문구 1안을 받는가?
4. 인벤토리의 예외 대장과 교체 단계(4·5) 배정을 받는가?

## 11. 지킬 것

- 로직·프로토콜·저장·권한·라우트 의미는 바꾸지 않는다. Pretendard 유지, `react-native-paper` 재도입 금지, dark mode 구현 금지, 새 스타일 체계·의존성 금지.
- 잉크 색 저장값과 MMKV 값은 바꾸지 않는다.
- Gate C 전에 기존 화면 코드를 고치지 않는다(사용처 교체 없음).
- 상태 값은 `미착수 | 진행 | 승인대기 | 완료 | blocked`만 쓴다.
- push·PR·배포는 사용자가 지시할 때만. `d0a5d1c`는 사용자 결정 전까지 건드리지 않는다.
