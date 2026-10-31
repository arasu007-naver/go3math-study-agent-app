/**
 * 기출 검색 패널 — 기존 `tablet-this-year-exams.tsx`, `tablet-pre-exams.tsx`(+폰 쌍)를 하나로 합쳐 재작성.
 * mode 'this_year' = 올해 시험(연도 2026 고정), 'pre_exam' = 지난 기출(연도 선택).
 * AppCtx/useNavigation/Apollo 없음. 에이전트 프리셋(preset)을 받고, "가자"는 완성된 쿼리를 onSubmit으로 올린다.
 * 마지막 계열은 기존 키(`recent-exam-subject` / `pre-exam-subject`)에 그대로 저장한다.
 */
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PRE_EXAMS_ASSETS, currentSubjects, thisMonths } from '../../config/exam.constants';
import {
  buildPreExamQuery,
  buildThisYearQuery,
  defaultYearsFor,
  isCurrentCurriculum,
  toggle,
  type ExamQuery,
  type ExamSelection,
} from './query';

export type ExamSearchMode = 'this_year' | 'pre_exam';

const STORAGE_KEY: Record<ExamSearchMode, string> = { this_year: 'recent-exam-subject', pre_exam: 'pre-exam-subject' };

type Props = {
  mode: ExamSearchMode;
  preset?: Partial<ExamSelection>;
  store?: { getString(k: string): string | undefined; set(k: string, v: string): void };
  onSubmit(query: ExamQuery): void;
};

export function ExamSearchPanel({ mode, preset, store, onSubmit }: Props) {
  const subjects = mode === 'this_year' ? currentSubjects : PRE_EXAMS_ASSETS.subjects;
  const [subject, setSubject] = useState(() => {
    const stored = store?.getString(STORAGE_KEY[mode]);
    const pick = preset?.subject ?? stored ?? 'CALCULUS';
    return subjects.some((s) => s.value === pick) ? pick : 'CALCULUS';
  });
  const [years, setYears] = useState<number[]>(preset?.years ?? (mode === 'this_year' ? [2026] : defaultYearsFor(subject)));
  const [months, setMonths] = useState<number[]>(preset?.months ?? (mode === 'this_year' ? [10] : [11]));
  const [numbers, setNumbers] = useState<number[]>(preset?.numbers ?? []);
  const [notice, setNotice] = useState<string | null>(null);

  const changeSubject = (value: string) => {
    if (value === subject) return;
    setSubject(value);
    store?.set(STORAGE_KEY[mode], value);
    if (mode === 'pre_exam') {
      setYears(defaultYearsFor(value));
      setNumbers([]);
    }
  };

  const submit = () => {
    setNotice(null);
    if (mode === 'this_year') return onSubmit(buildThisYearQuery({ subject, months, numbers }));
    const q = buildPreExamQuery({ subject, years, months, numbers });
    if ('error' in q) return setNotice(`문항이 너무 많아요(${q.unitCount}개). 60개 이하로 좁혀 주세요.`);
    onSubmit(q);
  };

  const yearOptions = isCurrentCurriculum(subject) ? PRE_EXAMS_ASSETS.currentStepAgendaYears : PRE_EXAMS_ASSETS.preStepAgendaYears;
  const monthOptions = mode === 'this_year' ? thisMonths : PRE_EXAMS_ASSETS.months;

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <ChipRow label="계열">
          {subjects.map((s) => (
            <Chip key={s.value} label={s.label} on={s.value === subject} onPress={() => changeSubject(s.value)} />
          ))}
        </ChipRow>
        {mode === 'pre_exam' && (
          <ChipRow label="연도">
            {yearOptions.map((y) => (
              <Chip key={y.value} label={y.label} on={years.includes(y.value)} onPress={() => setYears(toggle(years, y.value))} />
            ))}
          </ChipRow>
        )}
        <ChipRow label="시행월">
          {monthOptions.map((m) => (
            <Chip key={m.value} label={m.label} on={months.includes(m.value)} onPress={() => setMonths(toggle(months, m.value))} />
          ))}
        </ChipRow>
        <ChipRow label="번호">
          {PRE_EXAMS_ASSETS.numbers.map((n) => (
            <Chip key={n.value} label={n.label} on={numbers.includes(n.value)} onPress={() => setNumbers(toggle(numbers, n.value))} />
          ))}
        </ChipRow>
        {notice && <Text style={styles.notice}>{notice}</Text>}
      </ScrollView>
      <Pressable accessibilityRole="button" onPress={submit} style={({ pressed }) => [styles.go, pressed && styles.pressed]}>
        <Text style={styles.goText}>가자 !!!</Text>
      </Pressable>
    </View>
  );
}

function ChipRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress(): void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: on }} onPress={onPress} style={[styles.chip, on && styles.chipOn]}>
      <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { padding: 12, gap: 16, paddingBottom: 300 },
  row: { gap: 8 },
  rowLabel: { fontSize: 13, fontWeight: '700', color: '#52525B' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { minHeight: 36, minWidth: 44, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: '#A1A1AA' },
  chipOn: { backgroundColor: '#18181B', borderColor: '#18181B' },
  chipText: { fontSize: 14, color: '#18181B' },
  chipTextOn: { color: '#FFFFFF' },
  notice: { fontSize: 14, color: '#B45309' },
  go: { position: 'absolute', right: 16, top: 8, minHeight: 44, paddingHorizontal: 18, borderRadius: 10, backgroundColor: '#18181B', justifyContent: 'center' },
  goText: { color: '#FFFFFF', fontSize: 15, fontWeight: '500' },
  pressed: { opacity: 0.6 },
});
