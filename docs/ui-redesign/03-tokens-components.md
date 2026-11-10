# 단계 3 — 토큰·공통 컴포넌트·상태 규칙

Method: `expo-design-system`(기존 `theme.ts` 채택·확장, variant/size/state 계약) + `impeccable` `extract`(반복 패턴 → 공용 컴포넌트)·`document`(DESIGN.md) + `vercel-react-native-skills`(Pressable·접근성). 기존 사용처는 바꾸지 않았다.

## 1. 요약

| 항목 | 값 |
|---|---|
| 단계 / 상태 | 단계 3 / **승인대기** — Gate C 검토 중. 질문은 §6 |
| 기준 | `3846de6` (`design/ui-redesign`), 작업 브랜치 `design/ui-redesign-stage3` |
| 설계·계획 | `docs/superpowers/specs/2026-11-10-ui-redesign-stage3-design.md`, `docs/superpowers/plans/2026-11-10-ui-redesign-stage3.md` |
| 사용한 스킬 | `expo-design-system`, `impeccable` `extract`·`document`, `vercel-react-native-skills` |
| 쓰지 않은 스킬 | `expo-native-ui`(조건부, 네이티브 컨트롤을 새로 쓰지 않아 필요 없었다), `ui-ux-pro-max` |
| 산출물 | 이 문서, `docs/ui-redesign/03-components-inventory.md`(인벤토리·예외 대장), `src/ui/{Button,Chip,StateView,Dialog}.tsx`, `src/ui/theme.ts`의 토큰 3개, `DESIGN.md` |
| 화면 변화 | 없음. 아무 화면도 새 컴포넌트를 쓰지 않는다. 캡처를 찍지 않았다(실기기 확인은 단계 4 파일럿) |
| 검증 | §7 |

## 2. 토큰

기존 값은 바꾸지 않았다. 새 값 세 개는 1안+근거다.

| 토큰 | 값 | 쓰는 곳 | 근거 |
|---|---|---|---|
| `layout.hit` (기존) | 44 | `Button` `md` 최소 높이, hitSlop 목표 | 44pt 터치 기준. `StudyNoteForm`, `PdfViewerModal`, `InstructionCard`, `ProfileActions`가 이미 44 |
| `layout.controlSm` (새) | 32 | `Button` `sm`, `Chip` 최소 높이 | 밀집 행에서 가장 흔한 높이(`GoButton` small, 파일 내부 `Chip` 둘). hitSlop으로 44까지 채워 D-07의 44 미달을 행 높이를 늘리지 않고 고친다 |
| `layout.railOpacity` (새) | 0.88 | rail 카드 바탕(Gate B Q3) | 흰 pill 위 아이콘이 카드 위에서도 읽히고, 가려진 글자가 "뒤에 있다"고 보일 만큼 비친다. 아직 `ChatRail`에 적용하지 않았다(단계 4) |
| `layout.dialogMax` (새) | 400 | `Dialog` 최대 폭 | `layout.chatMax`와 같다. 버튼 두 개와 한국어 제목 한 줄이 들어간다. 좁은 화면에서는 `화면 폭 - gutter×2` |
| 새 색 | 없음 | — | 칩 선택색 4가지와 주요 채움색 3가지가 모두 `accent`·`accentPress`·`accentSoft`·`accentText`로 모인다. 팔레트 밖 값은 인벤토리 §4에서 기존 토큰으로 대응시켰다 |

## 3. 컴포넌트

모두 `src/ui/`에 있고 `theme.ts` 값만 읽는다. 호출부는 색·글자 스타일을 넘길 수 없고 `style`은 배치 키(`margin*`, `flex*`, `alignSelf`)만 받는다(`LayoutStyle`, 타입으로 막는다). 네 파일에 hex 색과 숫자 `fontSize`가 없다는 것을 `__tests__/uiDrift.test.ts`가 확인한다.

### 3.1 `Button` (`src/ui/Button.tsx`)

```ts
variant: 'primary' | 'secondary' | 'danger' | 'text'   // 필수
size?: 'md' | 'sm'                                     // md = minHeight 44, sm = minHeight 32 + hitSlop 44
title: string; icon?: Ionicons 이름
onPress(): void | Promise<unknown>; disabled?; loading?; debounceMs = 400
accessibilityLabel? (기본 title); accessibilityHint?; style?: LayoutStyle
```

