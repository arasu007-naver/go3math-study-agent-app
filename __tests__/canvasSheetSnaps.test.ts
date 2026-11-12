import fs from 'fs';
import path from 'path';
import { CANVAS_SHEET_SNAPS } from '../src/kit/canvas/FloatingToolbar';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('canvas sheets snap to 보기 50% and 넓게 70%', () => {
  expect([...CANVAS_SHEET_SNAPS]).toEqual(['50%', '70%']);
});

// 이 두 라우트는 렌더 테스트가 없어 소스로 고정한다
test.each(['app/hotline-class.tsx', 'app/topic-live-class.tsx'])('%s answer sheet uses the two steps above the toolbar', (f) => {
  const src = read(f);
  expect(src).toMatch(/snapPoints=\{CANVAS_SHEET_SNAPS\}/);
  expect(src).toMatch(/index=\{0\}/);
  expect(src).toMatch(/bottomInset=\{/);
  expect(src).toMatch(/enableContentPanningGesture=\{false\}/);
  expect(src).not.toMatch(/height \/ 2/);
  // BottomSheetView는 내용 높이만큼만 커져 높이 없는 해답 WebView가 0이 된다 — 시트를 채우는 flex View를 쓴다
  expect(src).not.toMatch(/<BottomSheetView/);
});
