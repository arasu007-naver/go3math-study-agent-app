/**
 * REST API — 기존 `src/libs/api/index.ts`, `src/libs/api/hello`에서 이전.
 * 엔드포인트·요청 형태는 그대로 두고 타입만 붙였다. 토큰은 호출자가 넘긴다(기존과 동일).
 * 제외: `getChaptersOfSubject`, `getConceptsInChapter` 재export(@qoolla/script-parser — kit 단계에서 의존 추가),
 *       hello/의 react-query 래퍼(훅 규칙 위반 형태라 이전하지 않음, 화면 이전 시 필요한 곳에서 useQuery로 감싼다).
 */
import axios from 'axios';
import { API_BASE_URL, CACHE_URL, LOGIN_URL, SERVICE_URL } from '../../config/api.constants';

const bearer = (token: string) => ({ Authorization: 'Bearer ' + token });

export const getKaKaoMyInfo = (accessToken: string) =>
  axios({ method: 'GET', url: 'https://kapi.kakao.com/v2/user/me', headers: bearer(accessToken) });

export const getNaverMyInfo = (accessToken: string) =>
  axios({ method: 'GET', url: 'https://openapi.naver.com/v1/nid/me', headers: bearer(accessToken) });

export const getAllMathCollection = () => axios({ url: API_BASE_URL + '/public/collections', method: 'GET' });

export const getMathCollectionsOfSubject = (subjectId: number) =>
  axios({ url: API_BASE_URL + '/public/getAllMathCollectionsOfSubject/' + subjectId, method: 'GET' });

export const getCollectionsInChapter = (chapterId: number) =>
  axios({ url: API_BASE_URL + '/public/getCollectionsInChapter/' + chapterId, method: 'GET' });

export const getMontlyMathPreExams = (subject: string, year: number | string, month: number | string) =>
  axios({ url: CACHE_URL + '/pre-exams/' + subject + '/' + year + '/' + month, method: 'GET' });

export type PreExamQuery = Record<string, unknown> & { major?: string; queryType?: string };

export function getMemberMathPreExams(token: string, query: PreExamQuery) {
  // A: 문과, B: 이과
  query.queryType = 'selection';
  const url = query.major === 'A' || query.major === 'B' ? CACHE_URL + '/api/search' : CACHE_URL + '/api/search2';
  return axios({ method: 'POST', url, data: query, headers: { Authorization: `Bearer ${token}` } });
}

export const getMyMemoUnreadResponseCount = (token: string) =>
  axios({ url: API_BASE_URL + '/user/unread-memo-count', method: 'GET', headers: bearer(token) });

export const getMyNoticeUnreaCount = (token: string) =>
  axios({ url: API_BASE_URL + '/user/unread-notice-count', method: 'GET', headers: bearer(token) });

export const getTodayLiveClass = (token: string) =>
  axios({ url: API_BASE_URL + '/today-live-classes', method: 'GET', headers: bearer(token) });

export const getAllMonthlyLiveClasses = (month: string, token: string) =>
  axios({ url: API_BASE_URL + '/monthly-live-classes/' + month, method: 'GET', headers: bearer(token) });

export const getAllHotlineClasses = () => axios({ url: 'https://activity.qoolla.com/hotline-classes', method: 'GET' });

export const setLastNoticeBoardVisitTimeFlag = (token: string) =>
  axios({ method: 'POST', url: API_BASE_URL + '/user/last-notice-board', headers: { Authorization: `Bearer ${token}` } });

export const setLastMemoVisitFlag = (memoResponseId: number, token: string) =>
  axios.post(API_BASE_URL + '/user/last-memo-read', { memoResponseId }, { headers: { Authorization: `Bearer ${token}` } });

export const getEssaysOfMathChapter = (chapterId: number) =>
  axios({ url: CACHE_URL + '/api/chapter-essays/' + chapterId, method: 'GET' });

export const getEssay = (essayId: number) => axios({ url: CACHE_URL + '/api/essay/' + essayId, method: 'GET' });

export const getUnitsOfMathCollection = (packageId: number) =>
  axios({ url: CACHE_URL + '/collection/' + packageId, method: 'GET' });

export const getUnitOfID = (unitId: number) => axios({ url: CACHE_URL + '/api/cunit/' + unitId, method: 'GET' });

export const getConceptTitlesOfMathChapter = (chapterId: number) =>
  axios({ url: CACHE_URL + '/subject-toc/' + chapterId, method: 'GET' });

export const getMathSubjectTree = () => axios({ url: CACHE_URL + '/math-subject-tree', method: 'GET' });

export const getActiveChapters = () => axios({ url: CACHE_URL + '/math-chapters', method: 'GET' });

export const getRecentScriptForPortraitModeCanvas = () =>
  axios({ url: CACHE_URL + '/api/portrait-recent-120', method: 'GET' });

/** 기존 hello/ 버전(15초 타임아웃, 실패 시 undefined)을 채택 */
export async function helloQoollaService(token: string, provider: string) {
  try {
    return await axios.post(
      LOGIN_URL + '/api/hello',
      { provider, password: token },
      { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 15000 },
    );
  } catch {
    return undefined;
  }
}

export const myInfo = (token: string) => axios({ url: API_BASE_URL + '/user/me', method: 'GET', headers: bearer(token) });

export const requestStorageUrl = (fileName: string, token: string) =>
  axios({ method: 'POST', url: SERVICE_URL + '/api/storage', data: { fileName }, headers: { Authorization: `Bearer ${token}` } });

export function saveStudyNoteImage(
  noteId: number,
  startDate: string,
  completeDate: string,
  achievementRatio: number,
  expectations: unknown,
  results: unknown,
  supplementaries: unknown,
) {
  const req = { noteId, startDate, completeDate, achievementRatio, expectations, results, supplementaries, hello: Math.floor(Math.random() * 1000000) };
  return axios.post('https://m-init.qoolla.com/api/study-note-upload', req);
}
