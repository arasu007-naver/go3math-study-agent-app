import React from 'react';
import { render } from '@testing-library/react-native';

const mockEmit = jest.fn();
jest.mock('../src/agent/useAgentSession', () => ({ getAgentSession: () => ({ emit: mockEmit }) }));

const mockData = new Map<string, string>();
jest.mock('../src/storage', () => ({
  storage: {
    getString: (k: string) => mockData.get(k),
    set: (k: string, v: string) => void mockData.set(k, v),
    remove: (k: string) => void mockData.delete(k),
  },
}));

import { isCanvasOpen, useSolveFinished } from '../src/host/useSolveFinished';
import { emptyActivities, loadActivity } from '../src/kit/study-note/activity';
import { canvasActivityStore } from '../src/state/canvasActivity';
import { storage } from '../src/storage';

function Probe({ taskId, count }: { taskId?: number; count: number }) {
  const { countSolved } = useSolveFinished({ taskId, kind: 'self' });
  React.useEffect(() => {
    for (let i = 0; i < count; i++) countSolved();
  }, [count, countSolved]);
  return null;
}

beforeEach(() => {
  mockEmit.mockClear();
  mockData.clear();
});

it('emits solve_finished once on unmount with the solved count', async () => {
  const view = await render(<Probe taskId={7} count={2} />);
  expect(mockEmit).not.toHaveBeenCalled();
  await view.unmount();
  expect(mockEmit).toHaveBeenCalledTimes(1);
  expect(mockEmit).toHaveBeenCalledWith('solve_finished', { taskId: 7, kind: 'self', solvedCount: 2 });
});

it('omits taskId when undefined', async () => {
  const view = await render(<Probe count={0} />);
  await view.unmount();
  const payload = mockEmit.mock.calls[0][1];
  expect('taskId' in payload).toBe(false);
  expect(payload).toEqual({ kind: 'self', solvedCount: 0 });
});

describe('활동 기록', () => {
  const collect = () => {
    canvasActivityStore.dispatch({ type: 'concepts', concepts: [{ id: 1, rawTitle: '일반항' }] });
    canvasActivityStore.dispatch({ type: 'quiz', quizId: 45 });
  };

  it('taskId가 있으면 나갈 때 그 task 키로 기록을 남긴다', async () => {
    const view = await render(<Probe taskId={7} count={0} />);
    collect();
    expect(mockData.size).toBe(0);
    await view.unmount();
    expect(loadActivity(storage, 7)).toEqual({ v: 1, concepts: [{ id: 1, title: '일반항' }], quizIds: [45] });
  });

  it('같은 task에 다시 들어가면 기록을 합친다', async () => {
    const first = await render(<Probe taskId={7} count={0} />);
    collect();
    await first.unmount();
    const second = await render(<Probe taskId={7} count={0} />);
    canvasActivityStore.dispatch({ type: 'concepts', concepts: [{ id: 1, rawTitle: '일반항' }] });
    canvasActivityStore.dispatch({ type: 'quiz', quizId: 46 });
    await second.unmount();
    expect(loadActivity(storage, 7)).toEqual({ v: 1, concepts: [{ id: 1, title: '일반항' }], quizIds: [45, 46] });
  });

  it('taskId가 없으면 남기지 않고, 다음 캔버스로 넘어가지도 않는다', async () => {
    const view = await render(<Probe count={0} />);
    collect();
    await view.unmount();
    expect([...mockData.keys()].some((k) => k.startsWith('agent:studyNoteActivity:'))).toBe(false);

    const next = await render(<Probe taskId={8} count={0} />);
    expect(canvasActivityStore.getState()).toEqual(emptyActivities());
    await next.unmount();
    expect(mockData.size).toBe(0);
  });

  // 새 캔버스는 열려 있던 캔버스를 스택에서 빼고 올라간다(widgets.openCanvas) — 새 화면이 먼저 마운트되고 옛 화면이 나중에 언마운트돼도 기록이 섞이지 않는다
  it('새 캔버스가 뜨면 열려 있던 캔버스의 기록을 먼저 그 task에 남긴다', async () => {
    const old = await render(<Probe taskId={7} count={0} />);
    collect();
    const next = await render(<Probe taskId={8} count={0} />);
    expect(loadActivity(storage, 7)).toEqual({ v: 1, concepts: [{ id: 1, title: '일반항' }], quizIds: [45] });
    expect(canvasActivityStore.getState()).toEqual(emptyActivities());

    canvasActivityStore.dispatch({ type: 'quiz', quizId: 50 });
    await old.unmount();
    expect(loadActivity(storage, 7).quizIds).toEqual([45]);
    expect(loadActivity(storage, 8)).toEqual(emptyActivities());
    expect(canvasActivityStore.getState().quizIds).toEqual([50]);
    expect(isCanvasOpen()).toBe(true);

    await next.unmount();
    expect(loadActivity(storage, 8).quizIds).toEqual([50]);
    expect(loadActivity(storage, 7).quizIds).toEqual([45]);
    expect(isCanvasOpen()).toBe(false);
  });

  it('isCanvasOpen은 캔버스가 떠 있는 동안만 true', async () => {
    expect(isCanvasOpen()).toBe(false);
    const view = await render(<Probe count={0} />);
    expect(isCanvasOpen()).toBe(true);
    await view.unmount();
    expect(isCanvasOpen()).toBe(false);
  });
});