| variant | 기본 | 눌림 | 비활성 |
|---|---|---|---|
| primary | `accent` 채움, `onAccent` 글자 | `accentPress` | `cardMuted` 채움, `disabled` 글자 |
| secondary | `card` + 1px `lineStrong`, `text` 글자 | `cardMuted` 채움 | `disabled` 글자·테두리 |
| danger | `danger` 채움, `onAccent` 글자 | 불투명도 0.85 | primary와 같음 |
| text | 채움 없음, `accentText` 글자 | `accentSoft` 채움 | `disabled` 글자 |

글자 `md` = `type.title`, `sm` = `type.bodyStrong`. 모서리 `radius.pill`. 아이콘은 18, 글자와 `space.xs` 간격.

상태별 사용 예:

```tsx
// default — 화면(카드)당 하나의 주요 동작
<Button variant="primary" title="가자!!!" onPress={submit} />
// pressed — 따로 넘길 것이 없다. 눌리는 동안 variant 표의 '눌림' 색
// disabled
<Button variant="primary" title="저장" onPress={save} disabled={!valid} />
// loading — promise를 돌려주면 끝날 때까지 자동으로 스피너, 중복 누름 무시
<Button variant="primary" title="답 보내기" onPress={() => sendAnswer()} />
// loading을 밖에서 정할 때
<Button variant="secondary" title="다시 불러오기" onPress={reload} loading={isFetching} />
// 밀집 행
<Button variant="secondary" size="sm" title="학습장" onPress={openNote} />
// 아이콘 + 글자
<Button variant="text" icon="chevron-back" title="풀이 목록" onPress={back} />
```

- `GoButton`에서 그대로 가져온 동작: 400ms 중복 누름 방지, promise 동안 자동 loading. promise가 실패하면 `console.warn`을 남기고 loading을 끈다(다시 누를 수 있다).
- 넣지 않은 것: 누름 1.05 확대 애니메이션. `color`·`textColor`·`textStyle` 덮어쓰기.
- 접근성: 항상 `accessibilityRole="button"`, `accessibilityState`에 `disabled`·`busy`. 고정 `height`가 아니라 `minHeight`라 글자를 키우면 자란다(D-12).

### 3.2 `Chip` (`src/ui/Chip.tsx`)

```ts
label: string; selected: boolean; onPress(): void; disabled?
accessibilityRole?: 'button' | 'tab' | 'radio' | 'checkbox'   // 기본 'button'
style?: LayoutStyle
```

- 비선택 `cardMuted` + `subtle` 글자, 선택 `accentSoft` + 1px `accent` 테두리 + `accentText` 글자, 눌림 `accentSoftPress`, 비활성 `disabled` 글자. 비선택도 투명 1px 테두리를 둬 선택할 때 크기가 바뀌지 않는다.
- `minHeight: layout.controlSm`, hitSlop 44, `radius.pill`, `type.bodyStrong`.
- `'tab'`은 설계(§5.2)에 없던 값이다. 지금 칩 넷이 `role=tab`을 쓰고 있어 교체 때 의미를 지키려고 더했다.

```tsx
// selected / 비선택 — 단일 선택
{subjects.map((s) => <Chip key={s} label={s} selected={s === subject} onPress={() => setSubject(s)} accessibilityRole="tab" />)}
// 다중 선택
<Chip label="2025" selected={years.has(2025)} onPress={() => toggleYear(2025)} accessibilityRole="checkbox" />
// disabled
<Chip label="미적분" selected={false} disabled onPress={pick} />
```

### 3.3 `StateView` (`src/ui/StateView.tsx`)

```ts
kind: 'loading' | 'empty' | 'error'; title: string; message?: string
action?: { title: string; onPress(): void | Promise<unknown> }   // error → primary, empty·loading → secondary
```

```tsx
// loading — 모양을 모를 때. 모양을 아는 목록은 SkeletonCards
<StateView kind="loading" title="불러오는 중이에요" />
// empty
<StateView kind="empty" title="아직 푼 문제가 없어요" message="문제를 풀면 여기에 쌓여요." action={{ title: '문제 풀러 가기', onPress: goSolve }} />
// error
<StateView kind="error" title="타임라인을 불러오지 못했어요" message="연결을 확인하고 다시 시도해 주세요." action={{ title: '다시 시도', onPress: refetch }} />
```

