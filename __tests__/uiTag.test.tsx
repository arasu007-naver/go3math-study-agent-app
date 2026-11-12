import { StyleSheet } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { Tag } from '../src/ui/Tag';
import { colors, radius, space, type } from '../src/ui/theme';

const box = () => StyleSheet.flatten(screen.getByTestId('tag').props.style);
const text = (label: string) => StyleSheet.flatten(screen.getByText(label).props.style);

describe('Tag', () => {
  it('neutral is the default: cardMuted with subtle text', async () => {
    await render(<Tag label="일간 정리" />);
    expect(box()).toMatchObject({ backgroundColor: colors.cardMuted, borderRadius: radius.pill, paddingHorizontal: space.sm, paddingVertical: space.xxs });
    expect(text('일간 정리')).toMatchObject({ color: colors.subtle, fontSize: type.caption.fontSize });
  });

  it('accent uses accentSoft with accentText', async () => {
    await render(<Tag tone="accent" label="주간 정리" />);
    expect(box()).toMatchObject({ backgroundColor: colors.accentSoft });
    expect(text('주간 정리')).toMatchObject({ color: colors.accentText });
  });

  it('unread uses the unread color, onAccent text and a min width of 20', async () => {
    await render(<Tag tone="unread" label={3} />);
    expect(box()).toMatchObject({ backgroundColor: colors.unread, minWidth: 20, alignItems: 'center' });
    expect(text('3')).toMatchObject({ color: colors.onAccent });
  });

  it('shows numbers as they are', async () => {
    await render(<Tag tone="unread" label={120} />);
    expect(screen.getByText('120')).toBeTruthy();
  });

  it('is not pressable', async () => {
    await render(<Tag label="x" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
