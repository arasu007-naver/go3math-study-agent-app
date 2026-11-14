// 폰 화면 전체를 쓰는 화면: 하단 탭 바와 아래 광고 자리를 모두 숨긴다.
// 풀이 캔버스(/notebook)·주제 실황·선생님 수업 캔버스(/topic-live-class, /hotline-class)와, 폰 탭 Stack의 결과 child 화면(문제 목록·주제 문제·해답, Diary의 그날 기록·답안 예시).
const TAB_RESULT = /^\/(timeline|search|chat)\/(problems|topic|solution)$/;
// Diary 탭 Stack의 child(그날 풀이 기록·답안 예시)
const DIARY_RESULT = /^\/diary\/(day|solution)$/;

// 캔버스 화면(루트 Stack의 라우트 이름). 들어가 있는 동안 세로로 고정한다(app/_layout.tsx) — 나가면 다른 화면의 기본값(고정 없음)으로 돌아간다.
export const CANVAS_ROUTES = ['notebook', 'topic-live-class', 'hotline-class'] as const;

export function isFullScreenRoute(pathname: string): boolean {
  return pathname === '/notebook' || pathname === '/topic-live-class' || pathname === '/hotline-class' || TAB_RESULT.test(pathname) || DIARY_RESULT.test(pathname);
}
