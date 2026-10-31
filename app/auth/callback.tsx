import { Redirect } from 'expo-router';

// OAuth 리디렉트 착지점(com.qoolla.student://auth/callback). 코드 교환은 signInWithProvider가 처리하므로
// 이 화면에 직접 도착하면(예: 브라우저 세션 밖에서 열린 경우) 로그인 화면으로 돌려보낸다.
export default function AuthCallback() {
  return <Redirect href="/welcome" />;
}
