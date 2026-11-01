/**
 * Supabase 클라이언트(명세서 §7.3). 공개(publishable) 키만 쓴다 — 값은 .env / EAS 환경변수의 EXPO_PUBLIC_*.
 * 로그인에는 쓰지 않는다(로그인은 기존 앱 방식, oauth.ts). 민감 자료 저장용으로 쓸 예정이라 세션을 두지 않는다.
 */
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const anonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(url && anonKey);

export const supabase = createClient(url ?? 'https://not-configured.invalid', anonKey ?? 'not-configured', {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
