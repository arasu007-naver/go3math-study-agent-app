// 개념 조회에서 고른 개념. 캔버스 '개념·해답' 시트와 검색 dock '개념' 탭이 같이 쓴다(한쪽에서 고르면 다른 쪽에도 보인다). 앱을 끄면 비워진다.
import type { MathConcept } from '@qoolla/script-parser';
import { createStore } from './createStore';

export const pickedConceptsStore = createStore((_: MathConcept[], next: MathConcept[]) => next, [] as MathConcept[]);