### 3.4 `Dialog` (`src/ui/Dialog.tsx`)

```ts
visible: boolean; title: string; message?: string; children?: ReactNode; onDismiss(): void
confirm: { title: string; onPress(): void | Promise<unknown>; variant?: 'primary' | 'danger' }
cancel?: { title?: string /* 기본 '취소' */; onPress?(): void /* 없으면 onDismiss */ }
```

- 기존 `src/ui/Sheet.tsx`(scrim + 가운데 카드) 위에 만들었다. scrim·Android 뒤로 가기는 `onDismiss`.
- 제목 `type.title`, 설명 `type.body` + `subtle`, 버튼은 오른쪽 `[secondary 취소] [confirm]`, 둘 다 `md`. 폭 `min(화면 폭 - 24, layout.dialogMax)`.

```tsx
// 위험한 확인(전체 지우기)
<Dialog visible={open} title="필기를 모두 지울까요?" message="지운 필기는 되돌릴 수 없어요." onDismiss={close}
  cancel={{}} confirm={{ title: '모두 지우기', variant: 'danger', onPress: clearAll }} />
// 입력이 있는 대화상자(이름 변경) — confirm이 promise를 돌려주면 끝날 때까지 loading
<Dialog visible={editing} title="이름 변경" onDismiss={close} cancel={{}} confirm={{ title: '저장', onPress: () => save(name) }}>
  <TextInput accessibilityLabel="새 이름" value={name} onChangeText={setName} />
</Dialog>
```

## 4. 규칙 (코드는 단계 4)

- **시트 높이 2단계(Gate B Q4)**: 이미 코드에 있는 값을 쓴다. "보기" = 화면 절반(지금의 해답·내 풀이), "넓게" = 70% snap(`src/kit/canvas/CanvasChrome.tsx:53`). 새 값을 정하지 않았다. 캔버스에서는 시트 아래 끝이 툴바 위 끝에서 멈춘다.
- **학습장 시트(Gate B Q5, NEW-01)**: Bottom Sheet 규칙, scrim 없음, 자기 영역만 덮는다. `SheetHost` 변경은 단계 4.
- **rail(Gate B Q3)**: rail 카드 바탕이 `layout.railOpacity`를 쓴다. 글자 겹침은 남는다. D-02는 부분 해결로 열어 둔다.
- **Phone "지금 수업 중" 카드(Gate B Q1)**: 문구 1안 — 제목 "지금 수업 중 · {수업명}", 부제 "문제만 볼 수 있어요. 수업 참여는 태블릿에서 해요." 근거: 보기 전용이라고 말해야 수업 참여로 오해하지 않는다.
- **글자**: `type.*`만 쓴다. 직접 지정한 `fontSize` 69줄의 대응 토큰은 인벤토리 §3.
- **아이콘**: 앱이 그리는 컨트롤에는 Ionicons만, 이모지는 쓰지 않는다(D-08). 재생 툴바의 ⏩◀️▶️도 대상이다(인벤토리 §1.1).
- **카드**: 지금의 두 층 규칙 그대로 — `bg` 위 `card`, 패널 `radius.lg`, 안쪽 상자 `radius.md`, 바닥 카드 `shadow.card`, 떠 있는 것 `shadow.float`, 테두리 없음. 카드 전체가 눌리는 곳(인벤토리 §5의 "버튼이 아닌 눌리는 면")은 눌림 때 `cardMuted` 바탕을 쓴다(지금은 제각각).
- **프로필 동작(D-11)**: 두 기기 모두 프로필 카드 바로 아래. 로그아웃은 구분선 뒤 맨 끝. 위험 동작이라는 것을 색 하나로만 보이지 않는다. 색 표현은 Gate C Q6.
- **Chip 역할**: 선택·필터만. 눌리지 않는 라벨("계열 선택 ->")은 칩 모양으로 그리지 않고 글자로 쓴다.

## 5. 인벤토리 요약

`docs/ui-redesign/03-components-inventory.md` §1(검증 대상) 76행:

