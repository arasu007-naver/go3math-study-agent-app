import { Stack } from 'expo-router';

// 그날 기록으로 바로 들어와도(재시작·리로드) 그 아래에 달력 화면을 깔아 '뒤로'가 달력으로 돌아가게 한다
export const unstable_settings = { initialRouteName: 'index' };

// 폰 'Diary' 탭: 달력·공지 첫 화면 위에 그날 풀이 기록 → 답안 예시가 child로 쌓인다
export default function DiaryTabLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      <Stack.Screen name="index" options={{ title: 'Diary', headerShown: false }} />
    </Stack>
  );
}
