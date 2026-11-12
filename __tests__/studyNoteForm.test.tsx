import { StyleSheet } from 'react-native';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { StudyNoteForm } from '../src/kit/study-note/StudyNoteForm';
import { colors, layout } from '../src/ui/theme';

// 시트 밖에서 그리므로 gorhom 입력칸은 RN TextInput으로 바꾼다
// 스크롤 영역은 testID를 붙여 gorhom 스크롤 뷰를 쓰는지 확인한다
jest.mock('@gorhom/bottom-sheet', () => {
  const React = require('react');
  const { TextInput, ScrollView } = require('react-native');
  return {
    BottomSheetTextInput: TextInput,
    BottomSheetScrollView: (p: any) => React.createElement(ScrollView, { ...p, testID: 'sheet-scroll' }),
  };
});
import { draftKey } from '../src/kit/study-note/draft';
import type { StudyNote } from '../src/kit/study-note/model';
import type { StudyNoteFetchers } from '../src/kit/study-note/persist';
import type { KeyValueStore } from '../src/storage/types';

function memoryStore(): KeyValueStore {
  const m = new Map<string, string>();
  return {
    getString: (k) => m.get(k),
    set: (k, v) => void m.set(k, v),
    remove: (k) => void m.delete(k),
  };
}

function setup(over: Partial<StudyNoteFetchers> = {}, props: Partial<React.ComponentProps<typeof StudyNoteForm>> = {}) {
  const fetchers: StudyNoteFetchers = {
    fetchNote: jest.fn(async (): Promise<StudyNote | null> => null),
    register: jest.fn(async () => {}),
    update: jest.fn(async () => {}),
    ...over,
  };
  const store = props.store ?? memoryStore();
  const onDone = jest.fn();
  const ui = (
    <StudyNoteForm taskId={7} mode="self" title="수열" fetchers={fetchers} store={store} onDone={onDone} {...props} />
  );
  return { fetchers, store, onDone, ui };
}

const settle = () => waitFor(() => expect(screen.getByText('학습장 · 수열')).toBeTruthy());

describe('StudyNoteForm', () => {
  it('saves achievement and difficulty chips', async () => {
    const { fetchers, onDone, ui } = setup();
    await render(ui);
    await settle();
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('개념'));
    await fireEvent.press(screen.getByText('계산'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect(fetchers.register).toHaveBeenCalledWith(7, { achievementRate: 75, difficulties: 'concept,calc', description: '', expectations: '' });
  });

  it('save is disabled until something is entered', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    expect(screen.getByRole('button', { name: '저장' }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByText('조금'));
    expect(screen.getByRole('button', { name: '저장' }).props.accessibilityState.disabled).toBe(false);
  });

  it('chips expose radio/checkbox roles', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    expect(screen.getByRole('radio', { name: '거의' }).props.accessibilityState.checked).toBe(false);
    expect(screen.getByRole('checkbox', { name: '개념' }).props.accessibilityState.checked).toBe(false);
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('개념'));
    expect(screen.getByRole('radio', { name: '거의' }).props.accessibilityState.checked).toBe(true);
    expect(screen.getByRole('checkbox', { name: '개념' }).props.accessibilityState.checked).toBe(true);
  });

  it('prefills an existing note and labels the button 수정', async () => {
    const note: StudyNote = { taskId: 7, description: '일반항', achievementRate: 50 };
    const { fetchers, onDone, ui } = setup({ fetchNote: jest.fn(async () => note) });
    await render(ui);
    await waitFor(() => expect(screen.getByDisplayValue('일반항')).toBeTruthy());
    expect(screen.getByRole('radio', { name: '절반' }).props.accessibilityState.checked).toBe(true);
    await fireEvent.press(screen.getByText('수정'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect(fetchers.update).toHaveBeenCalled();
    expect(fetchers.register).not.toHaveBeenCalled();
  });

  it('live mode shows tutor caption, no next-goal toggle and a short memo label', async () => {
    const { ui } = setup({}, { mode: 'live' });
    await render(ui);
    await settle();
    expect(screen.getByText('선생님 정리')).toBeTruthy();
    expect(screen.getByText('선생님 정리가 아직 없어요')).toBeTruthy();
    expect(screen.queryByText('▸ 다음 목표 (선택)')).toBeNull();
    expect(screen.getByText('한 줄 메모 (선택)')).toBeTruthy();
  });

  it('live mode shows the tutor description when present', async () => {
    const note: StudyNote = { taskId: 7, tutorDescription: '등차수열 정리' };
    const { ui } = setup({ fetchNote: jest.fn(async () => note) }, { mode: 'live' });
    await render(ui);
    await waitFor(() => expect(screen.getByText('등차수열 정리')).toBeTruthy());
    expect(screen.queryByText('선생님 정리가 아직 없어요')).toBeNull();
  });

  it('hint chip appends to description', async () => {
    const { ui } = setup({}, { topicHints: ['일반항'] });
    await render(ui);
    await settle();
    expect(screen.getByText('추천:')).toBeTruthy();
    await fireEvent.press(screen.getByText('일반항'));
    expect(screen.getByDisplayValue('일반항')).toBeTruthy();
    await fireEvent.press(screen.getByText('일반항'));
    expect(screen.getByDisplayValue('일반항 일반항')).toBeTruthy();
  });

  it('hides the hint row without hints', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    expect(screen.queryByText('추천:')).toBeNull();
  });

  it('caps the description at 200 characters', async () => {
    const { fetchers, ui } = setup();
    await render(ui);
    await settle();
    const input = screen.getByLabelText('공부한 내용');
    expect(input.props.maxLength).toBe(200);
    await fireEvent.changeText(input, 'a'.repeat(201));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(fetchers.register).toHaveBeenCalled());
    const saved = (fetchers.register as jest.Mock).mock.calls[0][1];
    expect(saved.description.length).toBeLessThanOrEqual(200);
  });

  it('keeps input and draft when saving fails', async () => {
    const store = memoryStore();
    const register = jest.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(undefined);
    const { onDone, ui } = setup({ register }, { store });
    const view = await render(ui);
    await settle();
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(screen.getByText('저장하지 못했어요. 다시 시도해 주세요.')).toBeTruthy());
    expect(screen.getByText('다시 저장')).toBeTruthy();
    expect(onDone).not.toHaveBeenCalled();
    expect(store.getString(draftKey(7))).toBeTruthy();

    await view.unmount();
    await render(ui);
    await settle();
    expect(screen.getByRole('radio', { name: '거의' }).props.accessibilityState.checked).toBe(true);

    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(onDone).toHaveBeenCalledWith('saved'));
    expect(store.getString(draftKey(7))).toBeUndefined();
  });

  it('fetch failure shows notice and empty form', async () => {
    const fetchNote = jest.fn(async (): Promise<StudyNote | null> => {
      throw new Error('net');
    });
    const { fetchers, onDone, ui } = setup({ fetchNote });
    await render(ui);
    await waitFor(() => expect(screen.getByText('이전 메모를 불러오지 못했어요')).toBeTruthy());
    await fireEvent.press(screen.getByText('거의'));
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(fetchNote).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(onDone).not.toHaveBeenCalled());
    expect(fetchers.register).not.toHaveBeenCalled();
  });

  it('나중에 calls onDone dismissed without saving', async () => {
    const { fetchers, onDone, ui } = setup();
    await render(ui);
    await settle();
    await fireEvent.press(screen.getByText('나중에'));
    expect(onDone).toHaveBeenCalledWith('dismissed');
    expect(fetchers.register).not.toHaveBeenCalled();
    expect(fetchers.update).not.toHaveBeenCalled();
  });
});

