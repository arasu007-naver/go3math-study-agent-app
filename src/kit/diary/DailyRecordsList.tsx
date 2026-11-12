/**
 * 그날 풀이 기록 — 기존 `qoolla-student-app` `pages/diary/daily-records-view`(DailyRecordsViewerScreen) 이식.
 * 보존: 기록마다 문제 이미지 → 선생님 첨삭(tutorNote, 쉼표로 여러 장) 또는 학생 풀이(fileName) → 오른쪽 정렬 버튼 줄(책갈피 추가 · 답안 예시),
 *       이미지는 손가락으로 확대(ReactNativeZoomableView), 기록 사이 회청색 구분선.
 * 바뀐 점: 같은 문제의 기록을 묶어 문제 이미지(연주황 테두리·그림자 상자) → 버튼 줄 → 그 문제 풀이 이미지들 순서로 보인다.
 *          AppCtx·Apollo·navigation 대신 fetchers·콜백 주입. 기록 목록을 route params로 넘기지 않고 날짜로 직접 받는다(리로드에도 열림).
 *          확대 전에는 목록 스크롤이 먹히도록 disablePanOnInitialZoom.
 * 아직 안 옮김: '스크립트 보기'(feedbackScriptUrl — 이 앱에 스크립트 재생 화면이 아직 없다).
 */
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { Fragment, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { UNITIMAGE } from '../../config/api.constants';
import { colors, palette, radius, shadow } from '../../ui/theme';
import GoButton from '../ui/go-button';
import DynamicDimensionsImage from '../ui/image-dynamic-dims';

export type DailyRecord = {
  id: string | number;
  sourceType: string;
  sourceId: string | number;
  /** 이 풀이를 저장한 학습 기록(task). 없으면 0/null(예전 기록) */
  taskId?: number | null;
  /** 학생이 올린 풀이 이미지 */
  fileName?: string | null;
  /** 선생님 첨삭 이미지 URL들(쉼표 구분) */
  tutorNote?: string | null;
  feedbackScriptUrl?: string | null;
  createdAt?: string | null;
};

export interface DailyRecordsFetchers {
  /** day: 'YYYY-MM-DD' */
  fetchDay(day: string): Promise<DailyRecord[]>;
  addBookmark(sourceType: string, sourceId: number): Promise<void>;
}

function Zoomable({ uri, width }: { uri: string; width: number }) {
  return (
    <ReactNativeZoomableView maxZoom={10} minZoom={0.5} zoomStep={0.5} initialZoom={1} disablePanOnInitialZoom bindToBorders>
      <DynamicDimensionsImage width={width} source={{ uri }} />
    </ReactNativeZoomableView>
  );
}

export function DailyRecordsList({
  fetchers,
  day,
  onShowAnswer,
  width: widthProp,
  scrollable = true,
  onSolve,
}: {
  fetchers: DailyRecordsFetchers;
  day: string;
  /** 없으면 '답안 예시' 버튼을 두지 않는다(태블릿 Diary dock — 해답 화면이 없다) */
  onShowAnswer?(record: DailyRecord): void;
  /** 목록 폭. 없으면 화면 폭(폰 전체 화면). 태블릿 dock처럼 좁은 곳에 둘 때 넘긴다 */
  width?: number;
  /** false면 FlatList 대신 기록을 모두 그려 바깥 ScrollView가 스크롤한다 */
  scrollable?: boolean;
  /** 있으면 문제마다 마지막 풀이 아래 한 줄 오른쪽에 '가자!!!' 버튼을 둔다(태블릿 Diary dock — 그 문제를 풀이 화면에서 다시 푼다) */
  onSolve?(target: DiarySolveTarget): void;
}) {
  const window = useWindowDimensions();
  const width = widthProp ?? window.width;
  const [records, setRecords] = useState<DailyRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setRecords(null);
    setError(null);
    fetchers
      .fetchDay(day)
      .then((r) => {
        if (!alive) return;
        setRecords(r);
      })
      .catch((e) => alive && setError(String(e?.message ?? e)));
    return () => {
      alive = false;
    };
  }, [fetchers, day]);

  if (error) return <Text style={styles.message}>기록을 불러오지 못했어요. {error}</Text>;
  if (!records) return <ActivityIndicator style={styles.message} color={colors.accent} />;
  if (records.length === 0) return <Text style={styles.message}>이 날 풀이 기록이 없어요.</Text>;

  const imgW = width - 6;
  const addBookmark = async (r: DailyRecord) => {
    try {
      await fetchers.addBookmark(r.sourceType, Number(r.sourceId));
      Alert.alert('책갈피', '책갈피가 추가되었습니다.');
    } catch (e) {
      console.warn('[diary] addBookmark', e);
      Alert.alert('책갈피', '책갈피를 추가하지 못했어요.');
    }
  };

  // 같은 문제(sourceType+sourceId)의 기록을 한 묶음으로: 문제 이미지(테두리 상자) → 버튼 줄 → 그 문제의 풀이 이미지들
  const groups = groupByProblem(records);
  const questionW = imgW - 2 * (PROBLEM_MARGIN + PROBLEM_PAD_X + 1);

  const renderGroup = (g: ProblemGroup) => {
    const question = UNITIMAGE(g.first.sourceType, g.first.sourceId);
    return (
      <View style={styles.record}>
        {!!question && (
          <View style={styles.problem}>
            <Zoomable uri={question} width={questionW} />
          </View>
        )}
        <View style={styles.buttons}>
          <GoButton title="책갈피 추가" onPress={() => addBookmark(g.first)} />
          {onShowAnswer && <GoButton title="답안 예시" onPress={() => onShowAnswer(g.first)} />}
        </View>
        {g.records.map((r, n) => {
          // 선생님 첨삭이 있으면 첨삭, 없으면 학생 풀이(기존 그대로)
          const sheets = r.tutorNote ? r.tutorNote.split(',').filter(Boolean) : [];
          return (
            <Fragment key={r.id}>
              {/* 풀이(기록) 사이 구분선 — 같은 문제를 몇 번 풀었는지 보이게 */}
              {n > 0 && <View testID="solution-divider" style={styles.solutionDivider} />}
              {sheets.length > 0
                ? sheets.map((s, i) => <Zoomable key={`feedback-${r.id}-${i}`} uri={s} width={width - 32} />)
                : !!r.fileName && <Zoomable key={`solution-${r.id}`} uri={r.fileName} width={imgW} />}
            </Fragment>
          );
        })}
        {onSolve && (
          <View style={styles.buttons}>
            <GoButton
              title="가자!!!"
              variant="filled"
              onPress={() =>
                onSolve({
                  sourceType: g.first.sourceType,
                  sourceId: Number(g.first.sourceId),
                  image: question ?? '',
                  // 이 문제의 가장 최근 풀이가 속한 task
                  taskId: [...g.records].reverse().find((r) => r.taskId)?.taskId ?? undefined,
                })
              }
            />
          </View>
        )}
      </View>
    );
  };

  // 바깥 ScrollView 안에 둘 때(태블릿 Diary dock): 목록 자체는 스크롤하지 않고 기록을 모두 그린다
  if (!scrollable) {
    return (
      <View style={styles.list}>
        {groups.map((g, i) => (
          <Fragment key={g.key}>
            {i > 0 && <Divider />}
            {renderGroup(g)}
          </Fragment>
        ))}
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={groups}
      keyExtractor={(g) => g.key}
      ItemSeparatorComponent={Divider}
      renderItem={({ item }) => renderGroup(item)}
    />
  );
}

