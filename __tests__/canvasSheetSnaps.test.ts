import fs from 'fs';
import path from 'path';
import { CANVAS_SHEET_SNAPS, CANVAS_SHEET_VIEW, CANVAS_SHEET_WIDE } from '../src/kit/canvas/FloatingToolbar';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('canvas sheets snap to 30·50·70·90% and open at 보기 50% or 넓게 70%', () => {
  expect([...CANVAS_SHEET_SNAPS]).toEqual(['30%', '50%', '70%', '90%']);
  expect(CANVAS_SHEET_SNAPS[CANVAS_SHEET_VIEW]).toBe('50%');
  expect(CANVAS_SHEET_SNAPS[CANVAS_SHEET_WIDE]).toBe('70%');
});

// 이 두 라우트는 렌더 테스트가 없어 소스로 고정한다. 시트 높이·inset·본문 규칙은 canvasStudySheet.test.tsx가 한 번 고정한다
test.each(['app/hotline-class.tsx', 'app/topic-live-class.tsx'])('%s opens the merged 개념·해답 sheet', (f) => {
  const src = read(f);
  expect(src).toMatch(/canvasAction\('study', '개념·해답', 'book-outline'/);
  expect(src).not.toMatch(/'eye-outline'/);
  expect(src).not.toMatch(/<BottomSheetModal\s/); // JSX 시트만 — useRef<BottomSheetModal> 타입 인자는 남는다
});

// 세 캔버스 화면의 '해답/내용' 탭은 같은 내용(CanvasAnswer)을 보인다: 현재 문제가 개념이면 개념 설명, 아니면 해답 페이지
test.each(['app/notebook.tsx', 'app/hotline-class.tsx', 'app/topic-live-class.tsx'])('%s shows the shared 해답/내용 tab', (f) => {
  const src = read(f);
  expect(src).toMatch(/<CanvasStudySheet[\s\S]*sheetRef=\{sheetRef\}[\s\S]*answerLabel="해답\/내용"/);
  expect(src).toMatch(/<CanvasAnswer sourceType=\{currentSheet\.sourceType\} sourceId=\{currentSheet\.sourceId\} fetchConcept=\{fetchConcept\} \/>/);
  expect(src).not.toMatch(/answerLabel="답안 예시"/);
});