describe('StudyNoteForm - shared components (stage 4a)', () => {
  const flat = (node: any) => StyleSheet.flatten(node.props.style);

  it('scrolls inside the bottom sheet with gorhom BottomSheetScrollView (review I2)', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    const scroll = screen.getByTestId('sheet-scroll');
    expect(scroll.props.keyboardShouldPersistTaps).toBe('handled');
  });

  it('chips are the shared Chip at controlSm height', async () => {
    const { ui } = setup({}, { topicHints: ['일반항'] });
    await render(ui);
    await settle();
    expect(flat(screen.getByRole('radio', { name: '거의' }))).toMatchObject({ minHeight: layout.controlSm, borderRadius: expect.any(Number) });
    expect(flat(screen.getByRole('checkbox', { name: '개념' }))).toMatchObject({ minHeight: layout.controlSm });
    expect(flat(screen.getByRole('button', { name: '일반항' }))).toMatchObject({ minHeight: layout.controlSm });
  });

  it('나중에 and the goal toggle are text buttons; the toggle reports expanded', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    expect(flat(screen.getByRole('button', { name: '나중에' }))).toMatchObject({ backgroundColor: 'transparent', minHeight: layout.hit });
    const toggle = screen.getByRole('button', { name: '▸ 다음 목표 (선택)' });
    expect(flat(toggle)).toMatchObject({ backgroundColor: 'transparent', minHeight: layout.controlSm });
    expect(toggle.props.accessibilityState).toMatchObject({ expanded: false });
    await fireEvent.press(toggle);
    expect(screen.getByRole('button', { name: '▸ 다음 목표 (선택)' }).props.accessibilityState).toMatchObject({ expanded: true });
    expect(screen.getByLabelText('다음 목표')).toBeTruthy();
  });

  it('저장 is a primary button, disabled until an achievement is chosen', async () => {
    const { ui } = setup();
    await render(ui);
    await settle();
    expect(flat(screen.getByRole('button', { name: '저장' }))).toMatchObject({ backgroundColor: colors.cardMuted });
    await fireEvent.press(screen.getByText('거의'));
    expect(flat(screen.getByRole('button', { name: '저장' }))).toMatchObject({ backgroundColor: colors.accent });
  });
});
