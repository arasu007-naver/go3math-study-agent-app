import React from 'react';
import { render } from '@testing-library/react-native';

const mockEmit = jest.fn();
jest.mock('../src/agent/useAgentSession', () => ({ getAgentSession: () => ({ emit: mockEmit }) }));

import { useSolveFinished } from '../src/host/useSolveFinished';

function Probe({ taskId, count }: { taskId?: number; count: number }) {
  const { countSolved } = useSolveFinished({ taskId, kind: 'self' });
  React.useEffect(() => {
    for (let i = 0; i < count; i++) countSolved();
  }, [count, countSolved]);
  return null;
}

beforeEach(() => mockEmit.mockClear());

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
