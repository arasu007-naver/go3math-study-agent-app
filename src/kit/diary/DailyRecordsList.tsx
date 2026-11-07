/**
 * 그날 풀이 기록 — 기존 `qoolla-student-app` `pages/diary/daily-records-view`(DailyRecordsViewerScreen) 이식.
 * 보존: 기록마다 문제 이미지 → 선생님 첨삭(tutorNote, 쉼표로 여러 장) 또는 학생 풀이(fileName) → 오른쪽 정렬 버튼 줄(책갈피 추가 · 답안 예시),
 *       이미지는 손가락으로 확대(ReactNativeZoomableView), 기록 사이 회청색 구분선.
 * 바뀐 점: AppCtx·Apollo·navigation 대신 fetchers·콜백 주입. 기록 목록을 route params로 넘기지 않고 날짜로 직접 받는다(리로드에도 열림).
 *          확대 전에는 목록 스크롤이 먹히도록 disablePanOnInitialZoom.
 * 아직 안 옮김: '스크립트 보기'(feedbackScriptUrl — 이 앱에 스크립트 재생 화면이 아직 없다).
 */
import { ReactNativeZoomableView } from '@openspacelabs/react-native-zoomable-view';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { UNITIMAGE } from '../../config/api.constants';
import { colors } from '../../ui/theme';
import GoButton from '../ui/go-button';
import DynamicDimensionsImage from '../ui/image-dynamic-dims';

export type DailyRecord = {
  id: string | number;
  sourceType: string;
  sourceId: string | number;
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
}: {
  fetchers: DailyRecordsFetchers;
  day: string;
  onShowAnswer(record: DailyRecord): void;
}) {
  const { width } = useWindowDimensions();
  const [records, setRecords] = useState<DailyRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setRecords(null);
    setError(null);
    fetchers
      .fetchDay(day)
      .then((r) => alive && setRecords(r))
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

  return (
    <FlatList
      style={styles.list}
      data={records}
      keyExtractor={(r) => 'r' + r.id}
      ItemSeparatorComponent={Divider}
      renderItem={({ item }) => {
        const question = UNITIMAGE(item.sourceType, item.sourceId);
        const sheets = item.tutorNote ? item.tutorNote.split(',').filter(Boolean) : [];
        return (
          <View style={styles.record}>
            {!!question && <Zoomable uri={question} width={imgW} />}
            {sheets.length > 0
              ? sheets.map((s, i) => <Zoomable key={'feedback-' + i} uri={s} width={width - 32} />)
              : !!item.fileName && <Zoomable uri={item.fileName} width={imgW} />}
            <View style={styles.buttons}>
              <GoButton title="책갈피 추가" onPress={() => addBookmark(item)} />
              <GoButton title="답안 예시" onPress={() => onShowAnswer(item)} />
            </View>
          </View>
        );
      }}
    />
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: '#FFFFFF' },
  record: { padding: 3, backgroundColor: '#FFFFFF', alignItems: 'center' },
  buttons: { alignSelf: 'stretch', flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 6, paddingVertical: 8 },
  divider: { height: 1, width: '100%', backgroundColor: '#607D8B' },
  message: { margin: 24, textAlign: 'center', color: colors.muted },
});
