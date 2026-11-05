import { Stack } from 'expo-router';

// 결과 화면으로 바로 들어와도(앱 재시작·리로드·딥 링크) 그 아래에 탭 첫 화면을 깔아 '뒤로'가 탭 화면으로 돌아가게 한다
export const unstable_settings = { initialRouteName: 'index' };

// 폰 '에이전트' 탭: 첫 화면 위에 결과 화면(문제 목록·주제 문제·해답)이 child로 쌓인다
export default function ChatTabLayout() {
  return (
    <Stack screenOptions={{ headerBackTitle: '뒤로' }}>
      {/* 탭 첫 화면은 제목 헤더 없이(탭 바 라벨이 제목). child 화면의 뒤로 버튼은 '뒤로' */}
      <Stack.Screen name="index" options={{ title: '에이전트', headerShown: false }} />
    </Stack>
  );
}
