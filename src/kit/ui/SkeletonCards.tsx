/**
 * 스켈레톤 자리 표시자 — dock 패널이 첫 결과를 받기 전까지 카드 모양의 회색 막대를 깜빡이며 보여 준다(스피너 대신).
 * 막대 모양은 패널 카드에 맞춰 avatar(왼쪽 원) · lines(본문 줄 수) · button(오른쪽 아래 버튼) · divider(연주황 구분선)로 고른다.
 */
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';

export function SkeletonCards({
  count = 4,
  lines = 2,
  avatar = false,
  button = false,
  divider = true,
}: {
  count?: number;
  lines?: number;
  avatar?: boolean;
  button?: boolean;
  divider?: boolean;
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const bar = (width: DimensionValue, height = 14, extra?: object) => <View style={[styles.bar, { width, height }, extra]} />;

  return (
    <Animated.View accessibilityRole="progressbar" accessibilityLabel="불러오는 중" style={{ opacity: pulse }}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i}>
          {i > 0 && divider && <View style={styles.divider} />}
          <View style={[styles.card, avatar && styles.row]}>
            {avatar && <View style={styles.avatar} />}
            <View style={styles.text}>
              {bar('55%', 18)}
              {Array.from({ length: lines }, (_, j) => (
                <View key={j}>{bar(j === lines - 1 ? '70%' : '100%')}</View>
              ))}
              {button && (
                <View style={styles.actions}>
                  {bar('30%', 11)}
                  {bar(88, 36, { borderRadius: 18 })}
                </View>
              )}
            </View>
          </View>
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { paddingHorizontal: 16, paddingVertical: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E4E4E7' },
  // flex: 1(기준 크기 0)이면 세로 카드에서 높이가 0이 되어 카드끼리 겹친다
  text: { flexGrow: 1, flexShrink: 1, gap: 8 },
  bar: { borderRadius: 4, backgroundColor: '#E4E4E7' },
  actions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  // 패널 카드 사이 연주황 구분선과 같은 자리
  divider: { height: 9, backgroundColor: '#FFF3E6', borderRadius: 4.5, marginVertical: 12, marginHorizontal: 16 },
});
