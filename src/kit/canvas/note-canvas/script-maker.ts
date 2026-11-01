// @ts-nocheck
/* eslint-disable react/display-name, no-var, react/jsx-key -- 기존 코드를 그대로 옮긴 파일 */
// 기존 qoolla-student-app `src/utils/script-maker.ts`를 그대로 옮김(note-canvas 전이용, import 경로만 맞춤).
import { UNITIMAGE } from '../../../config/api.constants';

/**
 * 공용 파서/플레이어 구현은 @qoolla/script-parser 로 이관되었습니다.
 * 이 파일은 기존 import 경로(@utils/script-maker)를 유지하기 위한 재export 계층이며,
 * 앱 전용 유틸리티(sleep, 임시 스크립트 생성 등)만 직접 보유합니다.
 */
import { parseDocument, safeJsonParse } from '@qoolla/script-parser';
import type { RawCut, GuideScript } from '@qoolla/script-parser';

export * from '@qoolla/script-parser';

export interface FlyObj {
   type: string;
   version: string;
   originX: string;
   originY: string;
   left: number;
   top: number;
   width: number;
   height: number;
   fill: string;
   stroke: string | null;
   strokeWidth: number;
   strokeDashArray: number[] | null;
   strokeLineCap: string;
   strokeDashOffset: number;
   strokeLineJoin: string;
   strokeUniform: boolean;
   strokeMiterLimit: number;
   scaleX: number;
   scaleY: number;
   angle: number;
   flipX: boolean;
   flipY: boolean;
   opacity: number;
   shadow: any | null;
   visible: boolean;
   backgroundColor: string;
   fillRule: string;
   paintFirst: string;
   globalCompositeOperation: string;
   skewX: number;
   skewY: number;
   cropX: number;
   cropY: number;
   id: string;
   src: string;
   crossOrigin: string | null;
   filters: any[];
}


/**
 * 하위 호환용 safeJsonParser
 */
const safeJsonParser = (jsonString: any): any => {
   return safeJsonParse(jsonString, {});
};

const sleep = (milliSec: number): Promise<void> => {
   return new Promise(resolve => setTimeout(resolve, milliSec > 9600 ? 9600 : milliSec));
}

const flyObj: FlyObj = {
   type: "image",
   version: "5.3.0",
   originX: "left",
   originY: "top",
   left: 1068.88,
   top: 1712.59,
   width: 192,
   height: 192,
   fill: "rgb(0,0,0)",
   stroke: null,
   strokeWidth: 0,
   strokeDashArray: null,
   strokeLineCap: "butt",
   strokeDashOffset: 0,
   strokeLineJoin: "miter",
   strokeUniform: false,
   strokeMiterLimit: 4,
   scaleX: 1,
   scaleY: 1,
   angle: 0,
   flipX: false,
   flipY: false,
   opacity: 1,
   shadow: null,
   visible: true,
   backgroundColor: "",
   fillRule: "nonzero",
   paintFirst: "fill",
   globalCompositeOperation: "source-over",
   skewX: 0,
   skewY: 0,
   cropX: 0,
   cropY: 0,
   id: "id:1784542522320",
   src: "https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer/math-files/images/1784542521335.png",
   crossOrigin: null,
   filters: []
};

const scriptTemplate = (
   sourceType: string,
   sourceId: string | number,
   ts: number = new Date().getTime(),
): RawCut[] => {
   return [
      {
         timestamp: ts,
         content: JSON.stringify({
            image: UNITIMAGE(sourceType, sourceId) + "?ts=" + ts,
         }),
         actionType: "BACKGROUND",
         obj: {
            image: UNITIMAGE(sourceType, sourceId),
         },
      },
      {
         timestamp: ts + 1000,
         content: JSON.stringify(flyObj),
         actionType: "ADD"
      },
      {
         timestamp: ts,
         content: "{}",
         actionType: "SCENE_SUBS",
      },
      {
         timestamp: ts,
         content: "[]",
         actionType: "BACKGROUND_SUBS",
      },
      {
         timestamp: ts,
         content: "{}",
         actionType: "ANIMATIONS",
      },
      {
         timestamp: ts,
         actionType: "SYNCS",
         content: "[]",
      },
      {
         timestamp: ts,
         actionType: "PREPS",
         content: "[]",
      },
   ];
}

const makeTemporaryScript = (sourceType: string, sourceId: string | number): GuideScript | null => {
   try {
      const template = scriptTemplate(sourceType, sourceId, new Date().getTime());
      return parseDocument(template)
   } catch (e) {
      console.error("😡😡😡 makeTemporaryScript error:", e);
      return null;
   }
}

export {
   sleep,
   safeJsonParser,
   makeTemporaryScript,
};
