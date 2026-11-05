// 폰 화면 전체를 쓰는 화면: 하단 탭 바와 아래 광고 자리를 모두 숨긴다.
// 풀이 캔버스(/notebook)와, 폰 탭 Stack의 결과 child 화면(문제 목록·주제 문제·해답).
const TAB_RESULT = /^\/(timeline|search|chat)\/(problems|topic|solution)$/;

export function isFullScreenRoute(pathname: string): boolean {
  return pathname === '/notebook' || TAB_RESULT.test(pathname);
}
