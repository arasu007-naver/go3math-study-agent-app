/**
 * 태블릿 Diary dock — 위: 월간 풀이 달력(RecordsCalendar), 아래: 탭.
 * '공지' 탭은 늘 맨 앞에 고정(달력이 보는 달의 공지). 달력에서 풀이 있는 날을 누르면 그날 탭을 추가해 열고(이미 있으면 그 탭으로),
 * 날 탭 내용은 그날 풀이(이미지) 목록(DailyRecordsList). '답안 예시'를 누르면 그 탭 안이 해답 화면으로 바뀌고 '풀이 목록'으로 돌아온다.
 * 문제마다 마지막 풀이 아래 '가자!!!' 버튼으로 그 문제를 풀이 화면에서 다시 푼다(onSolveProblem).
 * 날 탭은 ✕로 닫는다. 달력·탭 바는 고정이고 탭 내용 영역만 스크롤해 문제·풀이 이미지를 끝까지 볼 수 있다.
 */
import moment from 'moment';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { UNITANSWER } from '../../config/api.constants';
import { Button } from '../../ui/Button';
import { Chip } from '../../ui/Chip';
import { IconButton } from '../../ui/IconButton';
import { colors, space } from '../../ui/theme';
import { NoticesPanel, type NoticeFetchers } from '../notices/NoticesPanel';
import QoollaWebView from '../ui/web-view';
import { DailyRecordsList, type DailyRecord, type DailyRecordsFetchers, type DiarySolveTarget } from './DailyRecordsList';
import { RecordsCalendar, type RecordsCalendarFetchers } from './RecordsCalendar';

const NOTICE_TAB = 'notice';

export function DiaryPanel({
  recordFetchers,
  noticeFetchers,
  onSolveProblem,
}: {
  recordFetchers: RecordsCalendarFetchers & DailyRecordsFetchers;
  noticeFetchers: NoticeFetchers;
  /** 날 탭 문제마다 마지막 풀이 아래 '가자!!!' 버튼: 그 문제를 풀이 화면에서 다시 푼다 */
  onSolveProblem?(target: DiarySolveTarget): void;
}) {
  // 달력이 보고 있는 달('YYYY-MM') = 공지를 받을 달
  const [month, setMonth] = useState(() => moment().format('YYYY-MM'));
  // 연 날('YYYY-MM-DD')들, 연 순서대로
  const [days, setDays] = useState<string[]>([]);
  const [active, setActive] = useState<string>(NOTICE_TAB);
  // 탭 내용 영역 폭(풀이 이미지 폭)
  const [width, setWidth] = useState(0);
  // 날 탭별로 열어 둔 해답(없으면 그 탭은 풀이 목록)
  const [answers, setAnswers] = useState<Record<string, DailyRecord>>({});
  const hideAnswer = (day: string) =>
    setAnswers((a) => {
      const next = { ...a };
      delete next[day];
      return next;
    });

  const openDay = (day: string) => {
    setDays((ds) => (ds.includes(day) ? ds : [...ds, day]));
    setActive(day);
  };

  const closeDay = (day: string) => {
    setDays((ds) => ds.filter((d) => d !== day));
    hideAnswer(day);
    if (active === day) setActive(NOTICE_TAB);
  };

  // 달력·탭 바는 고정, 탭 내용 영역만 ScrollView로 스크롤한다.
  // 공지·풀이 목록은 스스로 스크롤하지 않고(scrollable=false) 항목을 모두 그린다. 해답 화면은 WebView가 스스로 스크롤한다
  return (
    <>
      <RecordsCalendar fetchers={recordFetchers} onMonthChange={setMonth} onSelectDay={openDay} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBar} contentContainerStyle={styles.tabBarContent}>
        <Tab label="공지" on={active === NOTICE_TAB} onPress={() => setActive(NOTICE_TAB)} />
        {days.map((d) => (
          <Tab key={d} label={moment(d).format('M월/D일')} on={active === d} onPress={() => setActive(d)} onClose={() => closeDay(d)} />
        ))}
      </ScrollView>
      {active !== NOTICE_TAB && answers[active] ? (
        <AnswerView record={answers[active]} onBack={() => hideAnswer(active)} />
      ) : (
        <ScrollView testID="diary-tab-body" style={styles.body} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
          {active === NOTICE_TAB ? (
            <NoticesPanel fetchers={noticeFetchers} month={month} scrollable={false} />
          ) : (
            width > 0 && (
              <DailyRecordsList
                key={active}
                fetchers={recordFetchers}
                day={active}
                width={width}
                scrollable={false}
                onSolve={onSolveProblem}
                onShowAnswer={(r) => setAnswers((a) => ({ ...a, [active]: r }))}
              />
            )
          )}
        </ScrollView>
      )}
    </>
  );
}

/** 날 탭 안의 해답 화면(폰은 해답 화면을 따로 연다). 위 '풀이 목록'으로 그날 목록에 돌아간다 */
function AnswerView({ record, onBack }: { record: DailyRecord; onBack(): void }) {
  return (
    <View style={styles.body}>
      <Button variant="text" icon="chevron-back" title="풀이 목록" accessibilityLabel="풀이 목록으로" onPress={onBack} style={styles.back} />
      <QoollaWebView originWhitelist={['*']} source={{ uri: UNITANSWER(record.sourceType, record.sourceId)! }} />
    </View>
  );
}

/** 단계 4b D5: 탭 = 공용 Chip(role=tab). 날 탭은 옆에 닫기 IconButton. 밑줄은 없다 */
function Tab({ label, on, onPress, onClose }: { label: string; on: boolean; onPress(): void; onClose?(): void }) {
  return (
    <View style={styles.tab}>
      <Chip label={label} accessibilityRole="tab" selected={on} onPress={onPress} />
      {onClose && <IconButton size="sm" icon="close" accessibilityLabel={`${label} 탭 닫기`} onPress={onClose} />}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: { flexGrow: 0, backgroundColor: colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  tabBarContent: { paddingHorizontal: space.sm, paddingVertical: space.xs, gap: space.xs, alignItems: 'center' },
  tab: { flexDirection: 'row', alignItems: 'center' },
  body: { flex: 1 },
  back: { alignSelf: 'flex-start' },
});
