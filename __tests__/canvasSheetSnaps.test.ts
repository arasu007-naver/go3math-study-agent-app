import fs from 'fs';
import path from 'path';
import { CANVAS_SHEET_SNAPS } from '../src/kit/canvas/FloatingToolbar';

jest.mock('react-native-webview', () => ({ WebView: () => null }));

const read = (f: string) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('canvas sheets snap to 보기 50% and 넓게 70%', () => {
  expect([...CANVAS_SHEET_SNAPS]).toEqual(['50%', '70%']);
});

// 이 두 라우트는 렌더 테스트가 없어 소스로 고정한다. 시트 높이·inset·본문 규칙은 canvasStudySheet.test.tsx가 한 번 고정한다
test.each(['app/hotline-class.tsx', 'app/topic-live-class.tsx'])('%s opens the merged 개념·해답 sheet', (f) => {
  const src = read(f);
  expect(src).toMatch(/canvasAction\('study', '개념·해답', 'book-outline'/);
  expect(src).not.toMatch(/'eye-outline'/);
  expect(src).toMatch(/<CanvasStudySheet[\s\S]*sheetRef=\{sheetRef\}[\s\S]*answerLabel="답안 예시"/);
  expect(src).not.toMatch(/<BottomSheetModal\s/); // JSX 시트만 — useRef<BottomSheetModal> 타입 인자는 남는다
  expect(src).toMatch(/styles\.answerRow/);
});

// 풀이 화면: 해답 탭 라벨은 '해답/내용', 현재 문제가 개념(MATH_CONCEPT·CONCEPT)이면 해답 페이지 대신 개념 설명을 보인다
test('app/notebook.tsx labels the answer tab 해답/내용 and shows the concept statement for concept problems', () => {
  const src = read('app/notebook.tsx');
  expect(src).toMatch(/<CanvasStudySheet[\s\S]*answerLabel="해답\/내용"/);
  expect(src).toMatch(/isConceptType\(currentSheet\.sourceType\) \? \(\s*<ConceptStatement[^>]*conceptId=\{Number\(currentSheet\.sourceId\)\}/);
});
