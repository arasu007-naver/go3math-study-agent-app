/**
 * M3 골든 테스트: kit useScriptPlayer의 sendCut 메시지 열이 기존 훅의 기록과 같아야 한다.
 * 기준(__tests__/fixtures/golden/*.json)은 2026-10-31 기존 앱(a4fdcdb)의 useScriptPlayer를 같은 시나리오로 한 번 실행해 기록했다.
 * 이 테스트는 기존 앱 코드를 실행하지 않는다(명세서 §2.7).
 * 픽스처: feedback-3370(실제 공개 스크립트), temporary-template(기존 makeTemporaryScript 형태), constructed-prologue-epilogue(프롤로그·에필로그·CLEAN·커튼).
 */
import fs from 'fs';
import path from 'path';
import { scriptMaker } from '@qoolla/script-parser';
import { useScriptPlayer, getLastOfSmallerNumbers } from '../src/kit/script-player/useScriptPlayer';
import { loadFixture, runScriptScenario } from '../test-utils/scriptScenario';

jest.mock('@qoolla/script-parser', () => ({ ...jest.requireActual('@qoolla/script-parser'), scriptMaker: jest.fn() }));
jest.useFakeTimers();

const dir = path.join(__dirname, 'fixtures');
const names = ['feedback-3370', 'temporary-template', 'constructed-prologue-epilogue'];

describe('kit/script-player golden (legacy parity)', () => {
  test.each(names)('%s: sendCut sequence matches the recorded legacy baseline', async (name) => {
    const raw = JSON.parse(fs.readFileSync(path.join(dir, 'scripts', name + '.json'), 'utf8'));
    const baseline = JSON.parse(fs.readFileSync(path.join(dir, 'golden', name + '.json'), 'utf8'));
    const calls = await runScriptScenario(useScriptPlayer, loadFixture(raw), (s) => (scriptMaker as jest.Mock).mockResolvedValue(s));
    expect(calls).toEqual(baseline);
  });

  it('getLastOfSmallerNumbers keeps the legacy semantics', () => {
    expect(getLastOfSmallerNumbers([0, 4, 9], 5)).toBe(4);
    expect(getLastOfSmallerNumbers([0, 9, 4], 10)).toBe(4); // last in array order, not max
    expect(getLastOfSmallerNumbers([5], 5)).toBeUndefined();
    expect(getLastOfSmallerNumbers([], 3)).toBeUndefined();
  });
});
