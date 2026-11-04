/**
 * Welcome(로그인) 화면 — 기존 `pages/welcome/index.tsx` 구성을 따른다:
 * 로고 배너 → 소셜 로그인 아이콘(Apple은 iOS만, Google, Naver, Kakao) → 카테고리 칩(2026 / 모의 기출 / 과목별 / 소개) → 공개 콘텐츠 패널.
 * 로그인은 기존 앱과 같음 — 각 네이티브 SDK 토큰을 www.qoolla.com /api/hello로 교환(src/auth/oauth.ts). 광고 래퍼(AdMob) 제외.
 * 공개 패널: 2026·모의 기출은 kit ExamSearchPanel 재사용('가자' → public-questions → '해답' → public-solution),
 *   과목별은 kit TopicTabsPanel(기존 MentorTopicsPanel) — 토픽 선택 시 public-questions(topicId). 소개(info-section)는 아직 미이전.
 */
import { useState } from 'react';
import { ActivityIndicator, Image, Platform, Pressable, StyleSheet, Text, View, useWindowDimensions, type ImageSourcePropType } from 'react-native';
import { Redirect, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createTopicFetchers } from '@/src/adapters/topicFetchers';
import { signInWithProvider, type OAuthProvider } from '@/src/auth/oauth';
import { devGuestStore, useAuthGate } from '@/src/auth/useAuthGate';
import { MATH_TOPIC_SUBJECTS } from '@/src/config/exam.constants';
import { ExamSearchPanel } from '@/src/kit/exam-search/ExamSearchPanel';
import type { ExamQuery } from '@/src/kit/exam-search/query';
import { TopicTabsPanel } from '@/src/kit/topic-panel/TopicTabsPanel';
import { useDeviceMode } from '@/src/layout/deviceMode';
import { apolloClient } from '@/src/state/bootstrap';
import { storage } from '@/src/storage';
import { uiStore } from '@/src/state/ui';
import { colors, type } from '@/src/ui/theme';

const ORANGE = colors.accent;
const topicFetchers = createTopicFetchers(apolloClient);
const logo = require('@/assets/images/welcome/go3math-one-line-logo.png');
const icons = {
  apple: require('@/assets/images/welcome/apple.png'),
  google: require('@/assets/images/welcome/google.png'),
  naver: require('@/assets/images/welcome/naver.png'),
  kakao: require('@/assets/images/welcome/kakao.png'),
};

// 기존 CategoryButtons(currentPublicCategory: recent / pre / topic / intro)
const CATEGORIES = [
  { key: 'recent', label: '2026' },
  { key: 'pre', label: '모의 기출' },
  { key: 'topic', label: '과목별' },
  { key: 'intro', label: '소개' },
] as const;

