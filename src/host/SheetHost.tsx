// 앱 전역 시트 호스트: 에이전트 세션의 sheet 슬롯에 든 위젯을 backdrop 없는 Bottom Sheet로 띄운다(Gate B Q5, 단계 4a).
// 시트는 자기 영역만 덮고, 바깥 터치는 아래 화면으로 간다.
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, StyleSheet, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import type { AgentSession, SessionSnapshot } from '../agent/session';
import { useAgentSession } from '../agent/useAgentSession';
import { useDeviceMode } from '../layout/deviceMode';
import { SheetHandle } from '../ui/SheetHandle';
import { colors, radius } from '../ui/theme';
import { sheetWidgets } from './widgets';

const TABLET_CARD_MAX_W = 560;

type Props = { state?: SessionSnapshot; session?: AgentSession };

export function SheetHost(props: Props) {
  const live = useAgentSession();
  const state = props.state ?? live.state;
  const session = props.session ?? live.session;
  const mode = useDeviceMode();
  const reduceMotion = useReducedMotion();
  const { width, height } = useWindowDimensions();
  const modalRef = useRef<BottomSheetModal>(null);
  const dismissRef = useRef<(() => void) | null>(null);
  // 지금 시트가 화면에 올라와 있는가 / 세션이 시트를 비워서 닫는 중인가
  const presented = useRef(false);
  const closingBySession = useRef(false);
  // 올릴 때마다 늘린다: 다시 올린 시트의 위젯은 새로 마운트되어 이전 finishedFor를 갖지 않는다
  const [generation, setGeneration] = useState(0);

  const sheet = state.sheet && sheetWidgets[state.sheet.componentId] ? state.sheet : null;
  // 닫히는 동안에도 내용을 그리도록 마지막 시트를 들고 있는다
  const [shown, setShown] = useState(sheet);
  if (sheet && sheet !== shown) setShown(sheet);
  const open = sheet !== null;
  const openRef = useRef(open);
  openRef.current = open;

  const present = () => {
    presented.current = true;
    closingBySession.current = false;
    setGeneration((g) => g + 1);
    modalRef.current?.present();
  };

  useEffect(() => {
    if (open) {
      if (!presented.current) present();
    } else if (presented.current) {
      closingBySession.current = true;
      modalRef.current?.dismiss();
    } else {
      setShown(null);
    }
  }, [open]);

  // gorhom은 Android 뒤로 가기를 받지 않는다: 시트가 떠 있는 동안만 받아서 닫는다
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!presented.current) return false;
      modalRef.current?.dismiss();
      return true;
    });
    return () => sub.remove();
  }, [open]);

  const onDismiss = () => {
    presented.current = false;
    if (closingBySession.current) {
      closingBySession.current = false;
      // 닫히는 동안 세션이 새 시트를 열었으면 다시 올린다
      if (openRef.current) present();
      else setShown(null);
      return;
    }
    // 끌어 내리기·뒤로 가기: 위젯이 정한 닫기 동작으로 보낸다. 이미 끝낸 위젯은 finishedFor가 두 번째 이벤트를 막는다
    dismissRef.current?.();
  };

  const Widget = shown ? sheetWidgets[shown.componentId] : undefined;
  if (!shown || !Widget) return null;

  const sideInset = mode === 'tablet' ? Math.max(0, (width - TABLET_CARD_MAX_W) / 2) : 0;

  return (
    <BottomSheetModal
      ref={modalRef}
      onDismiss={onDismiss}
      enableDynamicSizing
      maxDynamicContentSize={height * 0.9}
      handleComponent={SheetHandle}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      animateOnMount={!reduceMotion}
      style={[styles.sheet, { marginHorizontal: sideInset }]}
      backgroundStyle={styles.background}
    >
      {/* 위젯의 루트가 gorhom 스크롤 뷰다(학습장: BottomSheetScrollView). 내용 높이로 재고, 90%를 넘으면 스크롤한다 */}
      <Widget key={generation} props={shown.props} session={session} dismissRef={dismissRef} />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheet: { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, overflow: 'hidden' },
  background: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
});