/** '가자!!!'로 다시 풀 문제. taskId: 그 문제의 가장 최근 풀이가 속한 task(없으면 undefined) */
export type DiarySolveTarget = { sourceType: string; sourceId: number; image: string; taskId?: number };

type ProblemGroup ={ key: string; first: DailyRecord; records: DailyRecord[] };

/** 기록을 문제별로 묶는다. 묶음 순서는 그 문제가 처음 나온 순서 */
export function groupByProblem(records: DailyRecord[]): ProblemGroup[] {
  const byKey = new Map<string, ProblemGroup>();
  for (const r of records) {
    const key = `${r.sourceType}:${r.sourceId}`;
    const g = byKey.get(key);
    if (g) g.records.push(r);
    else byKey.set(key, { key, first: r, records: [r] });
  }
  return [...byKey.values()];
}

const PROBLEM_MARGIN = 8;
const PROBLEM_PAD_X = 32;

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#FFFFFF' },
  record: { padding: 3, backgroundColor: '#FFFFFF', alignItems: 'center' },
  // 문제 이미지 상자: 좌우 32 여백, 연한 주황 테두리, 그림자(배경색이 있어야 Android elevation이 보인다)
  problem: {
    alignSelf: 'stretch',
    margin: PROBLEM_MARGIN,
    paddingHorizontal: PROBLEM_PAD_X,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.brand[200],
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    ...shadow.card,
  },
  buttons: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 6, paddingVertical: 8 },
  divider: { height: 1, width: '100%', backgroundColor: '#607D8B' },
  solutionDivider: { height: 1, alignSelf: 'stretch', marginVertical: 8, backgroundColor: '#607D8B' },
  message: { margin: 24, textAlign: 'center', color: colors.muted },
});