export default function WelcomeScreen() {
  const gate = useAuthGate();
  const { width } = useWindowDimensions();
  const isTablet = useDeviceMode() === 'tablet';
  const category = uiStore.useStore().currentPublicCategory;
  const [busy, setBusy] = useState<OAuthProvider | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (gate === 'signedIn') return <Redirect href="/" />;

  const login = async (provider: OAuthProvider) => {
    setBusy(provider);
    setMessage(null);
    try {
      const r = await signInWithProvider(provider);
      console.log(`[login] ${provider}:`, r.ok ? 'ok' : r.reason);
      if (!r.ok && r.reason !== 'cancelled') setMessage(`로그인하지 못했어요: ${r.reason}`);
    } catch (e) {
      console.warn(`[login] ${provider} threw:`, e);
      setMessage(`로그인하지 못했어요: ${String((e as Error)?.message ?? e)}`);
    } finally {
      setBusy(null);
    }
  };

  // 기존 goNotePage처럼 고른 조건으로 공개 문제 목록(PublicQuestionsViewScreen)을 연다
  const openQuestions = (q: ExamQuery) =>
    router.push({
      pathname: '/public-questions',
      params: { subject: q.major, years: q.years.join(','), months: q.months.join(','), numbers: q.numbers.join(',') },
    });

  const panel = () => {
    switch (category) {
      case 'recent':
        return <ExamSearchPanel key="recent" mode="this_year" store={storage} onSubmit={openQuestions} />;
      case 'pre':
        return <ExamSearchPanel key="pre" mode="pre_exam" store={storage} onSubmit={openQuestions} />;
      case 'topic':
        // 기존 MentorTopicsPanel(→ kit TopicTabsPanel). 토픽을 고르면 그 토픽의 문제 목록
        return (
          <TopicTabsPanel
            fetchers={topicFetchers}
            subjects={MATH_TOPIC_SUBJECTS}
            store={storage}
            onSelectTopic={(t) => router.push({ pathname: '/public-questions', params: { topicId: String(t.id), title: t.title } })}
          />
        );
      default:
        return <Text style={styles.pending}>소개 화면은 준비 중이에요.</Text>;
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={[styles.banner, { width: isTablet ? (width - 48) / 2 : width - 48 }]}>
        <Image source={logo} resizeMode="stretch" style={styles.bannerImg} accessibilityLabel="Go3Math" />
      </View>

      <View style={styles.oauthRow}>
        {Platform.OS === 'ios' && <IconButton label="Apple로 로그인" source={icons.apple} busy={busy === 'apple'} onPress={() => login('apple')} />}
        <IconButton label="Google로 로그인" source={icons.google} busy={busy === 'google'} onPress={() => login('google')} />
        <IconButton label="네이버로 로그인" source={icons.naver} busy={busy === 'naver'} onPress={() => login('naver')} />
        <IconButton label="카카오로 로그인" source={icons.kakao} busy={busy === 'kakao'} onPress={() => login('kakao')} />
      </View>
      {message && <Text style={styles.message}>{message}</Text>}

      <View style={styles.chips}>
        {CATEGORIES.map((c) => {
          const on = c.key === category;
          return (
            <Pressable
              key={c.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => uiStore.dispatch({ type: 'CHANGE_PUBLIC_CATEGORY', item: { category: c.key } })}
              style={[styles.chip, { backgroundColor: on ? ORANGE : '#E5E5E5' }]}>
              <Text style={styles.chipText}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.panel}>{panel()}</View>

      {__DEV__ && (
        <Pressable accessibilityRole="button" onPress={() => devGuestStore.dispatch(true)} style={styles.devSkip}>
          <Text style={styles.devSkipText}>로그인 없이 둘러보기 (개발 빌드 전용)</Text>
        </Pressable>
      )}
    </SafeAreaView>
  );
}

function IconButton({ label, source, onPress, busy }: { label: string; source: ImageSourcePropType; onPress(): void; busy?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} disabled={busy} style={({ pressed }) => [styles.iconBtn, pressed && { transform: [{ scale: 0.92 }] }]}>
      {busy ? <ActivityIndicator color={ORANGE} /> : <Image source={source} style={styles.icon} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF', paddingTop: 12 },
  banner: { height: 120, padding: 6, borderRadius: 12, backgroundColor: ORANGE },
  bannerImg: { width: '100%', height: '100%', borderRadius: 9 },
  oauthRow: { height: 72, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  iconBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  icon: { width: 48, height: 48, resizeMode: 'contain' },
  message: { ...type.body, color: colors.accentText, paddingHorizontal: 16, textAlign: 'center' },
  chips: { height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  chip: { minHeight: 36, minWidth: 64, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  chipText: { ...type.body, color: colors.text },
  panel: { flex: 1, alignSelf: 'stretch', marginHorizontal: 12, marginBottom: 8, borderRadius: 9, borderWidth: 1, borderColor: colors.line, overflow: 'hidden' },
  pending: { padding: 24, ...type.body, color: colors.muted },
  devSkip: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  devSkipText: { ...type.body, color: colors.muted, textDecorationLine: 'underline' },
});
