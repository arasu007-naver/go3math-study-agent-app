// 폰 화면 전체를 쓰는 화면: 하단 탭 바와 아래 광고 자리를 모두 숨긴다.
// 풀이 캔버스(/notebook)·주제 실황·선생님 수업 캔버스(/topic-live-class, /hotline-class)와, 폰 탭 Stack의 결과 child 화면(문제 목록·주제 문제·해답, Diary의 그날 기록·답안 예시).
const TAB_RESULT = /^\/(timeline|search|chat)\/(problems|topic|solution)$/;
// Diary 탭 Stack의 child(그날 풀이 기록·답안 예시)
const DIARY_RESULT = /^\/diary\/(day|solution)$/;

export function isFullScreenRoute(pathname: string): boolean {
  return pathname === '/notebook' || pathname === '/topic-live-class' || pathname === '/hotline-class' || TAB_RESULT.test(pathname) || DIARY_RESULT.test(pathname);
}
