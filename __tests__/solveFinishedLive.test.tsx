import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockEmit = jest.fn();
const mockShow = jest.fn();
jest.mock('../src/agent/useAgentSession', () => ({ getAgentSession: () => ({ emit: mockEmit, showLocalSheet: mockShow }) }));
const mockEnsure = jest.fn();
jest.mock('../src/adapters/ensureTask', () => ({ ensureTaskId: (...a: any[]) => mockEnsure(...a) }));
const mockData = new Map<string, string>();
jest.mock('../src/storage', () => ({
  storage: {
    getString: (k: string) => mockData.get(k),
    set: (k: string, v: string) => void mockData.set(k, v),
    remove: (k: string) => void mockData.delete(k),
  },
}));

import * as leave from '../src/host/liveStudyNoteOnLeave';
import { useSolveFinished } from '../src/host/useSolveFinished';
import { canvasActivityStore } from '../src/state/canvasActivity';

const spec = { taskType: 'hotline' as const, task: { tutorId: 't' } };
let api: ReturnType<typeof useSolveFinished>;
function Probe({ taskId, kind = 'hotline' }: { taskId?: number; kind?: 'hotline' | 'topic_live' }) {
  api = useSolveFinished({ taskId, kind, liveSpec: spec, title: '선생님 실황 수업' });
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
  mockData.clear();
  mockEnsure.mockResolvedValue(11);
});

it.each(['hotline', 'topic_live'] as const)('%s: countSolved 후 나가면 시트를 열고 solve_finished는 보내지 않는다', async (kind) => {
  const view = await render(<Probe taskId={7} kind={kind} />);
  api.countSolved();
  await view.unmount();
  await waitFor(() => expect(mockShow).toHaveBeenCalledTimes(1));
  expect(mockShow).toHaveBeenCalledWith('study_note', { taskId: 7, mode: 'live', title: '선생님 실황 수업' });
  expect(mockEmit).not.toHaveBeenCalled();
});

it('개념만 조회하고 나가면 ensureTaskId로 만든 task로 시트를 연다', async () => {
  const view = await render(<Probe />);
  canvasActivityStore.dispatch({ type: 'concepts', concepts: [{ id: 1, rawTitle: '일반항' }] });
  await view.unmount();
  await waitFor(() => expect(mockShow).toHaveBeenCalledWith('study_note', { taskId: 11, mode: 'live', title: '선생님 실황 수업' }));
  expect(mockEnsure).toHaveBeenCalledWith(undefined, spec);
});

it('행동 없이 나가면 기존 taskId가 있어도 시트도 ensureTaskId도 없다', async () => {
  const view = await render(<Probe taskId={7} />);
  await view.unmount();
  expect(mockShow).not.toHaveBeenCalled();
  expect(mockEnsure).not.toHaveBeenCalled();
});

it('markActed 후 나가면 시트를 연다', async () => {
  const view = await render(<Probe taskId={7} />);
  api.markActed();
  await view.unmount();
  await waitFor(() => expect(mockShow).toHaveBeenCalledTimes(1));
});

it('퀴즈를 받기만 하면 시트를 열지 않는다', async () => {
  const view = await render(<Probe taskId={7} />);
  canvasActivityStore.dispatch({ type: 'quiz', quizId: 45 });
  await view.unmount();
  expect(mockShow).not.toHaveBeenCalled();
  expect(mockEnsure).not.toHaveBeenCalled();
});

it('markClassClosed만 부르고 나가면 시트를 열고 solve_finished는 보내지 않는다', async () => {
  const view = await render(<Probe taskId={7} />);
  api.markClassClosed();
  api.markClassClosed();
  await view.unmount();
  await waitFor(() => expect(mockShow).toHaveBeenCalledTimes(1));
  expect(mockShow).toHaveBeenCalledWith('study_note', { taskId: 7, mode: 'live', title: '선생님 실황 수업' });
  expect(mockEmit).not.toHaveBeenCalled();
});

it('수업 종료 뒤 taskId가 없으면 ensureTaskId로 시트를 열고, undefined면 열지 않는다', async () => {
  const view = await render(<Probe />);
  api.markClassClosed();
  await view.unmount();
  await waitFor(() => expect(mockShow).toHaveBeenCalledWith('study_note', { taskId: 11, mode: 'live', title: '선생님 실황 수업' }));
  expect(mockEnsure).toHaveBeenCalledWith(undefined, spec);
  mockShow.mockClear();
  mockEnsure.mockResolvedValue(undefined);
  const v2 = await render(<Probe />);
  api.markClassClosed();
  await v2.unmount();
  await waitFor(() => expect(mockEnsure).toHaveBeenCalledTimes(2));
  expect(mockShow).not.toHaveBeenCalled();
});

it('행동도 종료도 없이 나가면 acted:false로 불리고 시트는 없다', async () => {
  const spy = jest.spyOn(leave, 'openLiveStudyNoteOnLeave');
  const view = await render(<Probe taskId={7} />);
  await view.unmount();
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0].acted).toBe(false);
  expect(mockShow).not.toHaveBeenCalled();
  spy.mockRestore();
});

it.each(['hotline', 'topic_live'] as const)('%s: markClassClosed만 부르면 acted:true로 한 번 불린다', async (kind) => {
  const spy = jest.spyOn(leave, 'openLiveStudyNoteOnLeave');
  const view = await render(<Probe taskId={7} kind={kind} />);
  api.markClassClosed();
  await view.unmount();
  expect(spy).toHaveBeenCalledTimes(1);
  expect(spy.mock.calls[0][0].acted).toBe(true);
  await waitFor(() => expect(mockShow).toHaveBeenCalledTimes(1));
  expect(mockEmit).not.toHaveBeenCalled();
  spy.mockRestore();
});

it('markClassClosed는 마지막 null 아닌 closing을 넘긴다', async () => {
  const spy = jest.spyOn(leave, 'openLiveStudyNoteOnLeave');
  const c1 = { description: 'a', concepts: [], quizzes: [] };
  const c2 = { description: 'b', concepts: [], quizzes: [] };
  const view = await render(<Probe taskId={7} />);
  api.markClassClosed(c1);
  api.markClassClosed(c2);
  api.markClassClosed(null);
  await view.unmount();
  expect(spy.mock.calls[0][0].closing).toEqual(c2);
  await waitFor(() => expect(mockShow).toHaveBeenCalledTimes(1));
  spy.mockRestore();
});
