/**
 * 스크립트 재생 훅 — 기존 `pages/notebook/topic-note/hooks/useScriptPlayer.ts`(358줄) 이식.
 * 상태기계(refresh / prologue / main / epilogue), 커튼, rangePlay, 재생 순서는 원본과 같다(골든 테스트로 확인).
 * 바뀐 점(주입 포트, 명세서 §2.7 ScriptCanvasPort):
 *   - canvasRef: 원본과 같은 ref지만 타입이 ScriptCanvasPort(sendCut만 필요)
 *   - measureImageWidth: RN Image.getSize 대신 주입 가능(기본값은 Image.getSize, 콜백 순서 동일)
 *   - loadScript: @qoolla/script-parser scriptMaker 대신 주입 가능(기본값 scriptMaker)
 *   - lodash 제거(같은 의미의 Array 메서드)
 */
import { useEffect, useState, type MutableRefObject } from 'react';
import { Image } from 'react-native';
import { getLeaderIdForCut, safeJsonParse, scriptMaker, type GuideScript } from '@qoolla/script-parser';
import { UNITIMAGE } from '../../config/api.constants';

export interface ScriptCanvasPort {
  sendCut(msg: Record<string, unknown>): void;
}

export type SubCutMode = 'refresh' | 'prologue' | 'main' | 'epilogue';

type CurrentSheet = { sourceType: string; sourceId: number; [key: string]: unknown };

export type MeasureImageWidth = (url: string, ok: (width: number) => void, fail: (error: Error) => void) => void;

export type UseScriptPlayerParams = {
  canvasRef: MutableRefObject<ScriptCanvasPort | null>;
  currentSheet: CurrentSheet | null;
  feedbackResponse?: { cut: { currentIdx: number } } | null;
  feedbackMode: boolean;
  setFeedbackMode: (v: boolean) => void;
  measureImageWidth?: MeasureImageWidth;
  loadScript?: (scriptUrl: string) => Promise<GuideScript>;
};

const defaultMeasure: MeasureImageWidth = (url, ok, fail) => Image.getSize(url, (w) => ok(w), fail);

/** 원본 @utils/script-maker의 sleep(최대 9.6초) */
export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms > 9600 ? 9600 : ms));

/** 원본 topic-note/utils.ts getLastOfSmallerNumbers: target보다 작은 수 중 배열에서 마지막 것 */
export function getLastOfSmallerNumbers(arr: number[], target: number): number | undefined {
  if (!Array.isArray(arr) || arr.length === 0) return undefined;
  const smaller = arr.filter((n) => n < target);
  return smaller[smaller.length - 1];
}

type Member = { id?: string };

