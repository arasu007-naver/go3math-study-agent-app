/**
 * API 및 서비스 URL 관련 상수
 */

const STORAGE_BASE_URL = 'https://qoolla1storage1account.blob.core.windows.net/qoollastoragecontainer';

// === API Endpoints ===
const API_BASE_URL = 'https://api-v2.qoolla.com';
// Java(Spring) API — graphql-api-server에서 옮겨 오는 조회가 여기로 간다(`api-v2` 저장소, 배포 이름 api-v3)
const API_V3_URL = 'https://apiv3.qoolla.com';
const CACHE_URL = 'https://m-cache.qoolla.com';
const LOGIN_URL = 'https://www.qoolla.com' //'https://www.qoolla.com';
const SERVICE_URL = 'https://www.qoolla.com';
const SUBSCRIPTION_ENDPOINT = 'wss://activity.qoolla.com/graphql';
const GRAPHQL_API_URL = 'https://activity.qoolla.com/graphql';

// === Deep Link Schemes ===
const WWW_SCHEME = 'www.qoolla.com';
const APP_SCHEME = 'com.qoolla.student';
const CALENDAR_LINK_PREFIX = 'https://www.qoolla.com/calendar?noteId=';

// === Image Path Prefixes ===
const UNIT_PATH_PREFIX = `${STORAGE_BASE_URL}/math-files/images/units/`;
const BUNDLE_PATH_PREFIX = `${STORAGE_BASE_URL}/math-files/images/bundle/`;
const PREMISE_PATH_PREFIX = `${STORAGE_BASE_URL}/math-files/images/premise/`;
const ESSAY_TITLE_PATH_PREFIX = `${STORAGE_BASE_URL}/math-files/images/essay-titles/`;
const MATH_ESSAY_IMAGE_PREFIX = `${STORAGE_BASE_URL}/math-files/images/essay/`;
const MATH_CONCEPT_TITLE_IMAGE_PREFIX = `${STORAGE_BASE_URL}/math-files/images/concept-titles/`;
const DEFAULT_IMAGE_URL = `${STORAGE_BASE_URL}/public/go3mathT.png`;
const EXAMS_SCHEDULE = `${STORAGE_BASE_URL}/public/2026_exams_schedule.png`;

// === Image URL Builders ===
const UNITIMAGE = (sourceType: string, sourceId: string | number) => {
    let unitImage: string | undefined;
    switch (sourceType) {
        case 'UNIT':
            unitImage = UNIT_PATH_PREFIX + sourceId + '.png';
            break;
        case 'MATH_CONCEPT':
            unitImage = MATH_CONCEPT_TITLE_IMAGE_PREFIX + sourceId + '.png';
            break;
        case 'MATH_ESSAY':
            unitImage = MATH_ESSAY_IMAGE_PREFIX + sourceId + '.png';
            break;
        case 'PREMISE':
            unitImage = PREMISE_PATH_PREFIX + sourceId + '.png';
            break;
        case 'BUNDLE':
            unitImage = BUNDLE_PATH_PREFIX + sourceId + '.png';
            break;
        default:
            if (sourceId != null) {
                unitImage = UNIT_PATH_PREFIX + sourceId + '.png';
            } else {
                unitImage = DEFAULT_IMAGE_URL;
            }
    }
    return unitImage;
};

const UNITANSWER = (sourceType: string, sourceId: string | number) => {
    let answerUrl: string | undefined;
    switch (sourceType) {
        case 'UNIT':
            answerUrl = CACHE_URL + '/unit-answer/' + sourceId;
            break;
        case 'MATH_CONCEPT':
            answerUrl = CACHE_URL + '/concept-page/' + sourceId;
            break;
        case 'MATH_ESSAY':
            answerUrl = CACHE_URL + '/essay-answer/' + sourceId;
            break;
        case 'PREMISE':
            answerUrl = CACHE_URL + '/premise-page/' + sourceId;
            break;
        case 'BUNDLE':
            answerUrl = CACHE_URL + '/bundle-answer/' + sourceId;
            break;
        default:
            if (sourceId != null) {
                answerUrl = CACHE_URL + '/unit-answer/' + sourceId;
            }
    }
    return answerUrl;
};

const STUDY_NOTE_URL = (noteId: string | number) =>
    `${STORAGE_BASE_URL}/math-files/images/study-note/${noteId}.png`;

export {
    STORAGE_BASE_URL,
    API_BASE_URL,
    API_V3_URL,
    CACHE_URL,
    LOGIN_URL,
    SERVICE_URL,
    SUBSCRIPTION_ENDPOINT,
    GRAPHQL_API_URL,
    WWW_SCHEME,
    APP_SCHEME,
    CALENDAR_LINK_PREFIX,
    UNIT_PATH_PREFIX,
    BUNDLE_PATH_PREFIX,
    PREMISE_PATH_PREFIX,
    ESSAY_TITLE_PATH_PREFIX,
    MATH_ESSAY_IMAGE_PREFIX,
    MATH_CONCEPT_TITLE_IMAGE_PREFIX,
    DEFAULT_IMAGE_URL,
    EXAMS_SCHEDULE,
    UNITIMAGE,
    UNITANSWER,
    STUDY_NOTE_URL,
};
