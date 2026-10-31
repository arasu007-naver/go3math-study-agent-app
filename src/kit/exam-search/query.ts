/**
 * 기출 검색 쿼리 생성 — 기존 `tablet-this-year-exams.tsx` / `tablet-pre-exams.tsx`의 goExerciseScreen에서
 * 쿼리를 만드는 부분만 순수 함수로 분리(기본값 규칙 그대로). 과제 생성(CREATE_SELECTION_TASK)과
 * 문제 조회(getMemberMathPreExams)는 패널 밖(에이전트 서버/어댑터)이 맡는다.
 */
export type ExamQuery = {
  queryType: 'selection';
  major: string;
  years: number[];
  months: number[];
  numbers: number[];
  studyType: 'MATH_DETAILED_PRE_EXAMS';
};

export type ExamSelection = { subject: string; years: number[]; months: number[]; numbers: number[] };

const ALL_NUMBERS = Array.from({ length: 30 }, (_, i) => i + 1);
const sorted = (xs: number[]) => [...xs].sort((a, b) => a - b);

/** 2022 개정(미적분/기하/확통) 계열이면 0, 문과·이과(A/B)면 1 — 기존 prospensity */
export const isCurrentCurriculum = (subject: string) => ['CALCULUS', 'GEOMETRY', 'STATISTICS'].includes(subject);

/** 올해 시험: 연도 2026 고정, 월 미선택 시 6월, 번호 미선택 시 1~30 */
export function buildThisYearQuery({ subject, months, numbers }: Omit<ExamSelection, 'years'>): ExamQuery {
  return {
    queryType: 'selection',
    major: subject,
    years: [2026],
    months: months.length ? sorted(months) : [6],
    numbers: numbers.length ? sorted(numbers) : ALL_NUMBERS,
    studyType: 'MATH_DETAILED_PRE_EXAMS',
  };
}

export const PRE_EXAM_UNIT_LIMIT = 60;

/** 기출: 연도 미선택 시 계열별 기본 연도, 월 미선택 시 [3,4,6,9,10,11], 문항 수 60 초과면 거절(기존: 조용히 return) */
export function buildPreExamQuery({ subject, years, months, numbers }: ExamSelection): ExamQuery | { error: 'too_many'; unitCount: number } {
  const q: ExamQuery = {
    queryType: 'selection',
    major: subject,
    years: years.length
      ? sorted(years)
      : isCurrentCurriculum(subject)
        ? [2021, 2022, 2023, 2024]
        : [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020],
    months: months.length ? sorted(months) : [3, 4, 6, 9, 10, 11],
    numbers: numbers.length ? sorted(numbers) : ALL_NUMBERS,
    studyType: 'MATH_DETAILED_PRE_EXAMS',
  };
  const unitCount = q.years.length * q.months.length * q.numbers.length;
  return unitCount > PRE_EXAM_UNIT_LIMIT ? { error: 'too_many', unitCount } : q;
}

/** 계열을 바꿀 때 기존 패널이 넣던 기본 연도 */
export const defaultYearsFor = (subject: string) => (isCurrentCurriculum(subject) ? [2025] : [2020]);

export const toggle = (xs: number[], v: number) => (xs.includes(v) ? xs.filter((x) => x !== v) : [...xs, v]);
