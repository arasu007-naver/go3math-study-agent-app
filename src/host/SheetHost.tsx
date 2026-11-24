// 앱 전역 시트 호스트: 에이전트 세션의 sheet 슬롯에 든 위젯을 가운데 카드 모달(공용 Sheet: RN Modal + scrim)로 띄운다.
// 키보드 회피는 Sheet의 KeyboardAvoidingView가 맡고, 카드 최대 높이는 키보드를 뺀 가용 높이의 90%다. 넘치는 내용은 위젯의 ScrollView가 스크롤한다.
// scrim·Android 뒤로 가기·"나중에"는 모두 위젯의 dismissRef(study_note_dismissed)로 보낸다. 세션이 비워서 닫을 때는 이벤트를 내지 않는다.
import { useEffect, useRef, useState } from 'react';
import { Keyboard, useWindowDimensions, type KeyboardEvent } from 'react-native';
import type { AgentSession, SessionSnapshot } from '../agent/session';
import { useAgentSession } from '../agent/useAgentSession';
import { Sheet } from '../ui/Sheet';
import { layout, radius } from '../ui/theme';
import { sheetWidgets } from './widgets';

const TABLET_CARD_MAX_W = 560;

type Props = { state?: SessionSnapshot; session?: AgentSession };

export function SheetHost(props: Props) {
  const live = useAgentSession();
  const state = props.state ?? live.state;
  const session = props.session ?? live.session;
  const { width, height } = useWindowDimensions();
  const dismissRef = useRef<(() => void) | null>(null);
  const [keyboardH, setKeyboardH] = useState(0);

  const sheet = state.sheet && sheetWidgets[state.sheet.componentId] ? state.sheet : null;
  const open = sheet !== null;
  // 닫히는 페이드 동안에도 내용을 그리도록 마지막 시트를 들고 있는다
  const [shown, setShown] = useState(sheet);
  if (sheet && sheet !== shown) setShown(sheet);
  // 닫혔다가 다시 열릴 때마다 늘린다: 다시 연 시트의 위젯은 새로 마운트되어 이전 finishedFor를 갖지 않는다
  const [generation, setGeneration] = useState(0);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setGeneration((g) => g + 1);
  }

  useEffect(() => {
    if (!open) {
      setKeyboardH(0);
      return;
    }
    const show = Keyboard.addListener('keyboardDidShow', (e: KeyboardEvent) => setKeyboardH(e.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener('keyboardDidHide', () => setKeyboardH(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, [open]);

  const Widget = shown ? sheetWidgets[shown.componentId] : undefined;
  if (!shown || !Widget) return null;

  const cardWidth = Math.min(width - layout.gutter * 2, TABLET_CARD_MAX_W);
  const maxHeight = Math.max(0, height - keyboardH) * 0.9;

  return (
    <Sheet
      visible={open}
      onDismiss={() => dismissRef.current?.()}
      style={{ width: cardWidth, maxHeight, padding: 0, overflow: 'hidden', borderRadius: radius.lg }}
    >
      <Widget key={generation} props={shown.props} session={session} dismissRef={dismissRef} />
    </Sheet>
  );
}