| 대상 | 행 | 교체 단계 4 | 교체 단계 5 |
|---|---|---|---|
| `Button` | 19 (primary md 5, primary sm 1, secondary md 4, secondary sm 1, text md 7, text sm 1) | 14 | 5 |
| `Chip` | 8 | 3 | 5 |
| `Dialog` | 6 (대화상자 3개의 배경·버튼) | 4 | 2 |
| `예외` | 43 | — | — |

§1.1 `GoButton` 호출 28곳: Button 13, Chip 2, Dialog 2, 글자 1, 예외 10(펜 색·굵기 견본 8, 아이콘 전용 2).

배지(§2): 숫자 배지와 글자 태그가 각각 두 파일에서 따로 구현돼 있다. 아이콘 전용 버튼은 13곳이다(§1 11, §1.1 2).

## 6. Gate C 요청

답은 정하지 않았다.

1. 새 토큰 세 개(`controlSm` 32, `railOpacity` 0.88, `dialogMax` 400)를 받는가?
2. `Button` variant 표(§3.1)를 받는가? DESIGN.md는 지금까지 버튼을 **모서리 12**(`rounded.md`), 보조 버튼을 **`cardMuted` 채움**으로 적어 왔다. 단계 3 설계는 모서리 `pill`, 보조 버튼 `card` + 1px `lineStrong`으로 정했다(`InstructionCard`·`StudyNoteForm`은 12, `GoButton`·`TimelinePanel`·`DiaryPanel`은 pill). 이 문서와 DESIGN.md는 설계 쪽으로 고쳐 두었다. 12로 돌릴지 여기서 정한다.
3. Phone "지금 수업 중" 카드 문구 1안(§4)을 받는가?
4. 인벤토리의 대상·교체 단계 배정과 예외 대장(인벤토리 §1, §1.1, §5)을 받는가?
5. 아이콘 전용 버튼 13곳(rail 항목, 화살표, ✕ 닫기, 문제 행 동작 등)을 위해 단계 4에서 공용 `IconButton`(44 원형, DESIGN.md의 `icon-button`)을 더하는가, 예외로 두는가?
6. 위험 동작 중 채움이 과한 곳(로그아웃, 책갈피 해제)을 위해 `text`·`secondary`에 위험 색 표현을 더하는가, `danger` 채움으로 통일하는가?
7. 숫자 배지·글자 태그용 읽기 전용 `Tag`를 단계 4에서 더하는가?

## 7. 소스 변경 파일과 검증

소스 변경 파일(`git diff --stat 3846de6 -- app src package.json`):

- `src/ui/theme.ts` (토큰 3개 추가)
- `src/ui/Button.tsx`, `src/ui/Chip.tsx`, `src/ui/StateView.tsx`, `src/ui/Dialog.tsx` (새 파일)

검증:

| 명령 | 결과 |
|---|---|
| `npx jest __tests__/uiTokens.test.ts __tests__/uiButton.test.tsx __tests__/uiChip.test.tsx __tests__/uiStateView.test.tsx __tests__/uiDialog.test.tsx __tests__/uiDrift.test.ts` | 6 suites, 31 tests 통과 |
| `npx jest` | 실패 suite는 기존과 같은 무관한 것들뿐이다(§7.1) |
| `npm run typecheck` | 오류 0 (`@ts-expect-error` 타입 가드 포함) |
| `node --test docs/ui-redesign/tools/check-inventory.test.mjs` | 11/11 |
| `node docs/ui-redesign/tools/check-inventory.mjs docs/ui-redesign/03-components-inventory.md .` | `OK rows=76` |
| `node docs/ui-redesign/tools/check-roles.mjs …` | `OK rows=66 deviations=8` |

### 7.1 jest 기준

기준(`3846de6`): 3 suites 실패 — `canvasSize`, `timeline`, `notices`(3 tests). 마지막 전체 실행(단계 3 마지막 커밋)도 같은 세 suite, 3 tests 실패이고 251 tests 통과다(기준 225 + 이번에 더한 31 − 이 브랜치에 없는 다른 작업의 `answerBubblePlacement` 5). 작업 중 한 번은 `messageBox`가 전체 실행 부하에서 5000ms 시간 초과로 실패했다가 혼자 돌리면 통과했다. 어떤 기존 파일도 새 컴포넌트를 가져오지 않는다(`grep` 결과 없음).
