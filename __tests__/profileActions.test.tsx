import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ProfileActions, type ProfileEditors } from '../src/kit/profile/ProfileActions';

const editors = (over: Partial<ProfileEditors> = {}): ProfileEditors => ({
  changeName: jest.fn(async () => {}),
  changeImage: jest.fn(async () => true),
  ...over,
});

describe('ProfileActions', () => {
  it('lists name, image, then logout last as shared buttons (spec 4b)', async () => {
    const { StyleSheet } = require('react-native');
    const { colors } = require('../src/ui/theme');
    await render(<ProfileActions name="길동" editors={editors()} onLogout={() => {}} />);
    const names = ['이름 변경', '프로필 이미지 변경', '로그아웃'];
    expect(screen.getAllByText(/^(이름 변경|프로필 이미지 변경|로그아웃)$/).map((t) => t.props.children)).toEqual(names);
    for (const n of names) {
      expect(screen.getByRole('button', { name: n })).toBeTruthy();
      expect(StyleSheet.flatten(screen.getByText(n).props.style).textDecorationLine).toBeUndefined();
    }
    expect(StyleSheet.flatten(screen.getByText('로그아웃').props.style).color).toBe(colors.danger);
    expect(screen.getByTestId('profile-actions-divider')).toBeTruthy();
  });

  it('name dialog disables save for unchanged or blank names', async () => {
    const e = editors();
    await render(<ProfileActions name="길동" editors={e} onLogout={() => {}} />);
    await fireEvent.press(screen.getByRole('button', { name: '이름 변경' }));
    expect(screen.getByRole('header', { name: '이름 변경' })).toBeTruthy();
    expect(screen.getByRole('button', { name: '저장' }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText('새 이름'), '   ');
    expect(screen.getByRole('button', { name: '저장' }).props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: '저장' }));
    expect(e.changeName).not.toHaveBeenCalled();
  });

  it('changes the name through the dialog', async () => {
    const e = editors();
    await render(<ProfileActions name="길동" editors={e} onLogout={() => {}} />);
    await fireEvent.press(screen.getByText('이름 변경'));
    await fireEvent.changeText(screen.getByLabelText('새 이름'), '  홍길동 ');
    await fireEvent.press(screen.getByText('저장'));
    await waitFor(() => expect(screen.getByText('이름을 변경했어요.')).toBeTruthy());
    expect(e.changeName).toHaveBeenCalledWith('홍길동');
  });

  it('changes the image, stays quiet when the picker is cancelled, and reports failures', async () => {
    const changeImage = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true).mockRejectedValueOnce(new Error('net'));
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    await render(<ProfileActions name="길동" editors={editors({ changeImage })} onLogout={() => {}} />);

    await fireEvent.press(screen.getByText('프로필 이미지 변경'));
    await waitFor(() => expect(changeImage).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('프로필 이미지를 변경했어요.')).toBeNull();

    await fireEvent.press(screen.getByText('프로필 이미지 변경'));
    await waitFor(() => expect(screen.getByText('프로필 이미지를 변경했어요.')).toBeTruthy());

    await fireEvent.press(screen.getByText('프로필 이미지 변경'));
    await waitFor(() => expect(screen.getByText('변경하지 못했어요. 잠시 후 다시 시도해 주세요.')).toBeTruthy());
  });

  it('logs out', async () => {
    const onLogout = jest.fn();
    await render(<ProfileActions name="길동" editors={editors()} onLogout={onLogout} />);
    await fireEvent.press(screen.getByText('로그아웃'));
    expect(onLogout).toHaveBeenCalled();
  });
});
