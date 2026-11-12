/**
 * 월간 풀이 기록 달력 — 기존 `qoolla-student-app` DiaryScreen 상단의 `components/panels/record-calendar`(react-native-calendars)를
 * 의존성 없이 직접 그린 판. 보존: 둥근 주황 테두리 머리글 'YYYY M월 : 풀이 N문제', 기록 있는 날은 파란 테두리·주황 숫자·토마토색 개수 배지.
 * 바뀐 점: AppCtx·Apollo 대신 fetchers 주입. 머리글 양옆 화살표로 달을 넘긴다.
 * 기록 있는 날을 누르면 onSelectDay('YYYY-MM-DD') — 기존 onDayPress처럼 기록 없는 날은 반응하지 않는다(그날 기록 목록은 DailyRecordsList).
 */
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { KR_CALENDAR } from '../../config/ui.constants';
import { colors, layout } from '../../ui/theme';

export type MonthRecord = { day: string; recordCnt: number };

export interface RecordsCalendarFetchers {
  /** month: 'YYYY-MM'. day는 'YYYY-MM-DD' */
  fetchMonth(month: string): Promise<MonthRecord[]>;
}

/** reloadKey가 바뀌면 보고 있는 달을 다시 받는다(폰 탭에 다시 들어올 때) */
export function RecordsCalendar({
  fetchers,
  reloadKey,
  onSelectDay,
  onMonthChange,
}: {
  fetchers: RecordsCalendarFetchers;
  reloadKey?: number;
  onSelectDay?(day: string): void;
  /** 보고 있는 달('YYYY-MM')이 바뀔 때(처음 그릴 때 포함). 같은 달 공지를 맞춰 받는 데 쓴다 */
  onMonthChange?(month: string): void;
}) {
  const [month, setMonth] = useState(() => moment().startOf('month'));
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const requestId = useRef(0);
  const monthKey = month.format('YYYY-MM');

  useEffect(() => {
    onMonthChange?.(monthKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 달이 바뀔 때만 알린다
  }, [monthKey]);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    fetchers
      .fetchMonth(monthKey)
      .then((rows) => {
        if (id !== requestId.current) return;
        const next: Record<string, number> = {};
        for (const r of rows) next[r.day] = (next[r.day] ?? 0) + r.recordCnt;
        setCounts(next);
      })
      .catch((e) => {
        if (id === requestId.current) {
          console.warn('[diary]', e);
          setCounts({});
        }
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, [fetchers, monthKey, reloadKey]);

  // 일요일 시작 6주 이하 격자. 앞뒤 칸은 이웃 달 날짜(회색)
  const weeks = useMemo(() => {
    const start = month.clone().startOf('week');
    const end = month.clone().endOf('month').endOf('week');
    const out: moment.Moment[][] = [];
    for (const d = start.clone(); d.isSameOrBefore(end, 'day'); d.add(1, 'day')) {
      if (d.day() === 0) out.push([]);
      out[out.length - 1].push(d.clone());
    }
    return out;
  }, [month]);

  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const today = moment().format('YYYY-MM-DD');

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="이전 달"
          onPress={() => setMonth((m) => m.clone().subtract(1, 'month'))}
          style={styles.arrow}>
          <Ionicons name="chevron-back" size={22} color={colors.accent} />
        </Pressable>
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {month.year()} {month.month() + 1}월 : 풀이 {total}문제
          </Text>
          {loading && <ActivityIndicator size="small" color={colors.accent} style={styles.spinner} />}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="다음 달"
          onPress={() => setMonth((m) => m.clone().add(1, 'month'))}
          style={styles.arrow}>
          <Ionicons name="chevron-forward" size={22} color={colors.accent} />
        </Pressable>
      </View>

      <View style={styles.week}>
        {KR_CALENDAR.dayNamesShort.map((n) => (
          <Text key={n} style={styles.dayHeader}>
            {n}
          </Text>
        ))}
      </View>

      {weeks.map((w) => (
        <View key={w[0].format('YYYY-MM-DD')} style={styles.week}>
          {w.map((d) => {
            const key = d.format('YYYY-MM-DD');
            const inMonth = d.month() === month.month();
            const cnt = inMonth ? counts[key] : undefined;
            return (
              <View key={key} style={styles.cell}>
                <Pressable
                  disabled={!cnt || !onSelectDay}
                  onPress={() => onSelectDay?.(key)}
                  accessibilityRole={cnt ? 'button' : undefined}
                  accessibilityLabel={cnt ? `${d.date()}일 풀이 ${cnt}문제` : undefined}
                  style={({ pressed }) => [
                    styles.day,
                    !!cnt && styles.dayMarked,
                    key === today && !cnt && styles.dayToday,
                    pressed && styles.dayPressed,
                  ]}>
                  <Text style={[styles.dayText, !inMonth && styles.dayOther, !!cnt && styles.dayTextMarked]}>{d.date()}</Text>
                  {!!cnt && (
                    <View style={styles.badge}>
                      <Text numberOfLines={1} style={styles.badgeText}>{cnt}</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const DAY = 40;

const styles = StyleSheet.create({
  root: { paddingHorizontal: 12, paddingBottom: 8, backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  arrow: { width: layout.hit, height: layout.hit, alignItems: 'center', justifyContent: 'center' },
  // 기존 renderHeader: 240×36, 주황 테두리, 둥근 끝
  header: {
    width: 240,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'orange',
    borderRadius: 24,
  },
  headerText: { fontSize: 15, color: '#000000' },
  spinner: { position: 'absolute', right: 10 },
  week: { flexDirection: 'row', justifyContent: 'space-around' },
  dayHeader: { flex: 1, textAlign: 'center', marginTop: 8, marginBottom: 6, fontSize: 16, fontWeight: 'bold', color: '#000000' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 2 },
  day: { width: DAY, height: DAY, justifyContent: 'flex-end', alignItems: 'flex-start', padding: 6, borderRadius: 6 },
  dayMarked: { borderWidth: 1, borderColor: 'blue' },
  dayToday: { backgroundColor: colors.cardMuted },
  dayPressed: { opacity: 0.6 },
  dayText: { fontSize: 14, color: '#000000' },
  dayOther: { color: 'gray' },
  dayTextMarked: { color: 'orange' },
  badge: {
    position: 'absolute',
    right: -4,
    top: -4,
    // 좌우 둥근 한 줄(pill): 높이 고정, 폭은 숫자 길이만큼(row라 글자가 줄바꿈되지 않는다)
    flexDirection: 'row',
    height: 18,
    minWidth: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: 'tomato',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, lineHeight: 16, color: '#FFFFFF', fontWeight: 'bold' },
});
