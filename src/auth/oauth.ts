/**
 * 소셜 로그인 — 기존 앱(qoolla-student-app `components/buttons/oauth.tsx`)과 같은 방식으로 되돌림.
 * 각 네이티브 SDK로 토큰을 받아 www.qoolla.com `/api/hello`에 보내고 기존 app-token을 받는다(qoollaToken.ts).
 * - Apple: identityToken(iOS만)   - Google: idToken   - Naver: accessToken   - Kakao: idToken
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { login as kakaoLogin } from '@react-native-seoul/kakao-login';
import NaverLogin from '@react-native-seoul/naver-login';
import { helloQoolla } from './qoollaToken';

export type OAuthProvider = 'apple' | 'google' | 'kakao' | 'naver';

type SignInResult = { ok: true } | { ok: false; reason: string };

// 기존 앱과 같은 클라이언트 값(공개 식별자). 네이버 secret만 환경변수로 둔다.
const GOOGLE_WEB_CLIENT_ID = '121794604621-7btsiq1c4f2o27jf4pg3b5c3fcncskik.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = '121794604621-3pqp7qd3tea1mpvhlo1ma4vd34r11r55.apps.googleusercontent.com';

let configured = false;
function configure() {
  if (configured) return;
  configured = true;
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
  NaverLogin.initialize({
    appName: 'Go3 Math',
    consumerKey: process.env.EXPO_PUBLIC_NAVER_CLIENT_ID ?? '',
    consumerSecret: process.env.EXPO_PUBLIC_NAVER_CLIENT_SECRET ?? '',
    serviceUrlSchemeIOS: 'com.qoolla.student',
    disableNaverAppAuthIOS: true,
  });
}

/** 소셜 SDK로 토큰을 받는다. null = 사용자가 취소 */
async function getProviderToken(provider: OAuthProvider): Promise<string | null> {
  switch (provider) {
    case 'apple': {
      try {
        const c = await AppleAuthentication.signInAsync({
          requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        });
        return c.identityToken;
      } catch (e) {
        if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return null;
        throw e;
      }
    }
    case 'google': {
      try {
        await GoogleSignin.hasPlayServices();
        const r = await GoogleSignin.signIn();
        return r.type === 'success' ? r.data.idToken : null;
      } catch (e) {
        if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) return null;
        throw e;
      }
    }
    case 'naver': {
      const { successResponse, failureResponse } = await NaverLogin.login();
      if (failureResponse) {
        if (failureResponse.isCancel) return null;
        throw new Error(failureResponse.message || 'naver login failed');
      }
      return successResponse?.accessToken ?? null;
    }
    case 'kakao': {
      try {
        return (await kakaoLogin()).idToken ?? null;
      } catch (e) {
        if (String((e as Error)?.message ?? e).toLowerCase().includes('cancel')) return null;
        throw e;
      }
    }
  }
}

export async function signInWithProvider(provider: OAuthProvider): Promise<SignInResult> {
  configure();
  const token = await getProviderToken(provider);
  if (!token) return { ok: false, reason: 'cancelled' };
  await helloQoolla(token, provider);
  return { ok: true };
}
