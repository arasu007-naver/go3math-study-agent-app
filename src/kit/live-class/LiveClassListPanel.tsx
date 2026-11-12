/**
 * 태블릿 '실황 수업' dock — 오늘의 실황 수업 목록. 기존 qoolla-student-app `src/components/chat/LiveClassPanel.tsx`
 * (+ cards/hotline-class·topic-live-class)를 옮김. dock 폭에 맞춰 두 컬럼 대신 위아래 두 구획으로 둔다.
 * - 선생님 수업(hotline live class): GET hotline-classes의 { tutor, units }
 * - 주제 실황 수업(topic live class): GET today-live-classes의 { id, title, description, classTime }
 * 항목을 누르면 그 수업의 문제 출처(ProblemSource)를 onOpen으로 올린다. 문제 목록은 ProblemListPanel이 보이고,
 * 선생님 수업이면 수업 중 문제가 늘거나 줄 때(구독 메시지) 목록도 바뀐다.
 */
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Tag } from '../../ui/Tag';
import { colors, layout, radius, space, type } from '../../ui/theme';
import type { ProblemSource } from '../problem-list/ProblemListPanel';

export type HotlineClass = { tutor: { username: string; name: string; imageUrl?: string | null }; units: unknown[] };
export type TopicLiveClass = { id: number | string; title: string; description?: string | null; classTime?: string | null };

export interface LiveClassFetchers {
  fetchHotlineClasses(): Promise<HotlineClass[]>;
  fetchTopicLiveClasses(): Promise<TopicLiveClass[]>;
}

export function LiveClassListPanel({ fetchers, onOpen }: { fetchers: LiveClassFetchers; onOpen(source: ProblemSource): void }) {
  const [hotlines, setHotlines] = useState<HotlineClass[] | null>(null);
  const [topics, setTopics] = useState<TopicLiveClass[] | null>(null);

  // dock을 열 때마다 새로 받는다(기존 loadData와 같다). 한쪽이 실패해도 다른 쪽은 보인다
  useEffect(() => {
    let alive = true;
    fetchers
      .fetchHotlineClasses()
      .catch(() => [])
      .then((r) => alive && setHotlines(r));
    fetchers
      .fetchTopicLiveClasses()
      .catch(() => [])
      .then((r) => alive && setTopics(r));
    return () => {
      alive = false;
    };
  }, [fetchers]);

  if (!hotlines || !topics) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.muted}>오늘의 수업 목록을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Section title="🧑‍🏫 선생님 수업" count={hotlines.length} empty="오늘 진행 중인 선생님 수업이 없습니다.">
        {hotlines.map((h) => (
          <Pressable
            key={h.tutor.username}
            accessibilityRole="button"
            accessibilityLabel={`${h.tutor.name} 선생님 수업 ${h.units.length}문제`}
            onPress={() => onOpen({ kind: 'hotline', tutorId: h.tutor.username, title: `🧑‍🏫 ${h.tutor.name} 선생님 수업` })}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            {h.tutor.imageUrl ? <Image source={{ uri: h.tutor.imageUrl }} style={styles.avatar} /> : <View style={styles.avatar} />}
            <View style={styles.rowText}>
              <Text style={styles.title}>{`${h.tutor.name} (${h.units.length} 문제)`}</Text>
              <Text style={styles.accent}>보충(비정규) 강의입니다</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={layout.footerIcon} color={colors.accent} />
          </Pressable>
        ))}
      </Section>
      <Section title="🎯 주제 실황 수업" count={topics.length} empty="오늘 예정된 주제 실황 수업이 없습니다.">
        {topics.map((t) => (
          <Pressable
            key={String(t.id)}
            accessibilityRole="button"
            accessibilityLabel={`주제 실황 수업 ${t.title}`}
            onPress={() => onOpen({ kind: 'topic_live', topicId: Number(t.id), title: `📝 ${t.title}` })}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <View style={styles.rowText}>
              <Text style={styles.title}>{`📝 ${t.title}`}</Text>
              {!!t.description && (
                <Text style={styles.accent} numberOfLines={2}>
                  {t.description}
                </Text>
              )}
              {!!t.classTime && <Text style={styles.time}>{`🕑 ${t.classTime} 예정`}</Text>}
            </View>
            <Ionicons name="arrow-forward-circle" size={layout.footerIcon} color={colors.accent} />
          </Pressable>
        ))}
      </Section>
    </ScrollView>
  );
}

function Section({ title, count, empty, children }: { title: string; count: number; empty: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{title}</Text>
        {count > 0 && <Tag label={count} tone="unread" />}
      </View>
      {count === 0 ? <Text style={[styles.muted, styles.empty]}>{empty}</Text> : children}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.md, gap: space.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.sm, padding: space.lg },
  section: { borderRadius: radius.md, backgroundColor: colors.card, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: space.md, backgroundColor: colors.accentSoft },
  headerTitle: { ...type.title, color: colors.accentText },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: layout.hit, padding: space.md },
  pressed: { backgroundColor: colors.accentSoftPress },
  avatar: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.accentSoft },
  rowText: { flex: 1, gap: space.xxs },
  title: { ...type.bodyStrong, color: colors.text },
  accent: { ...type.caption, color: colors.accent },
  time: { ...type.caption, color: colors.muted, textAlign: 'right' },
  muted: { ...type.caption, color: colors.muted },
  empty: { textAlign: 'center', paddingVertical: space.lg },
});
