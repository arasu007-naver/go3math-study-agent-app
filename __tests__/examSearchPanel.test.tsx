import { fireEvent, render, screen, within } from '@testing-library/react-native';
import { ExamSearchPanel } from '../src/kit/exam-search/ExamSearchPanel';

const store = () => ({ getString: jest.fn(() => undefined), set: jest.fn() });
const checked = (name: string) => screen.getByRole('checkbox', { name }).props.accessibilityState.checked;
const anyChecked = () => screen.getAllByRole('checkbox').some((c) => c.props.accessibilityState.checked);
const checkedLabels = () =>
  screen
    .getAllByRole('checkbox')
    .filter((c) => c.props.accessibilityState.checked)
    .map((c) => String(within(c).getByText(/./).props.children));

describe('ExamSearchPanel rows (spec 4b D4)', () => {
  it('시행월 선택 clears only months', async () => {
    const s = store();
    await render(<ExamSearchPanel mode="pre_exam" store={s} onSubmit={jest.fn()} />);
    expect(checked('수능')).toBe(true);
    const before = screen.getAllByRole('checkbox').filter((c) => c.props.accessibilityState.checked).length;
    await fireEvent.press(screen.getByRole('button', { name: '시행월 선택' }));
    expect(checked('수능')).toBe(false);
    // 연도는 그대로(시행월 11 하나만 꺼졌다)
    expect(screen.getAllByRole('checkbox').filter((c) => c.props.accessibilityState.checked).length).toBe(before - 1);
    expect(screen.getAllByRole('radio').some((r) => r.props.accessibilityState.checked)).toBe(true);
    expect(s.set).not.toHaveBeenCalled();
  });

  it('번호 and 연도 clear their own row', async () => {
    await render(<ExamSearchPanel mode="pre_exam" store={store()} onSubmit={jest.fn()} />);
    await fireEvent.press(screen.getByRole('checkbox', { name: '21번' }));
    expect(checked('21번')).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: '번호 선택' }));
    expect(checked('21번')).toBe(false);
    expect(checked('수능')).toBe(true);
    await fireEvent.press(screen.getByRole('button', { name: '연도 선택' }));
    expect(checkedLabels()).toEqual(['수능']);
  });

  it('clearing an empty row keeps it empty and leaves the others', async () => {
    const s = store();
    await render(<ExamSearchPanel mode="pre_exam" store={s} onSubmit={jest.fn()} />);
    const before = checkedLabels();
    await fireEvent.press(screen.getByRole('button', { name: '번호 선택' }));
    expect(checkedLabels()).toEqual(before);
    expect(s.set).not.toHaveBeenCalled();
  });

  it('subject change after clearing years restores default years', async () => {
    await render(<ExamSearchPanel mode="pre_exam" store={store()} onSubmit={jest.fn()} />);
    await fireEvent.press(screen.getByRole('button', { name: '연도 선택' }));
    await fireEvent.press(screen.getByRole('button', { name: '시행월 선택' }));
    expect(anyChecked()).toBe(false);
    const other = screen.getAllByRole('radio').find((r) => !r.props.accessibilityState.checked)!;
    await fireEvent.press(other);
    expect(anyChecked()).toBe(true);
  });

  it('계열 has no clear button and uses radios', async () => {
    await render(<ExamSearchPanel mode="pre_exam" store={store()} onSubmit={jest.fn()} />);
    expect(screen.queryByRole('button', { name: '계열 선택' })).toBeNull();
    expect(screen.getByText('계열')).toBeTruthy();
    expect(screen.getAllByRole('radio').filter((r) => r.props.accessibilityState.checked)).toHaveLength(1);
  });

  it('this_year mode has no 연도 row', async () => {
    await render(<ExamSearchPanel mode="this_year" store={store()} onSubmit={jest.fn()} />);
    expect(screen.queryByRole('button', { name: '연도 선택' })).toBeNull();
    expect(screen.getByRole('button', { name: '시행월 선택' })).toBeTruthy();
  });

  it('가자!!! submits the query', async () => {
    const onSubmit = jest.fn();
    await render(<ExamSearchPanel mode="this_year" store={store()} onSubmit={onSubmit} />);
    await fireEvent.press(screen.getByRole('button', { name: '가자!!!' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
