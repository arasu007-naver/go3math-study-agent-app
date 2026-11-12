/**
 * 기출 검색 패널 — 기존 `tablet-this-year-exams.tsx`, `tablet-pre-exams.tsx`(+폰 쌍)를 하나로 합쳐 재작성.
 * mode 'this_year' = 올해 시험(연도 2026 고정), 'pre_exam' = 지난 기출(연도 선택).
 * AppCtx/useNavigation/Apollo 없음. 에이전트 프리셋(preset)을 받고, "가자"는 완성된 쿼리를 onSubmit으로 올린다.
 * 마지막 계열은 기존 키(`recent-exam-subject` / `pre-exam-subject`)에 그대로 저장한다.
 */
import { useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { colors, space, type } from '../../ui/theme';
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
            <Chip key={s.value} label={s.label} accessibilityRole="radio" selected={s.value === subject} onPress={() => changeSubject(s.value)} />
          ))}
        </ChipRow>
        {mode === 'pre_exam' && (
          <ChipRow label="연도" onClear={() => setYears([])}>
            {yearOptions.map((y) => (
              <Chip key={y.value} label={y.label} accessibilityRole="checkbox" selected={years.includes(y.value)} onPress={() => setYears(toggle(years, y.value))} />
            ))}
          </ChipRow>
        )}
        <ChipRow label="시행월" onClear={() => setMonths([])}>
          {monthOptions.map((m) => (
            <Chip key={m.value} label={m.label} accessibilityRole="checkbox" selected={months.includes(m.value)} onPress={() => setMonths(toggle(months, m.value))} />
          ))}
        </ChipRow>
        <ChipRow label="번호" onClear={() => setNumbers([])}>
          {PRE_EXAMS_ASSETS.numbers.map((n) => (
            <Chip key={n.value} label={n.label} accessibilityRole="checkbox" selected={numbers.includes(n.value)} onPress={() => setNumbers(toggle(numbers, n.value))} />
          ))}
        </ChipRow>
        {notice && <Text style={styles.notice}>{notice}</Text>}
        <View style={styles.goRow}>
          <Button variant="primary" size="sm" title="가자!!!" onPress={submit} />
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * 행 하나. onClear가 있으면 라벨이 그 행의 선택을 모두 지우는 버튼이다(단계 4b D4 — 라벨이 초기화 버튼으로도 쓰인다).
 * 계열처럼 하나를 꼭 고르는 행은 onClear 없이 글자 라벨만 둔다.
 */
function ChipRow({ label, onClear, children }: { label: string; onClear?: () => void; children: ReactNode }) {
  return (
    <View style={styles.row}>
      {onClear ? (
        <Button variant="secondary" size="sm" icon="refresh" title={`${label} 선택`} accessibilityHint="선택을 모두 지웁니다" onPress={onClear} />
      ) : (
        <Text style={styles.rowLabel}>{label}</Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.card },
  // 행 라벨 + 공용 칩, 행 사이 구분선.
  // "가자!!!"는 떠 있는 버튼 대신 마지막 행 아래 오른쪽 — 폰 하단 instruction 모달에 가리지 않게 스크롤 여유를 둔다.
  content: { padding: 3, paddingBottom: 300 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: space.xs,
    padding: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
  },
  rowLabel: { ...type.bodyStrong, color: colors.subtle, paddingHorizontal: space.sm },
  // 1안: 글자용 warn 토큰이 없어 danger를 쓴다(새 토큰 없음)
  notice: { ...type.body, color: colors.danger, padding: 6 },
  goRow: { alignItems: 'flex-end', paddingVertical: 12, paddingRight: 12 },
});