export function useScriptPlayer({
  canvasRef,
  currentSheet,
  feedbackResponse,
  feedbackMode,
  setFeedbackMode,
  measureImageWidth = defaultMeasure,
  loadScript = scriptMaker,
}: UseScriptPlayerParams) {
  const [currentUnitScript, setCurrentUnitScript] = useState<GuideScript | undefined>();
  const [currentCutIdx, setCurrentIdx] = useState(0);
  const [subCutMode, setSubCutMode] = useState<SubCutMode>('epilogue');
  const [curtains, setCurtains] = useState<GuideScript['curtains']>([]);
  const [canvasBackObjs, setCanvasBackObjs] = useState<Record<string, unknown>>({});
  const [currentScriptUrl, setCurrentScriptUrl] = useState<string | undefined>();
  const [onScriptLoaded, setOnScriptLoaded] = useState(false);
  const [startIdx, setStartIdx] = useState(0);

  const send = (msg: Record<string, unknown>) => canvasRef.current?.sendCut(msg);

  /** contents[0](배경)을 이미지 폭과 함께 보낸다. 원본에서 5곳에 반복되던 패턴 */
  const sendBackground = (script: GuideScript) => {
    const first = script.contents[0];
    const obj = safeJsonParse<{ image?: string }>(first.content, {});
    measureImageWidth(
      obj.image as string,
      (w) => send({ ...first, imageWidth: w }),
      () => send(first),
    );
  };

  // --- Script composition ---
  const composeScript = async (scriptUrl: string) => {
    const s = await loadScript(scriptUrl);
    setCanvasBackObjs(s.canvasBackStuffs);
    setCurtains(s.curtains);
    setCurrentUnitScript(s);

    if (feedbackResponse) {
      setFeedbackMode(true);
      setTimeout(() => setCurrentIdx(feedbackResponse.cut.currentIdx), 120);
    } else {
      setTimeout(() => setCurrentIdx(0), 10);
    }
  };

  // --- Helpers ---
  const hasPrologues = (idx: number): boolean => {
    const cut = currentUnitScript?.contents?.[idx];
    if (!cut) return false;
    const leaderId = getLeaderIdForCut(cut);
    if (!leaderId) return false;
    return (currentUnitScript.prepMembers as Member[]).some((m) => m.id && m.id.startsWith('preps:' + leaderId));
  };

  const hasEpilogues = (idx: number): boolean => {
    const cut = currentUnitScript?.contents?.[idx];
    if (!cut) return false;
    const leaderId = getLeaderIdForCut(cut);
    if (!leaderId) return false;
    return (currentUnitScript.groups as Member[]).some((m) => m.id && m.id.startsWith('group:' + leaderId));
  };

  // --- Send script to canvas ---
  const sendScript = (msg: Record<string, any>, cutMode?: 'main' | 'prologue' | 'epilogue') => {
    if (msg.actionType) {
      const imageUrl = UNITIMAGE(currentSheet!.sourceType, currentSheet!.sourceId);
      const actionType = cutMode === 'prologue' ? 'PROLOGUE' : msg.actionType;
      measureImageWidth(
        imageUrl,
        (w) => send({ ...msg, actionType, imageWidth: w }),
        () => send({ ...msg, actionType, imageWidth: 100 }),
      );
    } else {
      switch (cutMode) {
        case 'main':
          send(msg);
          break;
        case 'prologue':
          send({ ...msg, actionType: 'PROLOGUE' });
          break;
        case 'epilogue':
          send({ ...msg, actionType: 'EPILOGUE' });
          break;
      }
    }
  };

  // --- Send metadata stuffs to canvas ---
  const sendStuffs = () => {
    const s = currentUnitScript!;
    const stuffTypes: [string, unknown][] = [
      ['ACT_SUBS', s.actSubs],
      ['BACKGROUND_SUBS', s.backgroundSubs],
      ['ANIMATIONS', s.animations],
      ['FADEOUTS', s.fadeOuts],
      ['APPENDIX', s.appendix],
      ['GROUPS', s.groups],
      ['SYNCS', s.syncMembers],
      ['PREPS', s.prepMembers],
    ];
    stuffTypes.forEach(([actionType, data]) => send({ actionType, content: JSON.stringify(data) }));
  };

  // --- Curtain runner ---
  const runCurtains = (cutIdx: number) => {
    curtains
      .filter((c) => c.seq === cutIdx)
      .forEach((bks) => {
        for (const objId of bks.objs) {
          if (canvasBackObjs[objId]) send({ actionType: 'DEFAULT', obj: canvasBackObjs[objId] });
        }
      });
  };

  // --- Playback controls ---
  const play = async () => {
    const s = currentUnitScript!;
    switch (subCutMode) {
      case 'refresh':
        if (hasPrologues(currentCutIdx)) {
          setSubCutMode('prologue');
          sendScript(s.contents[currentCutIdx], 'prologue');
        } else {
          setSubCutMode('main');
          sendScript(s.contents[currentCutIdx]);
        }
        break;
      case 'prologue':
        sendScript(s.contents[currentCutIdx]);
        setSubCutMode('main');
        break;
      case 'main':
        if (hasEpilogues(currentCutIdx)) {
          setSubCutMode('epilogue');
          sendScript({ ...s.contents[currentCutIdx], actionType: 'EPILOGUE' });
        } else {
          setCurrentIdx((currentCutIdx + 1) % s.contents.length);
        }
        break;
      case 'epilogue':
        setCurrentIdx((currentCutIdx + 1) % s.contents.length);
        break;
    }
  };

  const backward = () => {
    if (currentCutIdx <= 0) return;
    if (subCutMode === 'refresh') setCurrentIdx(currentCutIdx - 1);
    if (canvasRef.current) {
      send({ actionType: 'BACKWARD', content: currentUnitScript!.contents[currentCutIdx].content });
      setSubCutMode('refresh');
    }
  };

  const rangePlay = async (cutSequences: Record<string, unknown>[], rangeStartIdx: number, destinationIndex: number) => {
    const s = currentUnitScript!;
    sendBackground(s);
    await sleep(360);
    for (let i = rangeStartIdx; i <= destinationIndex; i++) {
      if (i === rangeStartIdx) {
        runCurtains(i);
        continue;
      }
      const msg = cutSequences[i];
      if (i === destinationIndex && subCutMode === 'refresh') break;
      if (hasPrologues(i)) {
        sendScript(s.contents[i], 'prologue');
        await sleep(360);
        if (i === destinationIndex && subCutMode === 'prologue') break;
      }
      send(msg);
      if (i === destinationIndex && subCutMode === 'main') break;
      await sleep(1200);
      if (hasEpilogues(i)) {
        sendScript({ ...s.contents[i], actionType: 'EPILOGUE' });
        await sleep(360);
      }
    }
    setCurrentIdx(destinationIndex);
  };

  // --- Canvas loaded callback ---
  const canvasLoaded = async () => {
    if (!canvasRef.current) return;
    if (feedbackMode) return; // feedback mode handled externally
    sendBackground(currentUnitScript!);
    sendStuffs();
  };

  // --- Refresh current cut on canvas (toolbar replay button) ---
  const replayCurrent = async () => {
    const s = currentUnitScript;
    if (!canvasRef.current || !s?.contents?.[currentCutIdx]) return;
    if (currentCutIdx === 0) {
      setSubCutMode('epilogue');
      sendBackground(s);
    } else {
      switch (subCutMode) {
        case 'prologue':
          send({ ...s.contents[currentCutIdx], actionType: 'PROLOGUE' });
          break;
        case 'main':
          send(s.contents[currentCutIdx]);
          break;
        case 'epilogue':
          send({ ...s.contents[currentCutIdx], actionType: 'EPILOGUE' });
          break;
      }
    }
  };

  // --- Effects ---
  useEffect(() => {
    if (currentScriptUrl) {
      setCurrentIdx(0);
      composeScript(currentScriptUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentScriptUrl]);

  useEffect(() => {
    if (currentUnitScript != null && currentCutIdx > 0) {
      setStartIdx(getLastOfSmallerNumbers(currentUnitScript.refreshPoints, currentCutIdx) ?? 0);
    }
    if (feedbackMode) return;
    if (canvasRef.current && currentUnitScript?.contents?.[currentCutIdx]) {
      if (currentCutIdx === 0) {
        sendBackground(currentUnitScript);
        setSubCutMode('epilogue');
      } else if (hasPrologues(currentCutIdx)) {
        setSubCutMode('prologue');
        sendScript(currentUnitScript.contents[currentCutIdx], 'prologue');
      } else {
        setSubCutMode('main');
        sendScript(currentUnitScript.contents[currentCutIdx]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCutIdx]);

  useEffect(() => {
    if (currentUnitScript) setOnScriptLoaded(true);
  }, [currentUnitScript]);

  useEffect(() => {
    if (!feedbackMode && currentUnitScript?.contents?.[0]) sendBackground(currentUnitScript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackMode]);

  return {
    currentUnitScript,
    currentCutIdx,
    setCurrentIdx,
    subCutMode,
    setSubCutMode,
    currentScriptUrl,
    setCurrentScriptUrl,
    onScriptLoaded,
    setOnScriptLoaded,
    startIdx,
    play,
    backward,
    rangePlay,
    canvasLoaded,
    replayCurrent,
    sendStuffs,
  };
}
