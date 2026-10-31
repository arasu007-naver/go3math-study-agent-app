/**
 * 스크립트 재생 골든 시나리오. 기존 훅과 kit 훅에 같은 입력·같은 조작 순서를 주고 sendCut 메시지 열을 기록한다.
 * Image.getSize는 이 모듈이 동기 목으로 바꾼다(URL이 있으면 폭 800, 없으면 실패 콜백).
 * scriptMaker는 호출하는 테스트 파일이 jest.mock('@qoolla/script-parser')로 막고 setScript로 응답을 넣는다.
 */
import { act, renderHook } from '@testing-library/react-native';
import { Image } from 'react-native';
import { parseDocument, type GuideScript, type RawCut } from '@qoolla/script-parser';

export type Recorded = Record<string, unknown>;

type Hook = (params: any) => any;

export function loadFixture(raw: RawCut[]): GuideScript {
  return parseDocument(raw);
}

export async function runScriptScenario(useHook: Hook, script: GuideScript, setScript: (s: GuideScript) => void): Promise<Recorded[]> {
  jest.spyOn(Image, 'getSize').mockImplementation(((url: string, ok: (w: number, h: number) => void, fail?: (e: Error) => void) => {
    if (url) ok(800, 600);
    else fail?.(new Error('no url'));
  }) as typeof Image.getSize);
  setScript(script);

  const out: Recorded[] = [];
  const mark = (step: string) => out.push({ step });
  const canvasRef = { current: { sendCut: (m: Recorded) => out.push(JSON.parse(JSON.stringify(m))) } };

  const { result } = await renderHook(() =>
    useHook({ canvasRef, currentSheet: { sourceType: 'UNIT', sourceId: 4242 }, feedbackResponse: null, feedbackMode: false, setFeedbackMode: () => {} }),
  );
  const flush = () => act(async () => {
    await jest.advanceTimersByTimeAsync(5000);
  });

  mark('load');
  await act(async () => result.current.setCurrentScriptUrl('fixture://script'));
  await flush();

  mark('canvasLoaded');
  await act(async () => result.current.canvasLoaded());

  const n = script.contents.length;
  for (let i = 0; i < n * 3; i++) {
    mark(`play#${i} ${result.current.currentCutIdx}/${result.current.subCutMode}`);
    await act(async () => result.current.play());
    await flush();
  }

  // 컷 2개 앞으로 간 뒤 되감기 / 다시 재생 / 현재 컷 다시 보기
  await act(async () => result.current.setCurrentIdx(Math.min(2, n - 1)));
  await flush();
  mark('backward');
  await act(async () => result.current.backward());
  await flush();
  mark('play-after-backward');
  await act(async () => result.current.play());
  await flush();
  mark('replayCurrent');
  await act(async () => result.current.replayCurrent());
  await flush();

  // 툴바 "⏩ startIdx >> 현재" 와 같이: 마지막 컷으로 이동 → 직전 refresh 지점(startIdx)부터 구간 재생(커튼 포함)
  await act(async () => result.current.setCurrentIdx(n - 1));
  await flush();
  mark(`rangePlay from=${result.current.startIdx}`);
  await act(async () => {
    const p = result.current.rangePlay(script.contents, result.current.startIdx, n - 1);
    await jest.advanceTimersByTimeAsync(20000);
    await p;
  });
  await flush();
  mark(`end ${result.current.currentCutIdx}/${result.current.subCutMode}/start=${result.current.startIdx}`);
  return out;
}
