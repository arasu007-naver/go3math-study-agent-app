import { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useLazyQuery, useSubscription } from '@apollo/client/react';
import { LIVE_CLASS_CLOCK } from '@/src/api/graphql/queries';
import { LIVE_CLASS_CLOCK_TICK } from '@/src/api/graphql/subscriptions';
import { colors, type } from '@/src/ui/theme';
import { formatStartTime } from './formatStartTime';

type Props = { classType: 'TOPIC' | 'HOTLINE'; classKey: string; active: boolean };

// 서버가 관리하는 최초 On Air 시각. 조회 후 구독으로 최신 값을 따른다. 실패해도 수업 화면에는 영향 없다
export default function LiveClassStartTime({ classType, classKey, active }: Props) {
  const [startedAt, setStartedAt] = useState<string | null>(null);
  const [fetchClock] = useLazyQuery(LIVE_CLASS_CLOCK, { fetchPolicy: 'network-only' });

  useEffect(() => {
    if (!active || !classKey) return;
    let cancelled = false;
    void Promise.resolve(fetchClock({ variables: { classType, classKey } }))
      .then((res: any) => {
        if (!cancelled && res?.data?.liveClassClock) setStartedAt(res.data.liveClassClock.startedAt ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [active, classType, classKey, fetchClock]);

  useSubscription(LIVE_CLASS_CLOCK_TICK, {
    variables: { classType, classKey },
    skip: !active || !classKey,
    onData: ({ data }: any) => {
      const clock = data?.data?.liveClassClockTick;
      if (clock) setStartedAt(clock.startedAt ?? null);
    },
    onError: () => {},
  });

  return (
    <Text testID="live-class-start-time" style={styles.text}>
      수업 시작 {formatStartTime(startedAt)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { ...type.caption, color: colors.danger },
});
